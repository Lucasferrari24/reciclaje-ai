# ── Etapa 1: exporta el ONNX ──────────────────────────────────────────────────
# torch + ultralytics se necesitan solo para convertir best.pt a best.onnx. Viven
# en esta etapa y no llegan a la imagen final: de ahi que baje de ~2 GB a ~250 MB.
FROM python:3.11-slim AS exporter

RUN apt-get update && apt-get install -y libglib2.0-0 libgl1 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Indice CPU: evita ~2.5 GB de wheels CUDA que ultralytics arrastraria por defecto
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision

COPY requirements-export.txt .
RUN pip install --no-cache-dir -r requirements-export.txt

ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
ENV MPLCONFIGDIR=/tmp/matplotlib

COPY export_onnx.py .
COPY Modelos/best.pt Modelos/best.pt
RUN python export_onnx.py


# ── Etapa 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim

RUN apt-get update && apt-get install -y libglib2.0-0 libgl1 && rm -rf /var/lib/apt/lists/*

# UID 1000 en vez de root: lo exige HF Spaces y ademas el proceso necesita escribir
# dataset/ al arrancar (AutoCollector crea los directorios aunque este apagado).
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR /home/user/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia explicita: el .pt de 40 MB no hace falta en runtime, sin torch no se puede
# ni cargar. Solo viaja el .onnx que produjo la etapa anterior.
COPY --chown=user main.py detector.py auto_collector.py ./
COPY --from=exporter --chown=user /build/Modelos/best.onnx Modelos/best.onnx

USER user

# 7860 es el puerto que espera HF Spaces; Render y Railway inyectan $PORT y manda ese.
EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
