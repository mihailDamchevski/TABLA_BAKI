"""System for explaining rules and moves."""

from typing import List
from game.board import Board, PlayerColor
from game.move import Move
from rules.base import RuleSet


class ExplanationSystem:
    """System for providing explanations about rules and moves."""
    
    def __init__(self, rules: RuleSet):
        """Initialize explanation system.
        
        Args:
            rules: RuleSet to explain
        """
        self.rules = rules
    
    def explain_move(self, board: Board, color: PlayerColor, move: Move,
                    dice: tuple) -> str:
        """Explain a move in detail.
        
        Args:
            board: Current board state
            color: Player making the move
            move: Move to explain
            dice: Dice roll
        
        Returns:
            Detailed explanation string
        """
        valid, explanations = self.rules.validate_move(board, color, move, dice)
        
        explanation_parts = []
        explanation_parts.append(f"Move: {move}")
        explanation_parts.append(f"Status: {'VALID' if valid else 'INVALID'}")
        explanation_parts.append("")
        explanation_parts.append("Rule checks:")
        for i, exp in enumerate(explanations, 1):
            explanation_parts.append(f"  {i}. {exp}")
        
        return "\n".join(explanation_parts)
    
    def explain_rules(self) -> str:
        """Explain all rules in the current variant.
        
        Returns:
            Explanation string
        """
        parts = []
        parts.append(f"Rules for variant: {self.rules.variant_name}")
        parts.append("=" * 50)
        
        for rule in self.rules.rules:
            parts.append(f"\n{rule.name.upper()}")
            parts.append(f"  {rule.description}")
            parts.append(f"  Details: {rule.explain(None, None, None)}")
        
        return "\n".join(parts)
    
    def explain_board_position(self, board: Board, color: PlayerColor) -> str:
        """Explain the current board position for a player.
        
        Args:
            board: Current board state
            color: Player color
        
        Returns:
            Explanation string
        """
        parts = []
        parts.append(f"Board position for {color.value}:")
        parts.append("-" * 50)
        
        # Pieces on bar
        bar_count = board.get_bar_count(color)
        if bar_count > 0:
            parts.append(f"  Pieces on bar: {bar_count}")
            parts.append("  → Must enter pieces from bar before making other moves")
        
        # Pieces in home board
        home_pieces = board.get_pieces_in_home(color)
        home_start, home_end = board.get_bearing_off_point(color)
        parts.append(f"  Pieces in home board (points {home_start}-{home_end}): {home_pieces}")
        
        if board.can_bear_off(color):
            parts.append("  ✓ Can bear off pieces")
        else:
            parts.append("  ✗ Cannot bear off (pieces outside home board or on bar)")
        
        # Total pieces
        total = board.get_all_pieces(color)
        borne_off = board.borne_off[color]
        parts.append(f"  Total pieces on board: {total}")
        parts.append(f"  Pieces borne off: {borne_off}")
        
        return "\n".join(parts)
    
    def explain_legal_moves(self, legal_moves: List[Move], dice: tuple) -> str:
        """Explain available legal moves.
        
        Args:
            legal_moves: List of legal moves
            dice: Dice roll
        
        Returns:
            Explanation string
        """
        if not legal_moves:
            return "No legal moves available. You may need to pass your turn."
        
        parts = []
        parts.append(f"Legal moves for dice {dice}:")
        parts.append("-" * 50)
        
        # Group moves by type
        enter_moves = [m for m in legal_moves if m.move_type.value == "enter"]
        normal_moves = [m for m in legal_moves if m.move_type.value == "normal"]
        bear_off_moves = [m for m in legal_moves if m.move_type.value == "bear_off"]
        
        if enter_moves:
            parts.append("\nEnter from bar:")
            for move in enter_moves:
                parts.append(f"  • Enter to point {move.to_point} (using die {move.die_value})")
        
        if normal_moves:
            parts.append("\nNormal moves:")
            for move in normal_moves[:10]:  # Limit display
                parts.append(f"  • {move.from_point} → {move.to_point} (die {move.die_value})")
            if len(normal_moves) > 10:
                parts.append(f"  ... and {len(normal_moves) - 10} more moves")
        
        if bear_off_moves:
            parts.append("\nBear off:")
            for move in bear_off_moves:
                parts.append(f"  • Bear off from point {move.from_point} (die {move.die_value})")
        
        return "\n".join(parts)

