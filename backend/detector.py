import os
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

CLASS_NAMES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']
MIN_CONF    = 0.30   # umbral conservador — el modelo mejorará con el auto-entrenamiento

# Un box que cubre el frame entero no es un residuo: es el modelo alucinando sobre
# una escena sin nada reciclable. Medido: una persona frente a la camara devuelve
# 'paper' con conf 0.9 y un box de 998x1000 por mil.
MAX_BOX_AREA  = 0.95
# Frame practicamente uniforme => camara tapada o apagada. Umbral bajo a proposito:
# un objeto real, aunque sea liso, tiene ruido de sensor y sombras (std medido 40-60).
MIN_FRAME_STD = 3.0

# Parametros del head de YOLO11m exportado a ONNX. Replican los defaults con los que
# ultralytics corria la inferencia, para no mover el comportamiento del modelo.
IMGSZ     = 640
NMS_IOU   = 0.70   # ultralytics predict usa iou=0.7
NMS_CONF  = 0.25   # ultralytics predict usa conf=0.25; MIN_CONF filtra despues
MAX_DET   = 300
PAD_VALUE = 114    # gris de relleno del letterbox de ultralytics

CLASS_COLORS = {
    0: '#C8A96E',  # cardboard
    1: '#a8d8ea',  # glass
    2: '#FFFF00',  # metal
    3: '#8BC34A',  # paper
    4: '#FF6B6B',  # plastic
    5: '#969696',  # trash
}

_clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))


def _preprocess(frame: np.ndarray) -> np.ndarray:
    # CLAHE sobre luminancia — mejora contraste sin saturar colores ni distorsionar bordes
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = _clahe.apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


def _letterbox(frame: np.ndarray) -> tuple[np.ndarray, float, float, float]:
    """Redimensiona manteniendo aspect ratio y rellena hasta IMGSZ x IMGSZ, centrado.
    Devuelve (imagen, gain, pad_x, pad_y) para poder desescalar los boxes despues."""
    h, w = frame.shape[:2]
    gain = min(IMGSZ / h, IMGSZ / w)
    new_w, new_h = round(w * gain), round(h * gain)
    pad_x, pad_y = (IMGSZ - new_w) / 2, (IMGSZ - new_h) / 2

    if (w, h) != (new_w, new_h):
        frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    top,  bottom = round(pad_y - 0.1), round(pad_y + 0.1)
    left, right  = round(pad_x - 0.1), round(pad_x + 0.1)
    out = cv2.copyMakeBorder(frame, top, bottom, left, right,
                             cv2.BORDER_CONSTANT, value=(PAD_VALUE,) * 3)
    return out, gain, pad_x, pad_y


def _nms(boxes: np.ndarray, scores: np.ndarray, iou_thres: float) -> list[int]:
    """NMS greedy estandar — el mismo criterio que el torchvision.ops.nms que usaba
    ultralytics por debajo. En numpy para no arrastrar torch solo por esto."""
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(int(i))
        if order.size == 1:
            break
        rest = order[1:]

        ix1 = np.maximum(x1[i], x1[rest])
        iy1 = np.maximum(y1[i], y1[rest])
        ix2 = np.minimum(x2[i], x2[rest])
        iy2 = np.minimum(y2[i], y2[rest])
        inter = np.clip(ix2 - ix1, 0, None) * np.clip(iy2 - iy1, 0, None)
        iou = inter / (areas[i] + areas[rest] - inter + 1e-9)

        order = rest[iou <= iou_thres]
    return keep


def resolve_model_path() -> str:
    """MODEL_PATH si está seteado; si no, el .onnx (lo exporta el build desde best.pt).
    Sin ultralytics/torch en runtime el .pt no se puede cargar, asi que si falta el
    .onnx es un error de build y no algo para degradar en silencio."""
    env = os.getenv('MODEL_PATH')
    if env:
        return env
    onnx = Path(__file__).parent / 'Modelos' / 'best.onnx'
    if not onnx.exists():
        raise FileNotFoundError(
            f"falta {onnx}. Se genera con `python export_onnx.py` (requiere "
            f"ultralytics+torch) o en la etapa 'exporter' del Dockerfile."
        )
    return str(onnx)


