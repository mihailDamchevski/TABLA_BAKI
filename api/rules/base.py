"""Base rule classes and interfaces."""

from abc import ABC, abstractmethod
from typing import List, Dict, Tuple
from dataclasses import dataclass

from game.board import Board, PlayerColor
from game.move import Move, MoveType


@dataclass
class RuleResult:
    """Result of rule validation."""
    valid: bool
    explanation: str
    rule_name: str


class Rule(ABC):
    """Base class for game rules."""
    
    def __init__(self, name: str, description: str = ""):
        """Initialize rule.
        
        Args:
            name: Rule name/identifier
            description: Human-readable description
        """
        self.name = name
        self.description = description
    
    @abstractmethod
    def validate(self, board: Board, color: PlayerColor, move: Move, 
                 dice: Tuple[int, int], context: Dict) -> RuleResult:
        """Validate if a move follows this rule.
        
        Args:
            board: Current board state
            color: Player making the move
            move: Move to validate
            dice: Dice roll (die1, die2)
            context: Additional context (e.g., other moves made)
        
        Returns:
            RuleResult indicating validity and explanation
        """
        pass
    
    def explain(self, board: Board, color: PlayerColor, move: Move) -> str:
        """Explain this rule in context of the move.
        
        Args:
            board: Current board state
            color: Player making the move
            move: Move to explain
        
        Returns:
            Explanation string
        """
        return self.description


class RuleSet:
    """Collection of rules for a game variant."""
    
    def __init__(self, variant_name: str, rules: List[Rule]):
        """Initialize rule set.
        
        Args:
            variant_name: Name of the variant
            rules: List of rules
        """
        self.variant_name = variant_name
        self.rules = rules
        # Defaults
        self.doubles_uses = 4
        self.allow_combined_normal = True
        self.allow_combined_enter = False
        self.allow_combined_bear_off = False
        self.movement_rule = None
        self.hitting_rule = None
        for rule in rules:
            if hasattr(rule, "doubles_uses"):
                self.doubles_uses = getattr(rule, "doubles_uses")
            if hasattr(rule, "allow_combined_normal"):
                self.allow_combined_normal = getattr(rule, "allow_combined_normal")
                self.allow_combined_enter = getattr(rule, "allow_combined_enter")
                self.allow_combined_bear_off = getattr(rule, "allow_combined_bear_off")
            if hasattr(rule, "directions"):
                self.movement_rule = rule
            if hasattr(rule, "can_hit"):
                self.hitting_rule = rule
    
    def get_direction(self, color: PlayerColor) -> int:
        """Get movement direction for a color from movement rules."""
        if self.movement_rule:
            return self.movement_rule.directions.get(color.value, -1 if color == PlayerColor.WHITE else 1)
        return -1 if color == PlayerColor.WHITE else 1
    
    def can_hit(self) -> bool:
        """Check if hitting is allowed."""
        if self.hitting_rule:
            return self.hitting_rule.can_hit
        return True
    
    def pin_instead(self) -> bool:
        """Check if pinning is used instead of hitting."""
        if self.hitting_rule:
            return getattr(self.hitting_rule, "pin_instead", False)
        return False
    
    def validate_move(self, board: Board, color: PlayerColor, move: Move,
                     dice: Tuple[int, int], context: Dict = None) -> Tuple[bool, List[str]]:
        if context is None:
            context = {}
        
        explanations = []
        for rule in self.rules:
            result = rule.validate(board, color, move, dice, context)
            explanations.append(f"{rule.name}: {result.explanation}")
            if not result.valid:
                return False, explanations
        
        return True, explanations
    

