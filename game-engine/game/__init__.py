"""Game state and board management for backgammon variants."""

# Import only what's needed to avoid circular imports
from game.board import Board, Point, PlayerColor
from game.player import Player
from game.move import Move, MoveType

__all__ = ['Board', 'Point', 'Player', 'PlayerColor', 'Move', 'MoveType']

