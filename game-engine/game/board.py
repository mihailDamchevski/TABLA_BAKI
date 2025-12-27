"""Board representation for backgammon games."""

from enum import Enum
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


class PlayerColor(Enum):
    """Player colors in backgammon."""
    WHITE = "white"
    BLACK = "black"
    
    def opposite(self):
        """Get the opposite color."""
        return PlayerColor.BLACK if self == PlayerColor.WHITE else PlayerColor.WHITE


@dataclass
class Point:
    """Represents a point on the board."""
    number: int  # 1-24, where 1 is black's home, 24 is white's home
    pieces: Dict[PlayerColor, int]  # Number of pieces of each color
    
    def __post_init__(self):
        if self.pieces is None:
            self.pieces = {PlayerColor.WHITE: 0, PlayerColor.BLACK: 0}
    
    def get_pieces(self, color: PlayerColor) -> int:
        """Get number of pieces of given color on this point."""
        return self.pieces.get(color, 0)
    
    def is_blocked(self, color: PlayerColor) -> bool:
        """Check if point is blocked for given color (2+ opponent pieces)."""
        opponent = color.opposite()
        return self.get_pieces(opponent) >= 2
    
    def is_blot(self, color: PlayerColor) -> bool:
        """Check if point has a blot (single piece) of given color."""
        return self.get_pieces(color) == 1
    
    def can_land(self, color: PlayerColor) -> bool:
        """Check if a piece of given color can land on this point."""
        return not self.is_blocked(color)
    
    def add_piece(self, color: PlayerColor, count: int = 1):
        """Add pieces to this point."""
        self.pieces[color] = self.pieces.get(color, 0) + count
    
    def remove_piece(self, color: PlayerColor, count: int = 1):
        """Remove pieces from this point."""
        current = self.pieces.get(color, 0)
        self.pieces[color] = max(0, current - count)


class Board:
    """Represents the backgammon board state."""
    
    def __init__(self, num_points: int = 24):
        """Initialize board with given number of points."""
        self.num_points = num_points
        self.points: Dict[int, Point] = {}
        self.bar: Dict[PlayerColor, int] = {
            PlayerColor.WHITE: 0,
            PlayerColor.BLACK: 0
        }
        self.borne_off: Dict[PlayerColor, int] = {
            PlayerColor.WHITE: 0,
            PlayerColor.BLACK: 0
        }
        
        # Initialize all points
        for i in range(1, num_points + 1):
            self.points[i] = Point(i, {PlayerColor.WHITE: 0, PlayerColor.BLACK: 0})
    
    def setup_initial(self, setup: Dict[PlayerColor, Dict[int, int]]):
        """Set up initial board configuration.
        
        Args:
            setup: Dict mapping color to dict of {point_number: piece_count}
        """
        for color, positions in setup.items():
            for point_num, count in positions.items():
                if 1 <= point_num <= self.num_points:
                    self.points[point_num].add_piece(color, count)
    
    def get_point(self, point_num: int) -> Optional[Point]:
        """Get point by number."""
        return self.points.get(point_num)
    
    def get_bar_count(self, color: PlayerColor) -> int:
        """Get number of pieces on bar for given color."""
        return self.bar.get(color, 0)
    
    def add_to_bar(self, color: PlayerColor, count: int = 1):
        """Add pieces to bar."""
        self.bar[color] = self.bar.get(color, 0) + count
    
    def remove_from_bar(self, color: PlayerColor, count: int = 1):
        """Remove pieces from bar."""
        self.bar[color] = max(0, self.bar.get(color, 0) - count)
    
    def bear_off(self, color: PlayerColor, count: int = 1):
        """Bear off pieces."""
        self.borne_off[color] = self.borne_off.get(color, 0) + count
    
    def get_bearing_off_point(self, color: PlayerColor) -> Tuple[int, int]:
        """Get the range of points where pieces can bear off.
        Returns (start, end) inclusive.
        For white: 1-6, for black: 19-24
        """
        if color == PlayerColor.WHITE:
            return (1, 6)
        else:
            return (19, 24)
    
    def can_bear_off(self, color: PlayerColor) -> bool:
        """Check if player can bear off (all pieces in home board)."""
        home_start, home_end = self.get_bearing_off_point(color)
        
        # Check if any pieces outside home board
        for point_num, point in self.points.items():
            if point_num < home_start or point_num > home_end:
                if point.get_pieces(color) > 0:
                    return False
        
        # Check bar
        if self.get_bar_count(color) > 0:
            return False
        
        return True
    
    def get_all_pieces(self, color: PlayerColor) -> int:
        """Get total number of pieces on board (including bar, excluding borne off)."""
        total = self.get_bar_count(color)
        for point in self.points.values():
            total += point.get_pieces(color)
        return total
    
    def get_pieces_in_home(self, color: PlayerColor) -> int:
        """Get number of pieces in home board."""
        home_start, home_end = self.get_bearing_off_point(color)
        total = 0
        for point_num in range(home_start, home_end + 1):
            total += self.points[point_num].get_pieces(color)
        return total
    
    def copy(self) -> 'Board':
        """Create a deep copy of the board."""
        new_board = Board(self.num_points)
        new_board.bar = self.bar.copy()
        new_board.borne_off = self.borne_off.copy()
        for point_num, point in self.points.items():
            new_board.points[point_num] = Point(
                point.number,
                point.pieces.copy()
            )
        return new_board
    
    def __str__(self) -> str:
        """String representation of board."""
        lines = []
        lines.append("=" * 50)
        lines.append(f"Bar - White: {self.bar[PlayerColor.WHITE]}, Black: {self.bar[PlayerColor.BLACK]}")
        lines.append(f"Borne Off - White: {self.borne_off[PlayerColor.WHITE]}, Black: {self.borne_off[PlayerColor.BLACK]}")
        lines.append("-" * 50)
        
        # Top row (points 13-24)
        top_row = []
        for i in range(24, 12, -1):
            point = self.points[i]
            w = point.get_pieces(PlayerColor.WHITE)
            b = point.get_pieces(PlayerColor.BLACK)
            top_row.append(f"{i:2d}:W{w}B{b}")
        lines.append(" ".join(top_row))
        
        # Bottom row (points 1-12)
        bottom_row = []
        for i in range(1, 13):
            point = self.points[i]
            w = point.get_pieces(PlayerColor.WHITE)
            b = point.get_pieces(PlayerColor.BLACK)
            bottom_row.append(f"{i:2d}:W{w}B{b}")
        lines.append(" ".join(bottom_row))
        lines.append("=" * 50)
        
        return "\n".join(lines)

