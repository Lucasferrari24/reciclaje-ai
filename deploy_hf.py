"""Crea (si falta) el Space de Hugging Face y sube backend/ ahi.

    python deploy_hf.py                      # <tu-usuario>/scrap-backend
    python deploy_hf.py usuario/otro-space   # destino explicito

Requiere estar logueado: `hf auth login`, o HF_TOKEN en el entorno.
El .onnx no se sube (77 MB): lo regenera el build desde best.pt.
"""
import sys
from pathlib import Path

from huggingface_hub import HfApi

BACKEND    = Path(__file__).parent / "backend"
SPACE_NAME = "scrap-backend"

# dataset/ y runs/ son efimeros, el .onnx se regenera en el build y .venv es local
IGNORE = [
    "*.pyc", "__pycache__/*", ".venv/*", "venv/*",
    "dataset/*", "runs/*", "*.log", ".env",
    "Modelos/*.onnx", ".railwayignore",
]


def main() -> None:
    api = HfApi()
    repo_id = sys.argv[1] if len(sys.argv) > 1 else f"{api.whoami()['name']}/{SPACE_NAME}"

    api.create_repo(
        repo_id,
        repo_type="space",
        space_sdk="docker",
        exist_ok=True,
        private=False,
    )
    api.upload_folder(
        repo_id=repo_id,
        repo_type="space",
        folder_path=str(BACKEND),
        ignore_patterns=IGNORE,
        commit_message="deploy backend Scrap 2.0",
    )

    host = repo_id.replace("/", "-").replace("_", "-").lower()
    print(f"\nSpace:  https://huggingface.co/spaces/{repo_id}")
    print(f"Logs:   https://huggingface.co/spaces/{repo_id}?logs=build")
    print(f"API:    https://{host}.hf.space/health")
    print(f"WS:     wss://{host}.hf.space/ws/detect")


if __name__ == "__main__":
    main()
