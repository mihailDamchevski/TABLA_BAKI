"""Game engine for managing backgammon games."""

import random
from typing import List, Optional, Tuple, Dict
from .board import Board, PlayerColor
from .player import Player
from .move import Move, MoveSequence, MoveType
from rules.base import RuleSet


class GameEngine:
    """Main game engine for backgammon."""
    
    def __init__(self, rules: RuleSet):
        """Initialize game engine with rules.
        
        Args:
            rules: RuleSet for the game variant
        """
        self.rules = rules
        self.board = Board()
        self.current_player: Optional[PlayerColor] = None
        self.players = {
            PlayerColor.WHITE: Player(PlayerColor.WHITE),
            PlayerColor.BLACK: Player(PlayerColor.BLACK)
        }
        self.current_dice: Optional[Tuple[int, int]] = None
        self.game_over = False
        self.winner: Optional[PlayerColor] = None
    
    def start_game(self, initial_setup: Dict[PlayerColor, Dict[int, int]]):
        """Start a new game with initial setup.
        
        Args:
            initial_setup: Initial board configuration
        """
        self.board.setup_initial(initial_setup)
        self.current_player = PlayerColor.WHITE
        self.game_over = False
        self.winner = None
    
    def roll_dice(self) -> Tuple[int, int]:
        """Roll dice for current player.
        
        Returns:
            Tuple of (die1, die2)
        """
        die1 = random.randint(1, 6)
        die2 = random.randint(1, 6)
        self.current_dice = (die1, die2)
        return self.current_dice
    
    def get_legal_moves(self, dice: Optional[Tuple[int, int]] = None) -> List[Move]:
        """Get all legal moves for current player.
        
        Args:
            dice: Optional dice roll (uses current_dice if not provided)
        
        Returns:
            List of legal moves
        """
        if dice is None:
            dice = self.current_dice
        
        if dice is None:
            return []
        
        if self.current_player is None:
            return []
        
        # Check for pieces on bar first
        if self.board.get_bar_count(self.current_player) > 0:
            return self._get_enter_moves(self.current_player, dice)
        
        # Get normal moves
        moves = []
        for point_num in range(1, self.board.num_points + 1):
            point = self.board.get_point(point_num)
            if point.get_pieces(self.current_player) > 0:
                for die in dice:
                    target = self._calculate_target(self.current_player, point_num, die)
                    if target:
                        move = Move(
                            color=self.current_player,
                            move_type=MoveType.NORMAL,
                            from_point=point_num,
                            to_point=target,
                            die_value=die
                        )
                        if self._is_legal_move(move, dice):
                            moves.append(move)
        
        # Check bearing off
        if self.board.can_bear_off(self.current_player):
            home_start, home_end = self.board.get_bearing_off_point(self.current_player)
            for point_num in range(home_start, home_end + 1):
                point = self.board.get_point(point_num)
                if point.get_pieces(self.current_player) > 0:
                    for die in dice:
                        move = Move(
                            color=self.current_player,
                            move_type=MoveType.BEAR_OFF,
                            from_point=point_num,
                            die_value=die
                        )
                        if self._is_legal_move(move, dice):
                            moves.append(move)
        
        return moves
    
    def _get_enter_moves(self, color: PlayerColor, dice: Tuple[int, int]) -> List[Move]:
        """Get moves for entering from bar."""
        moves = []
        for die in dice:
            target = self._calculate_enter_target(color, die)
            if target and self.board.get_point(target).can_land(color):
                move = Move(
                    color=color,
                    move_type=MoveType.ENTER,
                    to_point=target,
                    die_value=die
                )
                if self._is_legal_move(move, dice):
                    moves.append(move)
        return moves
    
    def _calculate_target(self, color: PlayerColor, from_point: int, die: int) -> Optional[int]:
        """Calculate target point for a move."""
        if color == PlayerColor.WHITE:
            target = from_point - die
        else:
            target = from_point + die
        
        if 1 <= target <= 24:
            return target
        return None
    
    def _calculate_enter_target(self, color: PlayerColor, die: int) -> Optional[int]:
        """Calculate target point when entering from bar."""
        if color == PlayerColor.WHITE:
            return 24 - die + 1
        else:
            return die
    
    def _is_legal_move(self, move: Move, dice: Tuple[int, int]) -> bool:
        """Check if a move is legal."""
        valid, _ = self.rules.validate_move(
            self.board,
            move.color,
            move,
            dice
        )
        return valid
    
    def make_move(self, move: Move) -> Tuple[bool, List[str]]:
        """Execute a move.
        
        Args:
            move: Move to execute
        
        Returns:
            Tuple of (success, explanations)
        """
        if self.current_player is None:
            return False, ["No current player"]
        
        if move.color != self.current_player:
            return False, [f"Not {move.color.value}'s turn"]
        
        if self.current_dice is None:
            return False, ["No dice rolled"]
        
        # Validate move
        valid, explanations = self.rules.validate_move(
            self.board,
            move.color,
            move,
            self.current_dice
        )
        
        if not valid:
            return False, explanations
        
        # Execute move
        if move.move_type == MoveType.ENTER:
            self.board.remove_from_bar(move.color, 1)
            target_point = self.board.get_point(move.to_point)
            opponent = move.color.opposite()
            if target_point.is_blot(opponent):
                # Hit opponent
                target_point.remove_piece(opponent, 1)
                self.board.add_to_bar(opponent, 1)
            target_point.add_piece(move.color, 1)
        
        elif move.move_type == MoveType.NORMAL:
            from_point = self.board.get_point(move.from_point)
            from_point.remove_piece(move.color, 1)
            
            target_point = self.board.get_point(move.to_point)
            opponent = move.color.opposite()
            if target_point.is_blot(opponent):
                # Hit opponent
                target_point.remove_piece(opponent, 1)
                self.board.add_to_bar(opponent, 1)
            target_point.add_piece(move.color, 1)
        
        elif move.move_type == MoveType.BEAR_OFF:
            from_point = self.board.get_point(move.from_point)
            from_point.remove_piece(move.color, 1)
            self.board.bear_off(move.color, 1)
        
        # Check for win
        if self.board.borne_off[move.color] >= 15:
            self.game_over = True
            self.winner = move.color
        
        return True, explanations
    
    def explain_move(self, move: Move) -> List[str]:
        """Explain a move (why it's legal or illegal).
        
        Args:
            move: Move to explain
        
        Returns:
            List of explanation strings
        """
        if self.current_dice is None:
            return ["No dice have been rolled"]
        
        valid, explanations = self.rules.validate_move(
            self.board,
            move.color,
            move,
            self.current_dice
        )
        
        return explanations
    
    def switch_player(self):
        """Switch to the next player."""
        if self.current_player:
            self.current_player = self.current_player.opposite()
        self.current_dice = None
    
    def get_board_state(self) -> str:
        """Get string representation of board state."""
        return str(self.board)

