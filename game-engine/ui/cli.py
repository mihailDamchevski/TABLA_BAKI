"""Command-line interface for backgammon game."""

import sys
from typing import Optional
from game.engine import GameEngine
from game.board import PlayerColor
from game.move import Move, MoveType
from rules import RuleParser
from ui.explanations import ExplanationSystem


class CLI:
    """Command-line interface for playing backgammon."""
    
    def __init__(self, variant: str = "standard"):
        """Initialize CLI.
        
        Args:
            variant: Game variant to play
        """
        self.parser = RuleParser()
        self.variant = variant
        self.engine: Optional[GameEngine] = None
        self.explainer: Optional[ExplanationSystem] = None
    
    def start(self):
        """Start the CLI game."""
        print("=" * 60)
        print("TABLA BAKI - Backgammon Rules Interpreter")
        print("=" * 60)
        
        # Load variant
        try:
            rules = self.parser.load_variant(self.variant)
            print(f"\nLoaded variant: {self.variant}")
        except FileNotFoundError:
            print(f"\nError: Variant '{self.variant}' not found.")
            print(f"Available variants: {', '.join(self.parser.list_variants())}")
            return
        
        # Initialize game
        self.engine = GameEngine(rules)
        self.explainer = ExplanationSystem(rules)
        
        # Get initial setup from rules config
        import json
        from pathlib import Path
        project_root = Path(__file__).parent.parent
        config_file = project_root / "config" / "variants" / f"{self.variant}.json"
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        initial_setup = {}
        for color_str, positions in config['board']['initial_setup'].items():
            color = PlayerColor.WHITE if color_str == "white" else PlayerColor.BLACK
            initial_setup[color] = {int(k): v for k, v in positions.items()}
        
        self.engine.start_game(initial_setup)
        
        print("\nGame started!")
        print(self.explainer.explain_rules())
        print("\n" + "=" * 60)
        
        # Main game loop
        while not self.engine.game_over:
            self._play_turn()
        
        print("\n" + "=" * 60)
        print(f"Game Over! Winner: {self.engine.winner.value.capitalize()}")
        print("=" * 60)
    
    def _play_turn(self):
        """Play a single turn."""
        if self.engine.current_player is None:
            return
        
        color = self.engine.current_player
        print(f"\n{'=' * 60}")
        print(f"Current player: {color.value.capitalize()}")
        print(f"{'=' * 60}")
        
        # Show board
        print("\n" + self.engine.get_board_state())
        print("\n" + self.explainer.explain_board_position(self.engine.board, color))
        
        # Roll dice
        input("\nPress Enter to roll dice...")
        dice = self.engine.roll_dice()
        print(f"\nRolled: {dice[0]} and {dice[1]}")
        
        # Get legal moves
        legal_moves = self.engine.get_legal_moves()
        
        if not legal_moves:
            print("\nNo legal moves available. Passing turn.")
            self.engine.switch_player()
            return
        
        print("\n" + self.explainer.explain_legal_moves(legal_moves, dice))
        
        # Get move from user
        move = self._get_move_from_user(legal_moves)
        
        if move:
            success, explanations = self.engine.make_move(move)
            if success:
                print(f"\n✓ Move executed: {move}")
                for exp in explanations:
                    print(f"  → {exp}")
            else:
                print(f"\n✗ Move failed:")
                for exp in explanations:
                    print(f"  → {exp}")
        
        # Check if game over
        if not self.engine.game_over:
            self.engine.switch_player()
    
    def _get_move_from_user(self, legal_moves) -> Optional[Move]:
        """Get move input from user.
        
        Args:
            legal_moves: List of legal moves
        
        Returns:
            Selected move or None
        """
        print("\nEnter your move:")
        print("  Format: <from_point> <to_point> or 'bear <point>' or 'enter <point>'")
        print("  Or 'explain <from> <to>' to see explanation")
        print("  Or 'pass' to skip turn")
        print("  Or 'rules' to see rules")
        print("  Or 'board' to see board again")
        print("  Or 'quit' to exit")
        
        while True:
            try:
                user_input = input("\n> ").strip().lower()
                
                if user_input == 'quit':
                    sys.exit(0)
                elif user_input == 'pass':
                    return None
                elif user_input == 'rules':
                    print("\n" + self.explainer.explain_rules())
                    continue
                elif user_input == 'board':
                    print("\n" + self.engine.get_board_state())
                    continue
                elif user_input.startswith('explain'):
                    parts = user_input.split()
                    if len(parts) == 3:
                        try:
                            from_pt = int(parts[1])
                            to_pt = int(parts[2])
                            # Create a move for explanation
                            move = Move(
                                color=self.engine.current_player,
                                move_type=MoveType.NORMAL,
                                from_point=from_pt,
                                to_point=to_pt,
                                die_value=1
                            )
                            print("\n" + self.explainer.explain_move(
                                self.engine.board,
                                self.engine.current_player,
                                move,
                                self.engine.current_dice
                            ))
                        except ValueError:
                            print("Invalid format. Use: explain <from> <to>")
                    continue
                
                # Parse move
                parts = user_input.split()
                
                if len(parts) == 2:
                    if parts[0] == 'bear':
                        # Bear off
                        try:
                            from_pt = int(parts[1])
                            # Find matching move
                            for move in legal_moves:
                                if (move.move_type == MoveType.BEAR_OFF and 
                                    move.from_point == from_pt):
                                    return move
                            print(f"No legal bear off from point {from_pt}")
                        except ValueError:
                            print("Invalid point number")
                    
                    elif parts[0] == 'enter':
                        # Enter from bar
                        try:
                            to_pt = int(parts[1])
                            # Find matching move
                            for move in legal_moves:
                                if (move.move_type == MoveType.ENTER and 
                                    move.to_point == to_pt):
                                    return move
                            print(f"No legal enter to point {to_pt}")
                        except ValueError:
                            print("Invalid point number")
                    
                    else:
                        # Normal move
                        try:
                            from_pt = int(parts[0])
                            to_pt = int(parts[1])
                            # Find matching move
                            for move in legal_moves:
                                if (move.move_type == MoveType.NORMAL and 
                                    move.from_point == from_pt and 
                                    move.to_point == to_pt):
                                    return move
                            print(f"No legal move from {from_pt} to {to_pt}")
                        except ValueError:
                            print("Invalid format. Use: <from> <to>")
                
                else:
                    print("Invalid format. Use: <from> <to> or 'bear <point>' or 'enter <point>'")
            
            except KeyboardInterrupt:
                print("\n\nExiting...")
                sys.exit(0)
            except Exception as e:
                print(f"Error: {e}")

