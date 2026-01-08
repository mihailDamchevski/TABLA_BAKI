"""Game state and board management for backgammon variants."""

# Import only what's needed to avoid circular imports
from .board import Board, Point, PlayerColor
from .player import Player
from .move import Move, MoveType

__all__ = ['Board', 'Point', 'Player', 'PlayerColor', 'Move', 'MoveType']

