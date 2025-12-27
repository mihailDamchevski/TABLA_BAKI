"""Base rule classes and interfaces."""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

from game.board import Board, PlayerColor
from game.move import Move, MoveSequence


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
    
    def validate_move(self, board: Board, color: PlayerColor, move: Move,
                     dice: Tuple[int, int], context: Dict = None) -> Tuple[bool, List[str]]:
        """Validate a move against all rules.
        
        Args:
            board: Current board state
            color: Player making the move
            move: Move to validate
            dice: Dice roll
            context: Additional context
        
        Returns:
            Tuple of (is_valid, list_of_explanations)
        """
        if context is None:
            context = {}
        
        explanations = []
        for rule in self.rules:
            result = rule.validate(board, color, move, dice, context)
            explanations.append(f"{rule.name}: {result.explanation}")
            if not result.valid:
                return False, explanations
        
        return True, explanations
    
    def get_legal_moves(self, board: Board, color: PlayerColor, 
                       dice: Tuple[int, int]) -> List[Move]:
        """Get all legal moves for given dice roll.
        
        Args:
            board: Current board state
            color: Player color
            dice: Dice roll
        
        Returns:
            List of legal moves
        """
        # This is a simplified version - actual implementation would be more complex
        # and would need to consider move sequences, forced moves, etc.
        legal_moves = []
        
        # Check for pieces on bar
        if board.get_bar_count(color) > 0:
            # Can only enter from bar
            for die in dice:
                target = self._get_enter_target(color, die)
                if target and board.get_point(target).can_land(color):
                    from game.move import MoveType
                    move = Move(
                        color=color,
                        move_type=MoveType.ENTER,
                        to_point=target,
                        die_value=die
                    )
                    if self.validate_move(board, color, move, dice)[0]:
                        legal_moves.append(move)
        else:
            # Normal moves
            for point_num in range(1, board.num_points + 1):
                point = board.get_point(point_num)
                if point.get_pieces(color) > 0:
                    for die in dice:
                        target = self._get_move_target(color, point_num, die)
                        if target:
                            from game.move import MoveType
                            move = Move(
                                color=color,
                                move_type=MoveType.NORMAL,
                                from_point=point_num,
                                to_point=target,
                                die_value=die
                            )
                            if self.validate_move(board, color, move, dice)[0]:
                                legal_moves.append(move)
        
        return legal_moves
    
    def _get_move_target(self, color: PlayerColor, from_point: int, die: int) -> Optional[int]:
        """Calculate target point for a move."""
        if color == PlayerColor.WHITE:
            target = from_point - die
        else:
            target = from_point + die
        
        if 1 <= target <= 24:
            return target
        return None
    
    def _get_enter_target(self, color: PlayerColor, die: int) -> Optional[int]:
        """Calculate target point when entering from bar."""
        if color == PlayerColor.WHITE:
            return 24 - die + 1
        else:
            return die

