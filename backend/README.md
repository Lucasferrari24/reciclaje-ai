---
title: Scrap 2.0 Backend
emoji: "♻"
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
short_description: Deteccion de residuos en tiempo real (YOLO + FastAPI/WebSocket)
---

# Scrap 2.0 — backend

Detector de residuos en tiempo real. El frontend (Vercel) manda frames JPEG por
WebSocket y recibe las cajas detectadas como JSON.

## Endpoints

| Ruta | Que hace |
|---|---|
| `GET /health` | Estado del servicio y si el modelo cargo |
| `WS /ws/detect` | Recibe frames (bytes JPEG), devuelve detecciones JSON |
| `GET /api/dataset/stats` | Conteo por clase de lo recolectado |
| `GET /api/dataset/download` | Dataset recolectado como ZIP |
| `DELETE /api/dataset/reset` | Vacia el dataset |

## Modelo e inferencia

YOLO11m de 6 clases: `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`.

El runtime **no** usa ultralytics ni torch: corre `Modelos/best.onnx` con
onnxruntime directo, y `detector.py` reimplementa el pre y post proceso
(letterbox a 640, NMS por clase con iou 0.7, desescalado de boxes). Verificado
contra ultralytics sobre 24 imagenes: mismas 29 detecciones, 0.000 px y 0.00000
de diferencia en confianza.

El motivo es el tamaño: con torch la imagen pesaba ~2 GB y el proceso ~476 MB de
RAM, lo que no entra en un host chico. Asi quedan ~250 MB de imagen y ~181 MB de
RAM. La sesion de onnxruntime va con `enable_cpu_mem_arena = False` porque el
arena allocator reserva de mas y no devuelve (459 MB contra 165 MB medidos, por
~4% de latencia).

El `.onnx` no se versiona: lo exporta la etapa `exporter` del Dockerfile desde
`Modelos/best.pt`, que si esta en el repo. Para regenerarlo a mano:

```bash
pip install -r requirements-export.txt   # + torch desde el indice CPU
python export_onnx.py
```

Sin el `.onnx` el detector falla al arrancar con un error explicito — no hay
fallback al `.pt`, porque cargarlo requeriria justamente el torch que sacamos.

## Variables de entorno

| Var | Default | Para que |
|---|---|---|
| `PORT` | `7860` | Puerto de uvicorn. Render y Railway lo inyectan solos |
| `MODEL_PATH` | `Modelos/best.onnx` | Fuerza otro modelo |
| `AUTO_COLLECT` | `0` | En `1` guarda frames de conf >= 0.90 como dataset |

La auto-recoleccion viene apagada a proposito: con el modelo actual archiva
falsos positivos (una persona entra como `paper` con conf 0.9).

## Deploy

El destino actual es **Render**, via el `render.yaml` de la raiz del repo
(`New > Blueprint` en el dashboard). El Dockerfile tambien sirve tal cual en
Railway y en Hugging Face Spaces — de ahi el front matter de arriba y el
`deploy_hf.py` de la raiz, aunque HF ya cobra PRO para Docker Spaces.

## Local

```bash
pip install -r requirements.txt
uvicorn main:app --port 8001
```
