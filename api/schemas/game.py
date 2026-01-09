"""Game-related Pydantic schemas."""

from pydantic import BaseModel
from typing import Optional, List, Tuple


class GameCreate(BaseModel):
    variant: str = "standard"
    game_id: Optional[str] = None


class MoveRequest(BaseModel):
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
