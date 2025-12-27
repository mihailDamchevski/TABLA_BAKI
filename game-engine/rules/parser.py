"""Rule parser for loading rules from configuration files."""

import json
from pathlib import Path
from typing import Dict, List, Any, Tuple

from rules.base import RuleSet, Rule, RuleResult
from game.board import Board, PlayerColor
from game.move import Move, MoveType


class RuleParser:
    """Parser for rule configuration files."""
    
    def __init__(self, config_dir: str = None):
        """Initialize parser.
        
        Args:
            config_dir: Directory containing rule config files (defaults to project root/config/variants)
        """
        if config_dir is None:
            # Default to project root/config/variants
            project_root = Path(__file__).parent.parent
            self.config_dir = project_root / "config" / "variants"
        else:
            self.config_dir = Path(config_dir)
    
    def load_variant(self, variant_name: str) -> RuleSet:
        """Load rules for a specific variant.
        
        Args:
            variant_name: Name of variant (e.g., "standard")
        
        Returns:
            RuleSet for the variant
        """
        config_file = self.config_dir / f"{variant_name}.json"
        
        if not config_file.exists():
            raise FileNotFoundError(f"Rule config not found: {config_file}")
        
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        rules = []
        
        # Parse movement rules
        if 'movement' in config:
            rules.append(MovementRule(config['movement']))
        
        # Parse hit rules
        if 'hitting' in config:
            rules.append(HittingRule(config['hitting']))
        
        # Parse bearing off rules
        if 'bearing_off' in config:
            rules.append(BearingOffRule(config['bearing_off']))
        
        # Parse forced move rules
        if 'forced_moves' in config:
            rules.append(ForcedMoveRule(config['forced_moves']))
        
        return RuleSet(variant_name, rules)
    
    def list_variants(self) -> List[str]:
        """List available variants."""
        if not self.config_dir.exists():
            return []
        
        variants = []
        for config_file in self.config_dir.glob("*.json"):
            variants.append(config_file.stem)
        
        return sorted(variants)


# Rule implementations

class MovementRule(Rule):
    """Rule for piece movement."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize movement rule from config."""
        super().__init__("movement", "Piece movement rules")
        self.directions = config.get('direction', {'white': -1, 'black': 1})
        self.must_use_all_dice = config.get('must_use_all_dice', True)
    
    def validate(self, board: Board, color: PlayerColor, move: Move,
                dice: Tuple[int, int], context: Dict) -> RuleResult:
        """Validate movement."""
        if move.move_type == MoveType.NORMAL:
            direction = self.directions.get(color.value, -1 if color == PlayerColor.WHITE else 1)
            expected_target = move.from_point + (direction * move.die_value)
            
            if move.to_point != expected_target:
                return RuleResult(
                    False,
                    f"Move distance doesn't match die value. Expected {expected_target}, got {move.to_point}",
                    self.name
                )
            
            target_point = board.get_point(move.to_point)
            if not target_point.can_land(color):
                return RuleResult(
                    False,
                    f"Point {move.to_point} is blocked (has 2+ opponent pieces)",
                    self.name
                )
        
        return RuleResult(True, "Move is valid", self.name)


class HittingRule(Rule):
    """Rule for hitting opponent pieces."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize hitting rule from config."""
        super().__init__("hitting", "Hitting opponent pieces")
        self.can_hit = config.get('can_hit', True)
        self.send_to_bar = config.get('send_to_bar', True)
    
    def validate(self, board: Board, color: PlayerColor, move: Move,
                dice: Tuple[int, int], context: Dict) -> RuleResult:
        """Validate hitting."""
        if not self.can_hit:
            return RuleResult(True, "Hitting not applicable", self.name)
        
        if move.move_type == MoveType.NORMAL or move.move_type == MoveType.ENTER:
            target_point = board.get_point(move.to_point)
            opponent = color.opposite()
            
            if target_point.is_blot(opponent):
                if self.send_to_bar:
                    return RuleResult(
                        True,
                        f"Will hit opponent blot on point {move.to_point}",
                        self.name
                    )
        
        return RuleResult(True, "No hit", self.name)


class BearingOffRule(Rule):
    """Rule for bearing off pieces."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize bearing off rule from config."""
        super().__init__("bearing_off", "Bearing off pieces")
        self.enabled = config.get('enabled', True)
        self.all_in_outer_board = config.get('all_in_outer_board', True)
    
    def validate(self, board: Board, color: PlayerColor, move: Move,
                dice: Tuple[int, int], context: Dict) -> RuleResult:
        """Validate bearing off."""
        if not self.enabled:
            return RuleResult(False, "Bearing off not enabled in this variant", self.name)
        
        if move.move_type == MoveType.BEAR_OFF:
            if self.all_in_outer_board:
                if not board.can_bear_off(color):
                    return RuleResult(
                        False,
                        "All pieces must be in home board before bearing off",
                        self.name
                    )
            
            # Check if exact die value or higher
            home_start, home_end = board.get_bearing_off_point(color)
            if not (home_start <= move.from_point <= home_end):
                return RuleResult(
                    False,
                    f"Can only bear off from points {home_start}-{home_end}",
                    self.name
                )
        
        return RuleResult(True, "Bearing off is valid", self.name)


class ForcedMoveRule(Rule):
    """Rule for forced moves."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize forced move rule from config."""
        super().__init__("forced_moves", "Forced move rules")
        self.must_use_all_dice = config.get('must_use_all_dice', True)
        self.must_use_higher_if_only_one = config.get('must_use_higher_if_only_one', True)
    
    def validate(self, board: Board, color: PlayerColor, move: Move,
                dice: Tuple[int, int], context: Dict) -> RuleResult:
        """Validate forced moves."""
        # This is simplified - full implementation would check all dice usage
        return RuleResult(True, "Forced move check passed", self.name)

