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
from typing import Dict
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
    return ""


@app.get("/judges")
def read_judges():
    return ""


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.get("/kick_judge/{judgeName}")
async def kick_judge(judgeName):
    await manager.disconnect(judgeName)


@app.get("/send_score/{punch}/{color}/{score}")
async def send_score(punch, color, score):
    data = str(punch) + str(color) + str(score)
    await manager.broadcast(data)


class ConnectionManager:
    def __init__(self):
        self.connected_judges: Dict[str, WebSocket] = {}
        self.main_judge_ws: WebSocket

    async def connect(self, websocket: WebSocket, judgeName):
        if judgeName in self.connected_judges:
            await websocket.close(code=4001)
            return False
        await websocket.accept()
        if judgeName == "mainJudge":
            self.main_judge_ws = websocket
        else:
            self.connected_judges[judgeName] = websocket
        print(
            f"{judgeName} connected. Judges online: {list(self.connected_judges.keys())}"
        )
        await manager.update_connected_judges()
        return True

    async def disconnect(self, judgeName):
        if judgeName == "mainJudge":
            return
        if judgeName in self.connected_judges:
            del self.connected_judges[judgeName]
            print(
                f"{judgeName} disconnected. Remaining: {list(self.connected_judges.keys())}"
            )
        await manager.update_connected_judges()

    async def update_connected_judges(self):
        await self.main_judge_ws.send_json(list(self.connected_judges.keys()))

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        await self.main_judge_ws.send_text(message)


manager = ConnectionManager()


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def spa(full_path: str):
    path = os.path.join("../dist", full_path)
    if os.path.isfile(path):
        return HTMLResponse(open(path, "r", encoding="utf-8").read())
    return HTMLResponse(open("../dist/index.html", "r", encoding="utf-8").read())


@app.websocket("/ws/{judgeName}")
async def websocket_endpoint(websocket: WebSocket, judgeName: str):
    connected = await manager.connect(websocket, judgeName)
    if not connected:
        return
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(f"Client {judgeName} says: {data}")
    except WebSocketDisconnect:
        await manager.disconnect(judgeName)
