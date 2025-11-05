from typing import Union
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import socket
import json
from fastapi.responses import JSONResponse

app = FastAPI()

app.mount("/assets", StaticFiles(directory="../dist/assets/"), name="assets")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class JudgeRequest(BaseModel):
    name: str


connected_judges = {}


def get_local_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        except Exception:
            local_ip = "127.0.0.1"
    return local_ip


@app.get("/local_ip")
async def get_local_ip_route():
    return JSONResponse(content={"local_ip": get_local_ip()})


@app.post("/connect_judge")
async def connect_judge():
    return connected_judges


@app.get("/judges")
def read_judges():
    return connected_judges


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.main_judge: WebSocket
        self.connected_judges = set()

    async def connect(self, websocket: WebSocket, judgeName):
        await websocket.accept()
        if judgeName == "mainJudge":
            self.main_judge = websocket
        else:
            self.active_connections.append(websocket)
            self.connected_judges.add(judgeName)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def update_connected_judges(self):
        judges = json.dumps(list(self.connected_judges))
        await self.main_judge.send_json(judges)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def spa(full_path: str):
    path = os.path.join("../dist", full_path)
    if os.path.isfile(path):
        return HTMLResponse(open(path, "r", encoding="utf-8").read())
    return HTMLResponse(open("../dist/index.html", "r", encoding="utf-8").read())


@app.websocket("/ws/{client_name}")
async def websocket_endpoint(websocket: WebSocket, client_name: str):
    await manager.connect(websocket, client_name)
    await manager.broadcast(f"Client {client_name} has joined the group")
    await manager.broadcast(f"Current connections: {manager.connected_judges}")
    await manager.update_connected_judges()
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(f"Client {client_name} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client {client_name} left the chat")
