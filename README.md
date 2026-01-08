# TABLA BAKI - Backgammon Game Engine

A fully rule-driven backgammon game engine with FastAPI backend and React frontend, supporting 15+ variants.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Frontend Guide](#frontend-guide)
- [Adding New Variants](#adding-new-variants)
- [Code Examples](#code-examples)
- [Supported Variants](#supported-variants)

## 🎯 Overview

TABLA BAKI is a production-ready backgammon game engine that supports multiple variants through a rule-driven architecture. The game logic is completely separated from the UI, making it easy to add new variants or integrate with different frontends.

### Key Features

- **Rule-Driven Engine**: All game logic follows variant-specific rules from JSON configs
- **15+ Variants**: Support for major backgammon variants (Standard, Plakoto, Fevga, Gioul, etc.)
- **REST API**: FastAPI backend with automatic API documentation
- **Modern React UI**: TypeScript frontend with animations and responsive design
- **Extensible**: Easy to add new variants via JSON configs

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   App.tsx    │  │   Board.tsx  │  │   Dice.tsx   │     │
│  │  (State Mgmt)│  │  (UI Render) │  │  (Roll UI)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │    api.ts      │                        │
│                    │  (HTTP Client) │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP REST API
┌────────────────────────────▼─────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    main.py                           │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ POST /games  │  │ POST /roll   │  ...            │   │
│  │  └──────┬───────┘  └──────┬───────┘                │   │
│  └─────────┼──────────────────┼────────────────────────┘   │
│            │                  │                              │
│  ┌─────────▼──────────────────▼────────────────────────┐   │
│  │              GameEngine (engine.py)                  │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ roll_dice()  │  │ make_move()  │                │   │
│  │  │get_legal_... │  │switch_player │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────┬──────────────────────────────────────────┘   │
│            │                                                 │
│  ┌─────────▼──────────────────────────────────────────┐   │
│  │              RuleSet (rules/base.py)               │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │MovementRule  │  │ HittingRule  │  ...           │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────┬──────────────────────────────────────────┘   │
│            │                                                 │
│  ┌─────────▼──────────────────────────────────────────┐   │
│  │        RuleParser (rules/parser.py)                 │   │
│  │              Loads JSON configs                     │   │
│  └─────────┬──────────────────────────────────────────┘   │
│            │                                                 │
│  ┌─────────▼──────────────────────────────────────────┐   │
│  │    config/variants/*.json                          │   │
│  │    (Variant rule definitions)                      │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Action (Click Point)
    │
    ▼
React Component (Board.tsx)
    │
    ▼
API Client (api.ts) → HTTP POST /games/{id}/move
    │
    ▼
FastAPI Endpoint (main.py)
    │
    ▼
GameEngine.make_move()
    │
    ▼
RuleSet.validate_move() ← Checks variant rules
    │
    ▼
Board.update() ← Updates game state
    │
    ▼
Return GameState → Frontend updates UI
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/mihailDamchevski/TABLA_BAKI.git
cd TABLA_BAKI
```

### 2. Backend Setup

```bash
cd api
pip install -r requirements.txt
python main.py
# or
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Frontend Setup

```bash
cd app
npm install
npm run dev
```

Frontend will be available at http://localhost:3000 (or http://localhost:5173)

## 📁 Project Structure

```
TABLA_BAKI/
├── api/                          # FastAPI Backend
│   ├── game/                     # Core game engine
│   │   ├── engine.py            # Main game logic
│   │   ├── board.py             # Board representation
│   │   ├── move.py              # Move types and classes
│   │   └── player.py            # Player state management
│   ├── rules/                    # Rule system
│   │   ├── base.py              # Rule base classes
│   │   └── parser.py            # Rule parser from JSON
│   ├── config/                   # Configuration files
│   │   └── variants/            # Variant JSON configs (15+ files)
│   ├── main.py                  # FastAPI server
│   └── requirements.txt         # Python dependencies
│
├── app/                          # React Frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Board.tsx        # Board rendering
│   │   │   ├── Dice.tsx         # Dice component
│   │   │   └── ...
│   │   ├── api.ts               # API client
│   │   └── App.tsx              # Main app component
│   └── package.json             # Node dependencies
│
└── README.md                     # This file
```

## 📚 API Documentation

### Core Endpoints

#### 1. List Variants

```http
GET /variants
```

**Response:**
```json
{
  "variants": ["standard", "plakoto", "fevga", ...]
}
```

#### 2. Create Game

```http
POST /games
Content-Type: application/json

{
  "variant": "standard"
}
```

**Response:**
```json
{
  "game_id": "game_1",
  "variant": "standard",
  "board": {
    "points": [...],
    "current_player": "white",
    "dice": null,
    ...
  },
  "legal_moves": [],
  "can_roll": true
}
```

#### 3. Roll Dice

```http
POST /games/{game_id}/roll
```

**Response:**
```json
{
  "dice": [3, 4],
  "legal_moves": [
    {
      "move_type": "normal",
      "from_point": 6,
      "to_point": 3,
      "die_value": 3
    },
    ...
  ],
  "game_state": {...}
}
```

#### 4. Make Move

```http
POST /games/{game_id}/move
Content-Type: application/json

{
  "from_point": 6,
  "to_point": 3,
  "move_type": "normal",
  "die_value": 3
}
```

**Response:**
```json
{
  "success": true,
  "explanations": ["movement: Move is valid"],
  "game_state": {...}
}
```

## 💻 Code Examples

### Example 1: Creating a Game (Python)

```python
from api.game.engine import GameEngine
from api.rules import RuleParser
from api.game.board import PlayerColor

# Load variant rules
parser = RuleParser()
rules = parser.load_variant('standard')

# Create game engine
engine = GameEngine(rules)

# Setup initial board
initial_setup = {
    PlayerColor.WHITE: {
        24: 2, 13: 5, 8: 3, 6: 5
    },
    PlayerColor.BLACK: {
        1: 2, 12: 5, 17: 3, 19: 5
    }
}

engine.start_game(initial_setup)

# Roll dice
dice = engine.roll_dice()
print(f"Rolled: {dice}")  # e.g., (3, 4)

# Get legal moves
moves = engine.get_legal_moves()
for move in moves:
    print(f"Can move from {move.from_point} to {move.to_point}")
```

### Example 2: Making a Move (Python)

```python
from api.game.move import Move, MoveType

# Create a move
move = Move(
    color=PlayerColor.WHITE,
    move_type=MoveType.NORMAL,
    from_point=6,
    to_point=3,
    die_value=3
)

# Execute move
success, explanations = engine.make_move(move)
if success:
    print("Move successful!")
    print(f"Explanations: {explanations}")
else:
    print(f"Move failed: {explanations}")
```

### Example 3: Frontend API Call (TypeScript)

```typescript
import { api } from './api';

// Create a new game
const gameState = await api.createGame('standard');
console.log('Game ID:', gameState.game_id);

// Roll dice
const rollResult = await api.rollDice(gameState.game_id);
console.log('Dice:', rollResult.dice);
console.log('Legal moves:', rollResult.legal_moves);

// Make a move
const moveResult = await api.makeMove(gameState.game_id, {
  from_point: 6,
  to_point: 3,
  move_type: 'normal',
  die_value: 3
});

if (moveResult.success) {
  console.log('Move successful!');
  console.log('New game state:', moveResult.game_state);
}
```

### Example 4: React Component Usage

```typescript
import { useState, useEffect } from 'react';
import { api } from './api';
import type { GameState } from './api';

function GameComponent() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // Create game on mount
    const createGame = async () => {
      const state = await api.createGame('standard');
      setGameState(state);
    };
    createGame();
  }, []);

  const handleRollDice = async () => {
    if (!gameState) return;
    const result = await api.rollDice(gameState.game_id);
    setGameState(result.game_state);
  };

  const handleMove = async (from: number, to: number, die: number) => {
    if (!gameState) return;
    const result = await api.makeMove(gameState.game_id, {
      from_point: from,
      to_point: to,
      move_type: 'normal',
      die_value: die
    });
    setGameState(result.game_state);
  };

  return (
    <div>
      {gameState && (
        <>
          <p>Current Player: {gameState.board.current_player}</p>
          <button onClick={handleRollDice}>Roll Dice</button>
          {/* Render board and moves */}
        </>
      )}
    </div>
  );
}
```

### Example 5: Adding a Custom Variant

Create `api/config/variants/my-variant.json`:

```json
{
  "variant": "my-variant",
  "description": "My custom backgammon variant",
  "board": {
    "points": 24,
    "initial_setup": {
      "white": {
        "24": 2,
        "13": 5,
        "8": 3,
        "6": 5
      },
      "black": {
        "1": 2,
        "12": 5,
        "17": 3,
        "19": 5
      }
    }
  },
  "movement": {
    "direction": {
      "white": -1,
      "black": 1
    },
    "must_use_all_dice": true,
    "doubles_uses": 4,
    "combined_moves": {
      "normal": true,
      "enter": false,
      "bear_off": false
    }
  },
  "hitting": {
    "can_hit": true,
    "send_to_bar": true
  },
  "bearing_off": {
    "enabled": true,
    "all_in_outer_board": true
  },
  "forced_moves": {
    "must_use_all_dice": true,
    "must_use_higher_if_only_one": true
  }
}
```

The variant will automatically appear in the `/variants` endpoint!

## 🎮 Supported Variants

| Variant | Description | Key Features |
|---------|-------------|--------------|
| **Standard** | Classic backgammon | Hitting, opposite directions, combined moves |
| **Portes** | Greek variant | Similar to standard |
| **Plakoto** | Greek variant | Pinning instead of hitting |
| **Fevga** | Greek variant | No hitting, same-direction movement |
| **Gioul** | Turkish variant | Combines Plakoto, Moultezim, Gul Bara features |
| **Gul Bara** | Turkish variant | No hitting, powerful doubles |
| **Moultezim** | Turkish variant | No hitting, same-direction |
| **Narde** | Russian variant | No hitting, same-direction |
| **Tawula** | Turkish backgammon | Same-direction movement |
| **Russian Backgammon** | True race variant | Same-direction |
| **Shesh Besh** | Turkish variant | Similar to standard |
| **Takhteh** | Persian variant | Similar to standard |
| **Hyper-Backgammon** | Variant with 3 checkers | Only 3 checkers per player |
| **LongGammon** | All start on opponent's point | Different initial setup |
| **Nackgammon** | Standard with extra checkers | Two additional back checkers |

## 🔧 Development Guide

### Understanding the Rule System

The game engine uses a rule-driven architecture:

1. **Variant Configs** (`config/variants/*.json`): Define rules for each variant
2. **RuleParser** (`rules/parser.py`): Loads and parses JSON configs
3. **RuleSet** (`rules/base.py`): Validates moves against rules
4. **GameEngine** (`game/engine.py`): Executes game logic using rules

### Key Concepts for Junior Developers

#### 1. Board Representation

The board has 24 points (1-24), plus:
- **Bar**: Temporary holding area for hit checkers
- **Borne Off**: Checkers removed from the board

```python
# Access board state
board = engine.board
point = board.get_point(6)  # Get point 6
white_pieces = point.get_pieces(PlayerColor.WHITE)
black_pieces = point.get_pieces(PlayerColor.BLACK)
```

#### 2. Moves

Three types of moves:
- **NORMAL**: Move from one point to another
- **ENTER**: Enter from bar to a point
- **BEAR_OFF**: Remove checker from board

```python
from api.game.move import Move, MoveType

# Normal move
move = Move(
    color=PlayerColor.WHITE,
    move_type=MoveType.NORMAL,
    from_point=6,
    to_point=3,
    die_value=3
)

# Enter from bar
enter_move = Move(
    color=PlayerColor.WHITE,
    move_type=MoveType.ENTER,
    to_point=18,  # Enter to point 18
    die_value=6
)

# Bear off
bear_off_move = Move(
    color=PlayerColor.WHITE,
    move_type=MoveType.BEAR_OFF,
    from_point=1,  # Bear off from point 1
    die_value=1
)
```

#### 3. Rule Validation

Every move is validated against variant rules:

```python
# Check if move is legal
valid, explanations = engine.rules.validate_move(
    engine.board,
    PlayerColor.WHITE,
    move,
    (3, 4)  # Current dice roll
)

if valid:
    print("Move is legal!")
else:
    print(f"Move illegal: {explanations}")
```

#### 4. Dice Handling

```python
# Roll dice
dice = engine.roll_dice()  # Returns (die1, die2)

# Check if doubles
if engine.is_doubles():
    print("Doubles! 4 moves available")
    
# Get available dice (accounts for doubles and used dice)
available = engine.get_available_dice_list()
# For doubles (2-2): [2, 2, 2, 2]
# For normal (3-4): [3, 4]
```

### Common Patterns

#### Pattern 1: Game Loop

```python
# 1. Create game
engine = GameEngine(rules)
engine.start_game(initial_setup)

# 2. Roll dice
dice = engine.roll_dice()

# 3. Get legal moves
moves = engine.get_legal_moves()

# 4. Player selects move
selected_move = moves[0]

# 5. Execute move
success, _ = engine.make_move(selected_move)

# 6. Check if turn ends
if not engine.has_remaining_moves():
    engine.switch_player()
```

#### Pattern 2: Move Validation

```python
def is_move_legal(engine, move, dice):
    """Check if a move is legal before executing."""
    # 1. Check if player has pieces at source
    if move.from_point:
        point = engine.board.get_point(move.from_point)
        if point.get_pieces(move.color) == 0:
            return False, "No pieces at source point"
    
    # 2. Validate against rules
    valid, explanations = engine.rules.validate_move(
        engine.board,
        move.color,
        move,
        dice
    )
    
    return valid, explanations
```

#### Pattern 3: UI State Management

```typescript
// React state for game
const [gameState, setGameState] = useState<GameState | null>(null);
const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
const [validMoves, setValidMoves] = useState<LegalMove[]>([]);

// Handle point click
const handlePointClick = (pointNumber: number) => {
  if (selectedPoint === null) {
    // First click: select point
    setSelectedPoint(pointNumber);
    const moves = gameState.legal_moves.filter(
      m => m.from_point === pointNumber
    );
    setValidMoves(moves);
  } else {
    // Second click: make move
    const move = validMoves.find(
      m => m.to_point === pointNumber
    );
    if (move) {
      makeMove(move);
      setSelectedPoint(null);
      setValidMoves([]);
    }
  }
};
```

## 🧪 Testing

### Running Tests

```bash
cd api
pytest scripts/tests/
```

### Example Test

```python
import pytest
from api.game.engine import GameEngine
from api.rules import RuleParser
from api.game.board import PlayerColor
from api.game.move import Move, MoveType

def test_standard_move():
    """Test a standard move in standard backgammon."""
    parser = RuleParser()
    rules = parser.load_variant('standard')
    engine = GameEngine(rules)
    
    # Setup game
    initial_setup = {
        PlayerColor.WHITE: {24: 2, 13: 5, 8: 3, 6: 5},
        PlayerColor.BLACK: {1: 2, 12: 5, 17: 3, 19: 5}
    }
    engine.start_game(initial_setup)
    
    # Roll dice
    dice = engine.roll_dice()
    assert dice is not None
    
    # Get legal moves
    moves = engine.get_legal_moves()
    assert len(moves) > 0
    
    # Make first legal move
    move = moves[0]
    success, _ = engine.make_move(move)
    assert success
```

## 📖 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Backgammon Rules**: https://www.bkgm.com/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available for educational purposes.

## 🐛 Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'api'`
- **Solution**: Make sure you're running from the `api` directory or have PYTHONPATH set correctly

**Issue**: `404 Not Found` for `/variants/{variant_name}`
- **Solution**: Ensure the variant JSON file exists in `api/config/variants/`

**Issue**: Frontend can't connect to API
- **Solution**: Check that API is running on port 8000 and CORS is enabled

**Issue**: Moves not validating correctly
- **Solution**: Check variant JSON config for correct rule definitions

---

**Happy Coding! 🎲**
