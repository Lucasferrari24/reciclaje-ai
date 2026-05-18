import io
import json
import os
import zipfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from detector import TrashDetector, CLASS_NAMES
from auto_collector import AutoCollector, DATASET_DIR

detector: TrashDetector = None
collector: AutoCollector = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector, collector
    detector = TrashDetector()
    collector = AutoCollector(CLASS_NAMES)
    yield


app = FastAPI(title="Reciclaje AI", lifespan=lifespan)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174"
_allowed_origins = os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": detector is not None}


@app.get("/api/dataset/stats")
def dataset_stats():
    return collector.stats()


@app.delete("/api/dataset/reset")
def dataset_reset():
    collector.reset()
    return {"ok": True}


@app.get("/api/dataset/download")
def dataset_download():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in DATASET_DIR.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(DATASET_DIR.parent))
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=dataset_reciclaje.zip"},
    )


@app.websocket("/ws/detect")
async def detect_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            frame_bytes = await websocket.receive_bytes()
            detections = detector.detect(frame_bytes, collector=collector)
            await websocket.send_text(json.dumps(detections))
    except WebSocketDisconnect:
        pass
