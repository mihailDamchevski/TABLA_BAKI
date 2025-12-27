"""Move representation and types."""

from enum import Enum
from typing import List, Optional, Tuple
from dataclasses import dataclass
from .board import PlayerColor


class MoveType(Enum):
    """Types of moves in backgammon."""
    NORMAL = "normal"  # Move from one point to another
    ENTER = "enter"    # Enter from bar
    BEAR_OFF = "bear_off"  # Bear off a piece


@dataclass
class Move:
    """Represents a single move."""
    color: PlayerColor
    move_type: MoveType
    from_point: Optional[int] = None  # None for enter/bear_off
    to_point: Optional[int] = None    # None for bear_off
    die_value: int = 0  # Which die was used
    
    def __post_init__(self):
        """Validate move structure."""
        if self.move_type == MoveType.NORMAL:
            if self.from_point is None or self.to_point is None:
                raise ValueError("Normal move requires from_point and to_point")
        elif self.move_type == MoveType.ENTER:
            if self.to_point is None:
                raise ValueError("Enter move requires to_point")
        elif self.move_type == MoveType.BEAR_OFF:
            if self.from_point is None:
                raise ValueError("Bear off move requires from_point")
    
    def __str__(self) -> str:
        """String representation of move."""
        if self.move_type == MoveType.NORMAL:
            return f"{self.color.value}: {self.from_point} -> {self.to_point} (die: {self.die_value})"
        elif self.move_type == MoveType.ENTER:
            return f"{self.color.value}: Enter bar -> {self.to_point} (die: {self.die_value})"
        elif self.move_type == MoveType.BEAR_OFF:
            return f"{self.color.value}: Bear off from {self.from_point} (die: {self.die_value})"
        return f"{self.color.value}: {self.move_type.value}"


@dataclass
class MoveSequence:
    """Represents a sequence of moves (using dice)."""
    color: PlayerColor
    moves: List[Move]
    dice: Tuple[int, int]  # The dice roll
    
    def __str__(self) -> str:
        moves_str = ", ".join(str(m) for m in self.moves)
        return f"{self.color.value} rolled {self.dice}: {moves_str}"

