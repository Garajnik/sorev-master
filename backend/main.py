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
from fastapi_offline import FastAPIOffline

# app = FastAPI()
app = FastAPIOffline()

app.mount("/assets", StaticFiles(directory="../dist/assets/"), name="assets")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Score(BaseModel):
    color: str
    judge: str
    punch: str
    score: int


# TODO: Refactor data to use this class
class ConnectedJudges(BaseModel):
    judges: str


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


@app.get("/kick_judge/{judge}")
async def kick_judge(judge: str):
    await manager.disconnect(judge)


@app.post("/send_score")
async def send_score(score: Score):
    await manager.send_score(score)


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
        await self.update_connected_judges()
        return True

    async def disconnect(self, judgeName):
        if judgeName in self.connected_judges:
            del self.connected_judges[judgeName]
            print(
                f"{judgeName} disconnected. Remaining: {list(self.connected_judges.keys())}"
            )
        await self.update_connected_judges()

    async def update_connected_judges(self):
        await self.main_judge_ws.send_json(
            {"data": "judgeupd", "judges": list(self.connected_judges.keys())}
        )

    async def send_score(self, score: Score):
        await self.main_judge_ws.send_json(
            {
                "data": "score",
                "score": score.dict(),
            }
        )


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
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(judgeName)
