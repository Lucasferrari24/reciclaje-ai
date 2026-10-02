@echo off
REM Levanta Scrap 2.0 completo en local: backend (YOLO) + frontend (Vite).
REM Cada servicio abre su propia ventana; cerrala para apagarlo.
cd /d "%~dp0"

if not exist "backend\.venv\Scripts\python.exe" (
  echo [!] Falta el entorno de Python. Creando backend\.venv ...
  py -3.12 -m venv backend\.venv || goto :error
  backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt || goto :error
)

if not exist "frontend\node_modules" (
  echo [!] Faltan dependencias del frontend. Instalando ...
  cmd /c "cd frontend && npm install" || goto :error
)

echo Levantando backend en http://localhost:8001 ...
start "Scrap backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001"

echo Levantando frontend en http://localhost:5173 ...
start "Scrap frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Esperando a que el modelo cargue ...
timeout /t 12 /nobreak >nul
start http://localhost:5173
echo.
echo Listo. El badge de la camara debe decir "Conectado" (verde), no "Modo Demo".
exit /b 0

:error
echo.
echo [X] Fallo el arranque. Revisa el mensaje de arriba.
pause
exit /b 1
