"""FastAPI backend for backgammon game engine."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Tuple
import sys
from pathlib import Path

# Add game-engine to path
game_engine_path = Path(__file__).parent.parent / "game-engine"
sys.path.insert(0, str(game_engine_path))

from game.engine import GameEngine
from game.board import PlayerColor
from game.move import Move, MoveType
from rules import RuleParser

app = FastAPI(title="TABLA BAKI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global game state storage (in production, use Redis or database)
games: Dict[str, GameEngine] = {}


# Pydantic models for request/response
class GameCreate(BaseModel):
    variant: str = "standard"
    game_id: Optional[str] = None


class MoveRequest(BaseModel):
    game_id: str
    from_point: Optional[int] = None
    to_point: Optional[int] = None
    move_type: str  # "normal", "enter", "bear_off"
    die_value: Optional[int] = None


class SetPlayerRequest(BaseModel):
    player: str  # "white" or "black"


class PointData(BaseModel):
    number: int
    white_pieces: int
    black_pieces: int


class BoardState(BaseModel):
    points: List[PointData]
    bar_white: int
    bar_black: int
    borne_off_white: int
    borne_off_black: int
    current_player: Optional[str]
    dice: Optional[Tuple[int, int]]
    game_over: bool
    winner: Optional[str]


class LegalMove(BaseModel):
    move_type: str
    from_point: Optional[int]
    to_point: Optional[int]
    die_value: int


class GameState(BaseModel):
    game_id: str
    variant: str
    board: BoardState
    legal_moves: List[LegalMove]
    can_roll: bool


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "TABLA BAKI Backgammon API", "version": "1.0.0"}


@app.get("/variants")
def list_variants():
    """List available game variants."""
    parser = RuleParser()
    variants = parser.list_variants()
    return {"variants": variants}


@app.post("/games", response_model=GameState)
def create_game(game_data: GameCreate):
    """Create a new game."""
    import json
    
    game_id = game_data.game_id or f"game_{len(games)}"
    
    # Load rules
    parser = RuleParser()
    try:
        rules = parser.load_variant(game_data.variant)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Variant '{game_data.variant}' not found")
    
    # Create game engine
    engine = GameEngine(rules)
    
    # Load initial setup
    config_file = game_engine_path / "config" / "variants" / f"{game_data.variant}.json"
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    initial_setup = {}
    for color_str, positions in config['board']['initial_setup'].items():
        color = PlayerColor.WHITE if color_str == "white" else PlayerColor.BLACK
        initial_setup[color] = {int(k): v for k, v in positions.items()}
    
    engine.start_game(initial_setup)
    games[game_id] = engine
    
    return _get_game_state(game_id)


@app.get("/games/{game_id}", response_model=GameState)
def get_game(game_id: str):
    """Get current game state."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return _get_game_state(game_id)


@app.post("/games/{game_id}/roll")
def roll_dice(game_id: str):
    """Roll dice for current player."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[game_id]
    
    if engine.game_over:
        raise HTTPException(status_code=400, detail="Game is over")
    
    dice = engine.roll_dice()
    
    return {
        "dice": dice,
        "legal_moves": _get_legal_moves(engine),
        "game_state": _get_game_state(game_id)
    }


@app.post("/games/{game_id}/move")
def make_move(game_id: str, move_request: MoveRequest):
    """Make a move."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[game_id]
    
    if engine.game_over:
        raise HTTPException(status_code=400, detail="Game is over")
    
    if not engine.current_dice:
        raise HTTPException(status_code=400, detail="Must roll dice first")
    
    # Create move object
    move_type_map = {
        "normal": MoveType.NORMAL,
        "enter": MoveType.ENTER,
        "bear_off": MoveType.BEAR_OFF
    }
    
    move_type = move_type_map.get(move_request.move_type)
    if not move_type:
        raise HTTPException(status_code=400, detail=f"Invalid move_type: {move_request.move_type}")
    
    move = Move(
        color=engine.current_player,
        move_type=move_type,
        from_point=move_request.from_point,
        to_point=move_request.to_point,
        die_value=move_request.die_value or 0
    )
    
    # Execute move
    success, explanations = engine.make_move(move)
    
    if not success:
        raise HTTPException(status_code=400, detail=f"Invalid move: {'; '.join(explanations)}")
    
    # Switch player if game not over
    if not engine.game_over:
        engine.switch_player()
    
    return {
        "success": True,
        "explanations": explanations,
        "game_state": _get_game_state(game_id)
    }


@app.get("/games/{game_id}/legal-moves")
def get_legal_moves(game_id: str):
    """Get legal moves for current state."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[game_id]
    
    if not engine.current_dice:
        return {"legal_moves": [], "message": "Roll dice first"}
    
    return {
        "legal_moves": _get_legal_moves(engine),
        "dice": engine.current_dice
    }


@app.post("/games/{game_id}/set-player")
def set_starting_player(game_id: str, player_data: SetPlayerRequest):
    """Set the starting player."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[game_id]
    player_str = player_data.player.lower()
    
    if player_str == "white":
        engine.current_player = PlayerColor.WHITE
    elif player_str == "black":
        engine.current_player = PlayerColor.BLACK
    else:
        raise HTTPException(status_code=400, detail="Invalid player. Must be 'white' or 'black'")
    
    return {"message": f"Starting player set to {player_str}", "game_state": _get_game_state(game_id)}


@app.delete("/games/{game_id}")
def delete_game(game_id: str):
    """Delete a game."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    del games[game_id]
    return {"message": "Game deleted"}


def _get_game_state(game_id: str) -> GameState:
    """Helper to get game state."""
    engine = games[game_id]
    
    # Convert board to API format
    points = []
    for i in range(1, engine.board.num_points + 1):
        point = engine.board.get_point(i)
        points.append(PointData(
            number=i,
            white_pieces=point.get_pieces(PlayerColor.WHITE),
            black_pieces=point.get_pieces(PlayerColor.BLACK)
        ))
    
    board_state = BoardState(
        points=points,
        bar_white=engine.board.get_bar_count(PlayerColor.WHITE),
        bar_black=engine.board.get_bar_count(PlayerColor.BLACK),
        borne_off_white=engine.board.borne_off[PlayerColor.WHITE],
        borne_off_black=engine.board.borne_off[PlayerColor.BLACK],
        current_player=engine.current_player.value if engine.current_player else None,
        dice=engine.current_dice,
        game_over=engine.game_over,
        winner=engine.winner.value if engine.winner else None
    )
    
    return GameState(
        game_id=game_id,
        variant=engine.rules.variant_name,
        board=board_state,
        legal_moves=_get_legal_moves(engine),
        can_roll=not engine.game_over and engine.current_dice is None
    )


def _get_legal_moves(engine: GameEngine) -> List[LegalMove]:
    """Helper to get legal moves."""
    if not engine.current_dice:
        return []
    
    moves = engine.get_legal_moves()
    result = []
    
    for move in moves:
        move_type_str = {
            MoveType.NORMAL: "normal",
            MoveType.ENTER: "enter",
            MoveType.BEAR_OFF: "bear_off"
        }[move.move_type]
        
        result.append(LegalMove(
            move_type=move_type_str,
            from_point=move.from_point,
            to_point=move.to_point,
            die_value=move.die_value
        ))
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

