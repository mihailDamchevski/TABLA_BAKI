"""Game engine for managing backgammon games."""

import random
from typing import List, Optional, Tuple, Dict
from .board import Board, PlayerColor
from .move import Move, MoveType
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
        self.current_dice: Optional[Tuple[int, int]] = None
        self.used_dice: List[int] = []
        self.game_over = False
        self.winner: Optional[PlayerColor] = None
        self.total_checkers_per_player: Dict[PlayerColor, int] = {
            PlayerColor.WHITE: 15,
            PlayerColor.BLACK: 15
        }
    
    def start_game(self, initial_setup: Dict[PlayerColor, Dict[int, int]]):
        """Start a new game with initial board setup.
        
        Args:
            initial_setup: Dict mapping color to dict of {point_number: piece_count}
        """
        # Calculate total checkers per player from initial setup
        for color in PlayerColor:
            total = sum(initial_setup.get(color, {}).values())
            if total > 0:
                self.total_checkers_per_player[color] = total
        
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
        self.used_dice = []
        return self.current_dice
    
    def is_doubles(self) -> bool:
        """Check if current dice roll is doubles."""
        if not self.current_dice:
            return False
        return self.current_dice[0] == self.current_dice[1]
    
    def get_available_dice_list(self) -> List[int]:
        """Get list of available dice values to use.
        For doubles (e.g., 2-2), returns [2, 2, 2, 2] (4 moves).
        For normal roll (e.g., 2-3), returns [2, 3].
        """
        if not self.current_dice:
            return []
        
        if self.is_doubles():
            # Doubles: 4 moves of the same value
            die_value = self.current_dice[0]
            total_moves = getattr(self.rules, "doubles_uses", 4)
            used_count = self.used_dice.count(die_value)
            remaining = total_moves - used_count
            return [die_value] * remaining
        else:
            # Normal roll: return unused dice
            return [d for d in self.current_dice if d not in self.used_dice]
    
    def get_legal_moves(self, dice: Optional[Tuple[int, int]] = None) -> List[Move]:
        """Get all legal moves for current player.
        
        Args:
            dice: Optional dice roll (uses current_dice if not provided)
        
        Returns:
            List of legal moves
        """
        if dice is None:
            dice = self.current_dice
        
        if dice is None or self.current_player is None:
            return []
        
        available_dice = self.get_available_dice_list()
        if not available_dice:
            return []
        
        # Check for pieces on bar first
        if self.board.get_bar_count(self.current_player) > 0:
            return self._get_enter_moves(self.current_player, dice, available_dice)
        
        moves = []
        
        # Get normal moves using individual dice
        for point_num in range(1, self.board.num_points + 1):
            point = self.board.get_point(point_num)
            # Skip pinned checkers (in pinning variants)
            if point.is_pinned(self.current_player):
                continue
            if point.get_pieces(self.current_player) > 0:
                for die in available_dice:
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
                
                # Also generate moves using sum of both dice (only for non-doubles and allowed by rules)
                if (
                    self.rules.allow_combined_normal
                    and not self.is_doubles()
                    and len(available_dice) == 2
                    and not self.board.can_bear_off(self.current_player)
                ):
                    combined_die = sum(available_dice)
                    target = self._calculate_target(self.current_player, point_num, combined_die)
                    if target:
                        move = Move(
                            color=self.current_player,
                            move_type=MoveType.NORMAL,
                            from_point=point_num,
                            to_point=target,
                            die_value=combined_die
                        )
                        if self._is_legal_move(move, dice):
                            moves.append(move)
        
        # Check bearing off
        if self.board.can_bear_off(self.current_player):
            home_start, home_end = self.board.get_bearing_off_point(self.current_player)
            for point_num in range(home_start, home_end + 1):
                point = self.board.get_point(point_num)
                if point.get_pieces(self.current_player) > 0:
                    for die in available_dice:
                        if not self._can_bear_off_with_die(self.current_player, point_num, die):
                            continue
                        move = Move(
                            color=self.current_player,
                            move_type=MoveType.BEAR_OFF,
                            from_point=point_num,
                            die_value=die
                        )
                        if self._is_legal_move(move, dice):
                            moves.append(move)
        
        return moves
    
    def _get_enter_moves(self, color: PlayerColor, dice: Tuple[int, int], available_dice: List[int]) -> List[Move]:
        """Get legal moves for entering from bar.
        
        Args:
            color: Player color
            dice: Dice roll
            available_dice: List of available die values
        
        Returns:
            List of legal enter moves
        """
        moves = []
        for die in available_dice:
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
        """Calculate target point for a move using variant movement direction."""
        direction = self.rules.get_direction(color)
        target = from_point + (direction * die)
        
        if 1 <= target <= 24:
            return target
        return None
    
    def _calculate_enter_target(self, color: PlayerColor, die: int) -> Optional[int]:
        """Calculate target point when entering from bar using variant movement direction."""
        direction = self.rules.get_direction(color)
        if direction == -1:
            # Moving clockwise (decreasing point numbers)
            return 24 - die + 1
        else:
            # Moving counter-clockwise (increasing point numbers)
            return die

    def _bearing_distance(self, color: PlayerColor, point_num: int) -> int:
        """Calculate bearing distance from a point (1-6 for white, 1-6 for black from opposite end)."""
        return point_num if color == PlayerColor.WHITE else 25 - point_num

    def _max_bearing_distance(self, color: PlayerColor) -> int:
        """Get the maximum bearing distance among occupied home points."""
        home_start, home_end = self.board.get_bearing_off_point(color)
        max_dist = 0
        for p in range(home_start, home_end + 1):
            if self.board.get_point(p).get_pieces(color) > 0:
                d = self._bearing_distance(color, p)
                if d > max_dist:
                    max_dist = d
        return max_dist

    def _can_bear_off_with_die(self, color: PlayerColor, from_point: int, die: int) -> bool:
        distance = self._bearing_distance(color, from_point)
        max_dist = self._max_bearing_distance(color)
        if die == distance:
            return True
        if die > distance and distance == max_dist:
            return True
        return False
    
    def _handle_opponent_interaction(self, target_point, opponent: PlayerColor):
        """Handle hitting or pinning opponent checkers when landing on a point."""
        if target_point.is_blot(opponent):
            if self.rules.can_hit():
                target_point.remove_piece(opponent, 1)
                self.board.add_to_bar(opponent, 1)
            elif self.rules.pin_instead():
                pass
    
    def _is_legal_move(self, move: Move, dice: Tuple[int, int]) -> bool:
        """Check if a move is legal according to variant rules."""
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
            self._handle_opponent_interaction(target_point, opponent)
            target_point.add_piece(move.color, 1)
        
        elif move.move_type == MoveType.NORMAL:
            from_point = self.board.get_point(move.from_point)
            from_point.remove_piece(move.color, 1)
            
            target_point = self.board.get_point(move.to_point)
            opponent = move.color.opposite()
            self._handle_opponent_interaction(target_point, opponent)
            target_point.add_piece(move.color, 1)
        
        elif move.move_type == MoveType.BEAR_OFF:
            from_point = self.board.get_point(move.from_point)
            from_point.remove_piece(move.color, 1)
            self.board.bear_off(move.color, 1)
        
        # Mark dice as used
        if self.current_dice:
            if self.is_doubles():
                # Doubles: mark one use of the die value
                die_value = self.current_dice[0]
                if move.die_value == die_value:
                    self.used_dice.append(die_value)
            else:
                # Normal roll
                available_dice = [d for d in self.current_dice if d not in self.used_dice]
                if move.move_type == MoveType.NORMAL and len(available_dice) == 2 and move.die_value == sum(available_dice):
                    # Combined move - only for normal moves
                    self.used_dice.extend(available_dice)
                elif move.die_value in available_dice:
                    # Single die move (including bear off)
                    self.used_dice.append(move.die_value)
        
        # Check for win - use variant-specific checker count
        total_checkers = self.total_checkers_per_player.get(move.color, 15)
        if self.board.borne_off[move.color] >= total_checkers:
            self.game_over = True
            self.winner = move.color
        
        return True, explanations
    
    def explain_move(self, move: Move) -> List[str]:
        """Explain why a move is legal or illegal.
        
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
        """Switch to the next player and reset dice state."""
        if self.current_player:
            self.current_player = self.current_player.opposite()
        self.current_dice = None
        self.used_dice = []
    
    def has_remaining_moves(self) -> bool:
        """Check if player has remaining dice to use."""
        if not self.current_dice:
            return False
        return len(self.get_available_dice_list()) > 0
    
    def get_board_state(self) -> str:
        """Get string representation of board state."""
        return str(self.board)

