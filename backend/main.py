import json
import os
import socket
import sqlite3
from datetime import datetime
from typing import Dict, Union

DB_PATH = os.path.join(os.path.dirname(__file__), "participants.db")


def init_db():
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "CREATE TABLE IF NOT EXISTS participants "
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)"
    )
    # A round gets a unique id (its "round number") the moment it starts. All
    # scores recorded during the round reference that id, so the full log can
    # be looked up later.
    con.execute(
        "CREATE TABLE IF NOT EXISTS rounds ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "blue_name TEXT, "
        "red_name TEXT, "
        "started_at TEXT NOT NULL, "
        "ended_at TEXT)"
    )
    # One row per scoring action. `action` is 'score' for a point and 'undo'
    # when a judge takes the last one back, so the log preserves the real
    # sequence of events with timestamps.
    con.execute(
        "CREATE TABLE IF NOT EXISTS round_scores ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "round_id INTEGER NOT NULL, "
        "judge TEXT NOT NULL, "
        "color TEXT NOT NULL, "
        "punch TEXT NOT NULL, "
        "score INTEGER NOT NULL, "
        "action TEXT NOT NULL DEFAULT 'score', "
        "created_at TEXT NOT NULL, "
        "FOREIGN KEY (round_id) REFERENCES rounds(id))"
    )
    con.commit()
    con.close()


init_db()


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def create_round(blue: str, red: str) -> int:
    con = sqlite3.connect(DB_PATH)
    cur = con.execute(
        "INSERT INTO rounds (blue_name, red_name, started_at) VALUES (?, ?, ?)",
        (blue, red, _now()),
    )
    con.commit()
    round_id = cur.lastrowid
    con.close()
    return round_id


def finish_round(round_id: int) -> None:
    con = sqlite3.connect(DB_PATH)
    con.execute("UPDATE rounds SET ended_at = ? WHERE id = ?", (_now(), round_id))
    con.commit()
    con.close()


def insert_round_score(
    round_id: int, judge: str, color: str, punch: str, score: int, action: str
) -> None:
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT INTO round_scores "
        "(round_id, judge, color, punch, score, action, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (round_id, judge, color, punch, score, action, _now()),
    )
    con.commit()
    con.close()

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
    # Judges must not be able to score before the round begins (or after it
    # ends). The tiebreak choice is a deliberate post-round action, so it is
    # allowed even when the round is not active.
    if not manager.round_active and score.punch != "tiebreak":
        return JSONResponse(
            status_code=409, content={"error": "round_not_active"}
        )
    await manager.send_score(score)


@app.post("/undo_score")
async def undo_score(undo: UndoScore):
    await manager.send_undo(undo)


@app.post("/round_start")
async def round_start():
    round_id = await manager.send_round_start()
    return JSONResponse(content={"round_id": round_id})


@app.post("/round_end")
async def round_end():
    await manager.send_round_end()
    return ""


class Participants(BaseModel):
    blue: str
    red: str

    def toJson(self):
        return json.dumps(self, default=lambda o: o.__dict__)


class ParticipantEntry(BaseModel):
    name: str


@app.get("/db/participants")
def get_db_participants():
    con = sqlite3.connect(DB_PATH)
    rows = con.execute("SELECT id, name FROM participants ORDER BY name").fetchall()
    con.close()
    return [{"id": r[0], "name": r[1]} for r in rows]


@app.post("/db/participants")
def create_db_participant(entry: ParticipantEntry):
    con = sqlite3.connect(DB_PATH)
    con.execute("INSERT OR IGNORE INTO participants (name) VALUES (?)", (entry.name,))
    con.commit()
    row = con.execute("SELECT id, name FROM participants WHERE name = ?", (entry.name,)).fetchone()
    con.close()
    return {"id": row[0], "name": row[1]}


@app.get("/db/rounds")
def get_db_rounds():
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT id, blue_name, red_name, started_at, ended_at "
        "FROM rounds ORDER BY id DESC"
    ).fetchall()
    con.close()
    return [
        {
            "id": r[0],
            "blue_name": r[1],
            "red_name": r[2],
            "started_at": r[3],
            "ended_at": r[4],
        }
        for r in rows
    ]


@app.get("/db/rounds/{round_id}/scores")
def get_db_round_scores(round_id: int):
    con = sqlite3.connect(DB_PATH)
    round_row = con.execute(
        "SELECT id, blue_name, red_name, started_at, ended_at "
        "FROM rounds WHERE id = ?",
        (round_id,),
    ).fetchone()
    if round_row is None:
        con.close()
        return JSONResponse(status_code=404, content={"error": "round_not_found"})
    rows = con.execute(
        "SELECT id, judge, color, punch, score, action, created_at "
        "FROM round_scores WHERE round_id = ? ORDER BY id ASC",
        (round_id,),
    ).fetchall()
    con.close()
    return {
        "round": {
            "id": round_row[0],
            "blue_name": round_row[1],
            "red_name": round_row[2],
            "started_at": round_row[3],
            "ended_at": round_row[4],
        },
        "scores": [
            {
                "id": r[0],
                "judge": r[1],
                "color": r[2],
                "punch": r[3],
                "score": r[4],
                "action": r[5],
                "created_at": r[6],
            }
            for r in rows
        ],
    }


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
        self.round_active: bool = False
        # Id of the round currently being recorded. Set when a round starts and
        # kept until the next one begins, so a post-round tiebreak still gets
        # attached to the round it belongs to. None means nothing to record.
        self.current_round_id: Union[int, None] = None

    async def connect(self, websocket: WebSocket, judgeName):
        if judgeName in self.connected_judges:
            await websocket.close(code=4001)
            return False
        await websocket.accept()
        if judgeName == "mainJudge":
            self.main_judge_ws = websocket
        else:
            self.connected_judges[judgeName] = websocket
            # A judge joining mid-competition must immediately know whether the
            # round is in progress, otherwise their screen would allow scoring
            # before the round has begun.
            await websocket.send_json(
                {"data": "roundstate", "active": self.round_active}
            )
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
        if self.current_round_id is not None:
            insert_round_score(
                self.current_round_id,
                score.judge,
                score.color,
                score.punch,
                score.score,
                "score",
            )
        await self.main_judge_ws.send_json(
            {
                "data": "score",
                "score": score.model_dump(),
            }
        )

    async def send_undo(self, undo: UndoScore):
        if self.current_round_id is not None:
            insert_round_score(
                self.current_round_id,
                undo.judge,
                undo.color,
                undo.punch,
                undo.score,
                "undo",
            )
        await self.main_judge_ws.send_json(
            {
                "data": "undo",
                "undo": undo.model_dump(),
            }
        )

    async def send_round_start(self):
        self.round_active = True
        self.current_round_id = create_round(
            self.participants.blue, self.participants.red
        )
        for ws in list(self.connected_judges.values()):
            await ws.send_json({"data": "roundstart"})
        return self.current_round_id

    async def send_round_end(self):
        self.round_active = False
        if self.current_round_id is not None:
            finish_round(self.current_round_id)
        for ws in list(self.connected_judges.values()):
            await ws.send_json({"data": "roundend"})

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
