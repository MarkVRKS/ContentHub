import os
import sys
import mimetypes
import webbrowser
import signal
from threading import Timer
from fastapi import WebSocket, WebSocketDisconnect, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse 
from contextlib import asynccontextmanager

# --- ФИКС ДЛЯ --noconsole (Uvicorn isatty error) ---
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")
# ---------------------------------------------------

# === ИМПОРТЫ ИЗ ТВОЕГО ПРОЕКТА ===
from core.database import init_db
from api.content import router as content_router
from core.ws_manager import manager
# ================================

mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", relative_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    
app = FastAPI(title="PromptAGG Pro", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(content_router)

@app.post("/shutdown")
async def shutdown():
    def kill_process():
        os.kill(os.getpid(), signal.SIGTERM)
    Timer(0.5, kill_process).start()
    return {"status": "shutdown"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

dist_path = get_resource_path("dist")

if os.path.exists(dist_path):
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="static")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("content-plan") or full_path == "shutdown":
            return {"error": "API Route Not Found"}
        index_file = os.path.join(dist_path, "index.html")
        return FileResponse(index_file)

def open_browser():
    webbrowser.open_new("http://127.0.0.1:8000")

if __name__ == "__main__":
    import uvicorn
    Timer(1.5, open_browser).start()
    
    # КРИТИЧНО: добавляем log_config=None, чтобы uvicorn не пытался настроить логи в пустоту
    uvicorn.run(app, host="0.0.0.0", port=8000, log_config=None)