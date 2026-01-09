"""AI agent for playing backgammon."""

import random
from typing import List, Optional
from .engine import GameEngine
from .move import Move, MoveType
from .board import PlayerColor


class AIAgent:
    """Simple AI agent that evaluates moves and selects the best one."""
    
    def __init__(self, difficulty: str = "medium"):
        """
        Args:
            difficulty: "easy", "medium", or "hard"
        """
        self.difficulty = difficulty
        self.difficulty_weights = {
            "easy": {"random": 0.7, "greedy": 0.3},
            "medium": {"random": 0.3, "greedy": 0.7},
            "hard": {"random": 0.1, "greedy": 0.9}
        }
    
    def select_move(self, engine: GameEngine) -> Optional[Move]:
        """Select the best move from legal moves.
        
        Args:
            engine: GameEngine instance
            
        Returns:
            Selected move or None if no moves available
        """
        legal_moves = engine.get_legal_moves()
        if not legal_moves:
            return None
        
        # Easy: mostly random
        if self.difficulty == "easy":
            return random.choice(legal_moves)
        
        # Medium/Hard: evaluate moves
        scored_moves = [(move, self._evaluate_move(engine, move)) for move in legal_moves]
        scored_moves.sort(key=lambda x: x[1], reverse=True)
        
        # Medium: sometimes pick random from top 3
        if self.difficulty == "medium" and random.random() < 0.3:
            top_moves = scored_moves[:min(3, len(scored_moves))]
            return random.choice(top_moves)[0]
        
        # Hard: always pick best
        return scored_moves[0][0]
    
    def _evaluate_move(self, engine: GameEngine, move: Move) -> float:
        """Evaluate a move and return a score.
        
        Higher score = better move.
        
        Args:
            engine: GameEngine instance
            move: Move to evaluate
            
        Returns:
            Score for the move
        """
        score = 0.0
        board = engine.board
        color = move.color
        
        # Priority 1: Bear off (winning move)
        if move.move_type == MoveType.BEAR_OFF:
            score += 1000
        
        # Priority 2: Enter from bar
        if move.move_type == MoveType.ENTER:
            score += 500
        
        # Priority 3: Hit opponent (if allowed)
        if move.move_type == MoveType.NORMAL and move.to_point:
            target_point = board.get_point(move.to_point)
            opponent = color.opposite()
            if target_point.is_blot(opponent) and engine.rules.can_hit():
                score += 300
        
        # Priority 4: Move pieces forward (toward bearing off)
        if move.move_type == MoveType.NORMAL:
            # Calculate progress toward bearing off
            if color == PlayerColor.WHITE:
                progress = (move.from_point - move.to_point) if move.to_point else 0
            else:
                progress = (move.to_point - move.from_point) if move.to_point else 0
            score += progress * 10
        
        # Priority 5: Create safe points (points with 2+ pieces)
        if move.move_type == MoveType.NORMAL and move.to_point:
            target_point = board.get_point(move.to_point)
            if target_point.get_pieces(color) == 1:  # Will have 2 after move
                score += 50
        
        # Priority 6: Use higher dice values (more progress)
        score += move.die_value * 5
        
        return score
