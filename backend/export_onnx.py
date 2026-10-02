"""Exporta Modelos/best.pt a ONNX (~2x mas rapido en CPU que el .pt).

    python export_onnx.py

El detector usa Modelos/best.onnx automaticamente si existe. El .onnx no se
versiona (pesa 77 MB y se regenera en 15 segundos desde el .pt).
"""
from pathlib import Path
from ultralytics import YOLO

PT = Path(__file__).parent / "Modelos" / "best.pt"

if __name__ == "__main__":
    print(f"exportando {PT.name} -> ONNX ...")
    out = YOLO(str(PT)).export(format="onnx", imgsz=640)
    print(f"listo: {out}")
