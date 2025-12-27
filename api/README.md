# TABLA BAKI API

FastAPI backend for the backgammon game engine.

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
python main.py
# or
uvicorn main:app --reload --port 8000
```

## API Endpoints

### GET `/`
Root endpoint - API information

### GET `/variants`
List available game variants

### POST `/games`
Create a new game
- Body: `{"variant": "standard", "game_id": "optional_id"}`

### GET `/games/{game_id}`
Get current game state

### POST `/games/{game_id}/roll`
Roll dice for current player

### POST `/games/{game_id}/move`
Make a move
- Body: `{"from_point": 13, "to_point": 8, "move_type": "normal", "die_value": 5}`

### GET `/games/{game_id}/legal-moves`
Get legal moves for current state

### DELETE `/games/{game_id}`
Delete a game

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

