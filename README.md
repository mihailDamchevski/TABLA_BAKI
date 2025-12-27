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

## Game Engine

The core game engine is in the `game-engine` folder. It can be used standalone:

```bash
cd game-engine
python main.py
```

## API Endpoints

- `GET /variants` - List available variants
- `POST /games` - Create a new game
- `GET /games/{game_id}` - Get game state
- `POST /games/{game_id}/roll` - Roll dice
- `POST /games/{game_id}/move` - Make a move
- `GET /games/{game_id}/legal-moves` - Get legal moves
- `DELETE /games/{game_id}` - Delete game

See `api/README.md` for detailed API documentation.

## Features

- **Rule-based System**: Declarative rule definitions in JSON format
- **Multiple Variants**: Support for different backgammon variants
- **Move Validation**: Validates moves against variant-specific rules
- **Rule Explanations**: Explains why moves are legal or illegal
- **REST API**: FastAPI backend for web integration
- **React Frontend**: Modern web UI
- **Extensible**: Easy to add new variants

## Development

### Adding New Variants

Create a JSON file in `game-engine/config/variants/` following the structure of `standard.json`.

### API Development

The FastAPI backend uses Pydantic models for request/response validation. See `api/main.py` for implementation.

### Frontend Development

The React app uses TypeScript and communicates with the API via the client in `app/src/api.ts`.

## License

This project is open source and available for educational purposes.
