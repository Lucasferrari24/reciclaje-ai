FROM python:3.11-slim

RUN apt-get update && apt-get install -y libglib2.0-0 libgl1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Torch CPU-only: evita ~2.5 GB de wheels CUDA que ultralytics arrastraria por defecto
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Exporta a ONNX en build: ~2x mas rapido en CPU. Si falla, el detector cae al .pt
RUN python export_onnx.py || echo "export ONNX fallo, se usara best.pt"

# Evita que ultralytics intente escribir su config en un HOME no writable
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
ENV MPLCONFIGDIR=/tmp/matplotlib

EXPOSE 8001

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
