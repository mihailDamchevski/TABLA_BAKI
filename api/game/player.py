"""Player state management."""

from enum import Enum
from typing import Optional
from .board import PlayerColor


class Player:
    """Represents a player in the game."""
    
    def __init__(self, color: PlayerColor, name: Optional[str] = None):
        """Initialize player.
        
        Args:
            color: Player's color
            name: Optional player name
        """
        self.color = color
        self.name = name or color.value.capitalize()
        self.doubling_cube_value = 1
        self.has_offered_double = False
    
    def reset_double(self):
        """Reset doubling cube state."""
        self.doubling_cube_value = 1
        self.has_offered_double = False
    
    def offer_double(self):
        """Offer a double."""
        self.has_offered_double = True
    
    def accept_double(self):
        """Accept a double."""
        self.doubling_cube_value *= 2
    
    def __str__(self) -> str:
        return self.name

