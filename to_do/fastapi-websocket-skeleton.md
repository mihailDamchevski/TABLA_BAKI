# FastAPI WebSocket Skeleton for Multiplayer Rooms

This is a reference implementation outline for adding room-based real-time play.

## Scope

- Add room lifecycle management (create/join/expire).
- Add token-authenticated websocket endpoint per room.
- Reuse existing game logic (`GameService`) for roll/move/state.

## Suggested file layout

- `api/services/room_service.py`
- `api/schemas/room.py`
- `api/websocket/room_socket.py`
- Update `api/main.py` to register routes and websocket endpoint.

## Example skeleton

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Literal
import secrets
import string

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field

Seat = Literal["white", "black"]
RoomStatus = Literal["waiting", "active", "finished", "expired"]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def generate_room_id(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_token() -> str:
    return secrets.token_urlsafe(24)


@dataclass
class PlayerSlot:
    nickname: str
    token: str
    connected: bool = False
    ws: Optional[WebSocket] = None


@dataclass
class Room:
    room_id: str
    game_id: str
    status: RoomStatus
    variant: str
    created_at: datetime
    expires_at: datetime
    white: PlayerSlot
    black: Optional[PlayerSlot] = None
    connections: Dict[str, WebSocket] = field(default_factory=dict)


class CreateRoomRequest(BaseModel):
    variant: str = "standard"
    nickname: str = Field(min_length=2, max_length=20)


class JoinRoomRequest(BaseModel):
    nickname: str = Field(min_length=2, max_length=20)


class RoomService:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        # from services.game_service import GameService
        # self.game_service = GameService()

    def create_room(self, variant: str, nickname: str) -> dict:
        room_id = generate_room_id()
        while room_id in self.rooms:
            room_id = generate_room_id()

        host_token = generate_token()
        # game_state = self.game_service.create_game(variant)
        # game_id = game_state.game_id
        game_id = f"game_{room_id}"

        room = Room(
            room_id=room_id,
            game_id=game_id,
            status="waiting",
            variant=variant,
            created_at=now_utc(),
            expires_at=now_utc() + timedelta(hours=1),
            white=PlayerSlot(nickname=nickname, token=host_token),
        )
        self.rooms[room_id] = room

        return {
            "room_id": room_id,
            "game_id": game_id,
            "player": {"seat": "white", "nickname": nickname, "token": host_token},
            "status": room.status,
            "game_state": {},
        }

    def join_room(self, room_id: str, nickname: str) -> dict:
        room = self.rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room.expires_at < now_utc():
            room.status = "expired"
            raise HTTPException(status_code=410, detail="Room expired")
        if room.black:
            raise HTTPException(status_code=409, detail="Room is full")

        guest_token = generate_token()
        room.black = PlayerSlot(nickname=nickname, token=guest_token)
        room.status = "active"

        return {
            "room_id": room.room_id,
            "game_id": room.game_id,
            "player": {"seat": "black", "nickname": nickname, "token": guest_token},
            "status": room.status,
            "game_state": {},
        }

    def get_room_by_token(self, room_id: str, token: str) -> tuple[Room, Seat]:
        room = self.rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room.white.token == token:
            return room, "white"
        if room.black and room.black.token == token:
            return room, "black"
        raise HTTPException(status_code=401, detail="Invalid token")

    async def broadcast(self, room: Room, message: dict):
        for ws in list(room.connections.values()):
            await ws.send_json(message)


app = FastAPI()
room_service = RoomService()


@app.post("/rooms")
def create_room(req: CreateRoomRequest):
    return room_service.create_room(req.variant, req.nickname)


@app.post("/rooms/{room_id}/join")
def join_room(room_id: str, req: JoinRoomRequest):
    return room_service.join_room(room_id, req.nickname)


@app.websocket("/ws/rooms/{room_id}")
async def ws_room(websocket: WebSocket, room_id: str, token: str):
    await websocket.accept()
    room, seat = room_service.get_room_by_token(room_id, token)

    room.connections[seat] = websocket
    slot = room.white if seat == "white" else room.black
    if slot:
        slot.connected = True
        slot.ws = websocket

    await room_service.broadcast(room, {"type": "player_joined", "payload": {"seat": seat}})

    try:
        await websocket.send_json({
            "type": "room_state",
            "payload": {"room_id": room.room_id, "status": room.status, "game_state": {}}
        })

        while True:
            msg = await websocket.receive_json()
            event_type = msg.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong", "payload": {}})
                continue

            # TODO: wire to existing game_service roll/move functions and broadcast game_updated
            await websocket.send_json({"type": "error", "payload": {"message": "Not implemented yet"}})

    except WebSocketDisconnect:
        if seat in room.connections:
            del room.connections[seat]
        slot = room.white if seat == "white" else room.black
        if slot:
            slot.connected = False
            slot.ws = None
        await room_service.broadcast(room, {"type": "player_left", "payload": {"seat": seat}})
```

## Integration notes for this repo

- Replace placeholder `game_id = f"game_{room_id}"` with `GameService.create_game(...)`.
- Use existing move endpoints logic from `services/game_service.py`.
- Keep game state authoritative server-side; client only sends intents (`roll_dice`, `make_move`).
- Add cleanup job for expired rooms (TTL).
