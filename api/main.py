"""FastAPI backend for backgammon game engine."""

import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from schemas.game import GameCreate, MoveRequest, SetPlayerRequest, GameState
from services.game_service import GameService
from services.variant_service import VariantService

app = FastAPI(title="TABLA BAKI API", version="1.0.0")

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
game_service = GameService()
variant_service = VariantService()


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "TABLA BAKI Backgammon API", "version": "1.0.0"}


@app.get("/variants")
def list_variants():
    """List available game variants."""
    return {"variants": variant_service.list_variants()}


@app.get("/variants/{variant_name}")
def get_variant_rules(variant_name: str):
    """Get rules for a specific variant."""
    return variant_service.get_variant_rules(variant_name)


@app.post("/games", response_model=GameState)
def create_game(game_data: GameCreate):
    """Create a new game."""
    return game_service.create_game(game_data.variant, game_data.game_id)


@app.get("/games/{game_id}", response_model=GameState)
def get_game(game_id: str):
    """Get current game state."""
    return game_service.get_game(game_id)


@app.post("/games/{game_id}/roll")
def roll_dice(game_id: str):
    """Roll dice for current player."""
    return game_service.roll_dice(game_id)


@app.post("/games/{game_id}/move")
def make_move(game_id: str, move_request: MoveRequest):
    """Make a move."""
    return game_service.make_move(
        game_id,
        move_request.move_type,
        move_request.from_point,
        move_request.to_point,
        move_request.die_value
    )


@app.get("/games/{game_id}/legal-moves")
def get_legal_moves(game_id: str):
    """Get legal moves for current state."""
    game_state = game_service.get_game(game_id)
    engine = game_service._get_engine(game_id)
    
    if not engine.current_dice:
        return {"legal_moves": [], "message": "Roll dice first"}
    
    return {
        "legal_moves": game_state.legal_moves,
        "dice": engine.current_dice
    }


@app.post("/games/{game_id}/set-player")
def set_starting_player(game_id: str, player_data: SetPlayerRequest):
    """Set the starting player."""
    return game_service.set_starting_player(game_id, player_data.player)


@app.post("/games/{game_id}/ai-move")
def ai_make_move(game_id: str, difficulty: str = Query("medium", description="AI difficulty level")):
    """Make an AI move for the current player."""
    return game_service.ai_make_move(game_id, difficulty)


@app.delete("/games/{game_id}")
def delete_game(game_id: str):
    """Delete a game."""
    return game_service.delete_game(game_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
