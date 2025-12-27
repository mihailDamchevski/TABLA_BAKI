# Quick Start Guide

## Project Structure

```
TABLA_BAKI/
├── game-engine/    # Core Python game engine
├── api/            # FastAPI backend
└── app/            # React frontend
```

## Running the Full Stack

### 1. Start the API Server

```bash
cd api
pip install -r requirements.txt
python main.py
```

The API will run on http://localhost:8000
- API docs: http://localhost:8000/docs

### 2. Start the React App

In a new terminal:

```bash
cd app
npm install
npm run dev
```

The app will open at http://localhost:3000 (Vite default port is 5173, but configured for 3000)

## Standalone Game Engine

To use the CLI version:

```bash
cd game-engine
python main.py
```

## API Endpoints

- `GET /variants` - List variants
- `POST /games` - Create game
- `GET /games/{id}` - Get game state
- `POST /games/{id}/roll` - Roll dice
- `POST /games/{id}/move` - Make move
- `GET /games/{id}/legal-moves` - Get legal moves

## React App Features

- Visual board with clickable points
- Dice rolling
- Move selection from legal moves list
- Manual move input
- Real-time game state updates
- Responsive design

## Development

### Adding Variants

Add JSON files to `game-engine/config/variants/`

### API Development

The API uses FastAPI with automatic OpenAPI documentation at `/docs`

### Frontend Development

The React app uses TypeScript and hot-reloads on changes.

