import json
import os
import socket
from typing import Dict, Union

from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi_offline import FastAPIOffline
from pydantic import BaseModel

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


class UndoScore(BaseModel):
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


@app.post("/connect_judge")
async def connect_judge():
    return ""


@app.get("/local_ip")
async def get_local_ip_route():
    return JSONResponse(content={"local_ip": get_local_ip()})


@app.get("/kick_judge/{judge}")
async def kick_judge(judge: str):
    await manager.disconnect(judge)


@app.post("/send_score")
async def send_score(score: Score):
    await manager.send_score(score)


@app.post("/undo_score")
async def undo_score(undo: UndoScore):
    await manager.send_undo(undo)


class Participants(BaseModel):
    blue: str
    red: str

    def toJson(self):
        return json.dumps(self, default=lambda o: o.__dict__)


@app.post("/connect_participants")
async def connect_participants(participants: Participants):
    await manager.connect_participant(participants)
    return "Successfully connected participants"


@app.get("/participants")
def get_participants():
    return manager.get_participants()


class ConnectionManager:
    def __init__(self):
        self.connected_judges: Dict[str, WebSocket] = {}
        self.main_judge_ws: WebSocket
        self.participants: Participants = Participants(blue="", red="")

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
            f"{judgeName} connected. Judges online: {list(self.connected_judges.keys())}\n"
        )
        await self.update_connected_judges()
        return True

    async def disconnect(self, judgeName):
        if judgeName in self.connected_judges:
            del self.connected_judges[judgeName]
            print(
                f"{judgeName} disconnected. Remaining: {list(self.connected_judges.keys())}\n"
            )
        if judgeName == "mainJudge":
            return
        await self.update_connected_judges()

    async def update_connected_judges(self):
        await self.main_judge_ws.send_json(
            {"data": "judgeupd", "judges": list(self.connected_judges.keys())}
        )

    async def send_score(self, score: Score):
        await self.main_judge_ws.send_json(
            {
                "data": "score",
                "score": score.model_dump(),
            }
        )

    async def send_undo(self, undo: UndoScore):
        await self.main_judge_ws.send_json(
            {
                "data": "undo",
                "undo": undo.model_dump(),
            }
        )

    async def connect_participant(self, participants: Participants):
        self.participants = participants
        print(f"Connected Participants {participants}\n")
        for key in self.connected_judges.keys():
            if key == "mainJudge":
                break
            await self.connected_judges[key].send_json(
                {"data": "participantupd", "participants": list(self.participants)}
            )

    def get_participants(self):
        if self.participants:
            return self.participants.toJson()
        else:
            return "No participants"


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
