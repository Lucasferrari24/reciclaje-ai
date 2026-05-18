import cv2
import time
import numpy as np
from pathlib import Path

DATASET_DIR  = Path("dataset")
IMAGES_DIR   = DATASET_DIR / "images"
LABELS_DIR   = DATASET_DIR / "labels"

MIN_CONF      = 0.85   # confianza mínima para guardar
RATE_LIMIT_S  = 3.0    # segundos mínimos entre saves de la misma clase
MAX_PER_CLASS = 300    # tope por clase para mantener balance
MIN_READY     = 100    # total de muestras para considerarse "listo para entrenar"


class AutoCollector:
    def __init__(self, class_names: list[str]):
        self.class_names = class_names
        self.last_saved: dict[int, float] = {}
        self.counts: dict[int, int] = {i: 0 for i in range(len(class_names))}

        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        LABELS_DIR.mkdir(parents=True, exist_ok=True)

        self._reload_counts()
        self._write_yaml()

    # ── Internos ──────────────────────────────────────────────────────────────

    def _reload_counts(self):
        for lf in LABELS_DIR.glob("*.txt"):
            try:
                with open(lf) as f:
                    for line in f:
                        cls = int(line.split()[0])
                        if cls in self.counts:
                            self.counts[cls] += 1
            except Exception:
                pass

    def _write_yaml(self):
        content = (
            f"path: {DATASET_DIR.absolute()}\n"
            f"train: images\n"
            f"val: images\n"
            f"nc: {len(self.class_names)}\n"
            f"names: {self.class_names}\n"
        )
        with open(DATASET_DIR / "data.yaml", "w") as f:
            f.write(content)

    # ── API pública ───────────────────────────────────────────────────────────

    def try_save(self, frame: np.ndarray, detections: list[dict]) -> int:
        """Guarda el frame si hay detecciones válidas. Devuelve cuántas clases se guardaron."""
        if not detections:
            return 0

        now = time.time()
        h, w = frame.shape[:2]

        valid = [
            d for d in detections
            if d["conf"] >= MIN_CONF
            and self.counts.get(d["cls"], 0) < MAX_PER_CLASS
            and now - self.last_saved.get(d["cls"], 0) >= RATE_LIMIT_S
        ]

        if not valid:
            return 0

        ts = int(now * 1000)
        cv2.imwrite(str(IMAGES_DIR / f"{ts}.jpg"), frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

        with open(LABELS_DIR / f"{ts}.txt", "w") as f:
            for d in valid:
                cx = (d["x1"] + d["x2"]) / 2 / w
                cy = (d["y1"] + d["y2"]) / 2 / h
                bw = (d["x2"] - d["x1"]) / w
                bh = (d["y2"] - d["y1"]) / h
                f.write(f"{d['cls']} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}\n")

        for d in valid:
            self.last_saved[d["cls"]] = now
            self.counts[d["cls"]] = self.counts.get(d["cls"], 0) + 1

        return len(valid)

    def stats(self) -> dict:
        total = sum(self.counts.values())
        return {
            "counts": {self.class_names[i]: self.counts.get(i, 0) for i in range(len(self.class_names))},
            "total": total,
            "max_per_class": MAX_PER_CLASS,
            "ready": total >= MIN_READY,
        }

    def reset(self):
        for f in IMAGES_DIR.glob("*"):
            f.unlink(missing_ok=True)
        for f in LABELS_DIR.glob("*"):
            f.unlink(missing_ok=True)
        self.counts = {i: 0 for i in range(len(self.class_names))}
        self.last_saved = {}