class TrashDetector:
    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or resolve_model_path()

        # El arena allocator de onnxruntime reserva de más y no devuelve: medido,
        # 459 MB de RSS tras 13 inferencias contra 165 MB sin arena, y cuesta solo
        # ~4% de latencia. En un host de 512 MB la diferencia es OOM o no.
        opts = ort.SessionOptions()
        opts.enable_cpu_mem_arena = False

        self.session = ort.InferenceSession(
            self.model_path, sess_options=opts, providers=['CPUExecutionProvider']
        )
        self.input_name = self.session.get_inputs()[0].name
        self.class_names = CLASS_NAMES

    def _infer(self, frame: np.ndarray) -> np.ndarray:
        """Corre el modelo y devuelve (N, 6): x1, y1, x2, y2, conf, cls en
        coordenadas del frame original."""
        fh, fw = frame.shape[:2]
        img, gain, pad_x, pad_y = _letterbox(frame)

        blob = img[:, :, ::-1].transpose(2, 0, 1)[None]          # BGR->RGB, HWC->NCHW
        blob = np.ascontiguousarray(blob, dtype=np.float32) / 255.0

        pred = self.session.run(None, {self.input_name: blob})[0]  # (1, 4+nc, 8400)
        pred = pred[0].T                                           # (8400, 4+nc)

        scores_all = pred[:, 4:]
        conf = scores_all.max(axis=1)
        keep = conf >= NMS_CONF
        if not keep.any():
            return np.empty((0, 6), dtype=np.float32)

        cxcywh = pred[keep, :4]
        conf   = conf[keep]
        cls    = scores_all[keep].argmax(axis=1)

        # xywh centrado -> xyxy, todavia en el espacio del letterbox
        half  = cxcywh[:, 2:4] / 2
        boxes = np.concatenate([cxcywh[:, :2] - half, cxcywh[:, :2] + half], axis=1)

        # NMS por clase: dos objetos de clases distintas pueden solaparse legitimamente
        kept: list[int] = []
        for c in np.unique(cls):
            idx = np.flatnonzero(cls == c)
            kept.extend(idx[_nms(boxes[idx], conf[idx], NMS_IOU)])
        kept = sorted(kept, key=lambda i: -conf[i])[:MAX_DET]

        boxes, conf, cls = boxes[kept], conf[kept], cls[kept]

        # Desescalar al frame original: saco el padding y divido por el gain
        boxes[:, [0, 2]] -= pad_x
        boxes[:, [1, 3]] -= pad_y
        boxes /= gain
        boxes[:, [0, 2]] = boxes[:, [0, 2]].clip(0, fw)
        boxes[:, [1, 3]] = boxes[:, [1, 3]].clip(0, fh)

        return np.column_stack([boxes, conf, cls]).astype(np.float32)

    def detect(self, frame_bytes: bytes, collector=None) -> list[dict]:
        arr   = np.frombuffer(frame_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None:
            return []

        # Frame plano → cámara tapada/apagada. Sin esto el modelo devuelve un box
        # de pantalla completa con conf alta y el colector lo guarda como dato real.
        if float(frame.std()) < MIN_FRAME_STD:
            return []

        original = frame.copy()
        fh, fw   = frame.shape[:2]
        frame    = _preprocess(frame)

        detections = []
        for x1, y1, x2, y2, conf, cls in self._infer(frame):
            x1, y1, x2, y2 = max(0, int(x1)), max(0, int(y1)), max(0, int(x2)), max(0, int(y2))
            cls, conf = int(cls), float(conf)
            if conf < MIN_CONF:
                continue

            if (x2 - x1) * (y2 - y1) > MAX_BOX_AREA * fw * fh:
                continue

            detections.append({
                'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                'cls': cls,
                'clsName': CLASS_NAMES[cls] if cls < len(CLASS_NAMES) else 'Unknown',
                'conf': round(conf, 2),
                'color': CLASS_COLORS.get(cls, '#FFFFFF'),
            })

        if collector and detections:
            collector.try_save(original, detections)

        return detections
