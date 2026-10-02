import os
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO

CLASS_NAMES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']
MIN_CONF    = 0.30   # umbral conservador — el modelo mejorará con el auto-entrenamiento

# Un box que cubre el frame entero no es un residuo: es el modelo alucinando sobre
# una escena sin nada reciclable. Medido: una persona frente a la camara devuelve
# 'paper' con conf 0.9 y un box de 998x1000 por mil.
MAX_BOX_AREA  = 0.95
# Frame practicamente uniforme => camara tapada o apagada. Umbral bajo a proposito:
# un objeto real, aunque sea liso, tiene ruido de sensor y sombras (std medido 40-60).
MIN_FRAME_STD = 3.0

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


def resolve_model_path() -> str:
    """MODEL_PATH si está seteado; si no, el .onnx exportado (~2x más rápido en CPU)
    y como último recurso el .pt original."""
    env = os.getenv('MODEL_PATH')
    if env:
        return env
    onnx = Path(__file__).parent / 'Modelos' / 'best.onnx'
    return str(onnx) if onnx.exists() else 'Modelos/best.pt'


class TrashDetector:
    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or resolve_model_path()
        self.model = YOLO(self.model_path)
        self.class_names = CLASS_NAMES

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

        results    = self.model(frame, stream=True, verbose=False)
        detections = []

        for res in results:
            for box in res.boxes:
                x1, y1, x2, y2 = box.xyxy[0]
                x1, y1, x2, y2 = max(0, int(x1)), max(0, int(y1)), max(0, int(x2)), max(0, int(y2))
                cls  = int(box.cls[0])
                conf = float(box.conf[0])
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
