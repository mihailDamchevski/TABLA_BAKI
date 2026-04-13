# Multiplayer API Schema (Room ID + Nicknames)

This file defines the concrete API contract for the new multiplayer room flow:

- Player A creates a room
- Server returns random room ID + player token
- Player B joins using room ID + nickname
- Both clients use websocket with token auth for real-time gameplay events

## Goals

- Keep existing game engine and rules logic authoritative on backend.
- Add a room/session layer on top of current game endpoints.
- Support reconnect and user-friendly errors.

## REST Endpoints

### `POST /rooms`

Create room and host seat.

Request:

```json
{
  "variant": "standard",
  "nickname": "Mario"
}
```

Response (201):

```json
{
  "room_id": "8FQ2K7",
  "game_id": "game_42",
  "player": {
    "seat": "white",
    "nickname": "Mario",
    "token": "host_token_xxx"
  },
  "status": "waiting",
  "game_state": {
    "game_id": "game_42",
    "variant": "standard",
    "board": {},
    "legal_moves": []
  }
}
```

Validation:

- `nickname`: 2-20 chars, trimmed, safe charset
- `variant`: must exist in variant list

---

### `POST /rooms/{room_id}/join`

Join as guest.

Request:

```json
{
  "nickname": "Ana"
}
```

Response (200):

```json
{
  "room_id": "8FQ2K7",
  "game_id": "game_42",
  "player": {
    "seat": "black",
    "nickname": "Ana",
    "token": "guest_token_xxx"
  },
  "status": "active",
  "game_state": {
    "game_id": "game_42",
    "variant": "standard",
    "board": {},
    "legal_moves": []
  }
}
```

Errors:

- `404`: room not found
- `409`: room already full
- `410`: room expired
- `422`: invalid nickname

---

### `GET /rooms/{room_id}`

Bootstrap/reconnect metadata and latest state.

Response (200):

```json
{
  "room_id": "8FQ2K7",
  "status": "active",
  "players": {
    "white": { "nickname": "Mario", "connected": true },
    "black": { "nickname": "Ana", "connected": false }
  },
  "game_state": {
    "game_id": "game_42",
    "variant": "standard",
    "board": {},
    "legal_moves": []
  },
  "expires_at": "2026-04-14T10:00:00Z"
}
```

## WebSocket Endpoint

`WS /ws/rooms/{room_id}?token=<player_token>`

- `token` is required and maps to seat (`white` or `black`).
- Connection without valid token returns auth error and closes.

## Event Envelope

All messages follow:

```json
{
  "type": "event_name",
  "payload": {}
}
```

## Client -> Server Events

- `ping`
- `roll_dice`
- `make_move`
- `leave_room`

`make_move` payload:

```json
{
  "move_type": "normal",
  "from_point": 13,
  "to_point": 8,
  "die_value": 5
}
```

## Server -> Client Events

- `room_state`
- `player_joined`
- `player_left`
- `game_updated`
- `error`
- `pong`

`game_updated` example:

```json
{
  "type": "game_updated",
  "payload": {
    "actor": "white",
    "action": "make_move",
    "game_state": {
      "game_id": "game_42",
      "board": {},
      "legal_moves": []
    }
  }
}
```

## Security & Reliability Requirements

- Room ID random and non-sequential (6-8 chars alphanumeric).
- Player token required for websocket + turn actions.
- Only the current-seat player can roll/move.
- Rate-limit room create/join endpoints.
- Room TTL expiry and cleanup task required.
