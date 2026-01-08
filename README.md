# TABLA BAKI - Backgammon Rules Interpreter

A Python-based backgammon game engine with FastAPI backend and React frontend.

## Project Structure

```
TABLA_BAKI/
├── game-engine/       # Core game engine (Python)
│   ├── game/          # Game logic
│   ├── rules/         # Rules system
│   ├── ui/            # CLI interface
│   └── config/        # Variant configurations
├── api/               # FastAPI backend
│   ├── main.py        # API server
│   └── requirements.txt
└── app/               # React frontend
    ├── src/
    └── package.json
```

## Quick Start

### 1. Start the API Server

```bash
cd api
pip install -r requirements.txt
python main.py
# or
uvicorn main:app --reload --port 8000
```

API will be available at http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Start the React Frontend

```bash
cd app
npm install
npm run dev
```

Frontend will be available at http://localhost:3000 (or http://localhost:5173 if port 3000 is in use)

## API Endpoints

- `GET /variants` - List available variants
- `POST /games` - Create a new game
- `GET /games/{game_id}` - Get game state
- `POST /games/{game_id}/roll` - Roll dice
- `POST /games/{game_id}/move` - Make a move
- `POST /games/{game_id}/set-player` - Set starting player
- `GET /games/{game_id}/legal-moves` - Get legal moves
- `DELETE /games/{game_id}` - Delete game

## Supported Variants

- **Standard** - Classic backgammon rules
- **Portes** - Greek variant similar to standard
- **Plakoto** - Greek variant with pinning instead of hitting
- **Fevga** - Greek variant, no hitting, same-direction movement
- **Gioul** - Turkish variant combining Plakoto, Moultezim, and Gul Bara features
- **Gul Bara** - Turkish variant, no hitting, powerful doubles
- **Moultezim** - Turkish variant, no hitting, same-direction
- **Narde** - Russian variant, no hitting, same-direction
- **Tawula** - Turkish backgammon, same-direction movement
- **Russian Backgammon** - True race variant, same-direction
- **Shesh Besh** - Turkish variant similar to standard
- **Takhteh** - Persian variant similar to standard
- **Hyper-Backgammon** - Variant with only 3 checkers per player
- **LongGammon** - All checkers start on opponent's one-point
- **Nackgammon** - Standard with two additional back checkers

## Features

- **Rule-Driven Engine**: All game logic follows variant-specific rules from JSON configs
- **15+ Variants**: Support for major backgammon variants
- **Variant-Specific Rules**: 
  - Movement direction (opposite or same-direction)
  - Hitting vs pinning mechanics
  - Doubles handling (configurable uses)
  - Combined moves policy (normal/enter/bear-off)
  - Bar entry blocking
  - Bearing off rules
- **Move Validation**: Validates moves against variant-specific rules
- **Automatic Turn Management**: Handles bar blocking, dice consumption, turn switching
- **REST API**: FastAPI backend with automatic API documentation
- **Modern React UI**: TypeScript frontend with animations and responsive design
- **Extensible**: Easy to add new variants via JSON configs

## Development

### Adding New Variants

Create a JSON file in `api/config/variants/` following the structure of `standard.json`. Required fields:

- `movement.direction` - Movement directions for each color (-1 or 1)
- `movement.doubles_uses` - Number of moves when doubles are rolled (default: 4)
- `movement.combined_moves` - Policy for sum-of-dice moves
- `hitting.can_hit` - Whether hitting is allowed
- `hitting.pin_instead` - Whether to pin instead of hit (for Plakoto/Gioul)
- `bearing_off.enabled` - Whether bearing off is allowed
- `forced_moves` - Rules for forced move scenarios

### API Development

The FastAPI backend uses Pydantic models for request/response validation. See `api/main.py` for implementation.

### Frontend Development

The React app uses TypeScript and communicates with the API via the client in `app/src/api.ts`.

## License

This project is open source and available for educational purposes.
