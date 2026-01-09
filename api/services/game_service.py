"""Game service for managing game state and operations."""

from typing import Dict, List, Optional
from fastapi import HTTPException

from game.engine import GameEngine
from game.board import PlayerColor
from game.move import Move, MoveType
from game.ai_agent import AIAgent
from rules import RuleParser
from schemas.game import GameState, BoardState, PointData, LegalMove
from services.variant_service import VariantService


class GameService:
    """Service for game-related operations."""

    def __init__(self):
        self.games: Dict[str, GameEngine] = {}
        self.variant_service = VariantService()
        self.parser = RuleParser()

    def create_game(self, variant: str, game_id: Optional[str] = None) -> GameState:
        """Create a new game."""
        if not game_id:
            game_id = f"game_{len(self.games) + 1}"

        # Load rules
        try:
            rules = self.parser.load_variant(variant)
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Variant '{variant}' not found"
            )

        # Create game engine
        engine = GameEngine(rules)

        # Load initial setup
        config = self.variant_service.load_variant_config(variant)
        initial_setup = self._parse_initial_setup(config['board']['initial_setup'])

        engine.start_game(initial_setup)
        self.games[game_id] = engine

        return self.get_game_state(game_id)

    def get_game(self, game_id: str) -> GameState:
        """Get current game state."""
        if game_id not in self.games:
            raise HTTPException(status_code=404, detail="Game not found")
        return self.get_game_state(game_id)

    def roll_dice(self, game_id: str) -> Dict:
        """Roll dice for current player."""
        engine = self._get_engine(game_id)
        self._check_game_not_over(engine)

        dice = engine.roll_dice()
        legal_moves = self._get_legal_moves(engine)

        # If no legal moves, skip turn
        if not legal_moves and not engine.game_over:
            engine.switch_player()
            return {
                "dice": dice,
                "legal_moves": [],
                "game_state": self.get_game_state(game_id),
                "message": "No legal moves; turn passed to opponent."
            }

        return {
            "dice": dice,
            "legal_moves": legal_moves,
            "game_state": self.get_game_state(game_id)
        }

    def make_move(
        self,
        game_id: str,
        move_type: str,
        from_point: Optional[int],
        to_point: Optional[int],
        die_value: Optional[int]
    ) -> Dict:
        """Make a move."""
        engine = self._get_engine(game_id)
        self._check_game_not_over(engine)

        if not engine.current_dice:
            raise HTTPException(status_code=400, detail="Must roll dice first")

        move = self._create_move(engine, move_type, from_point, to_point, die_value)
        success, explanations = engine.make_move(move)

        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid move: {'; '.join(explanations)}"
            )

        # Switch player if all dice used or no moves remain
        self._handle_turn_end(engine)

        return {
            "success": True,
            "explanations": explanations,
            "game_state": self.get_game_state(game_id)
        }

    def ai_make_move(self, game_id: str, difficulty: str = "medium") -> Dict:
        """Make an AI move."""
        engine = self._get_engine(game_id)
        self._check_game_not_over(engine)

        if engine.current_dice is None:
            raise HTTPException(status_code=400, detail="Must roll dice first")

        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid difficulty. Must be 'easy', 'medium', or 'hard'"
            )

        ai = AIAgent(difficulty=difficulty)
        move = ai.select_move(engine)

        if not move:
            engine.switch_player()
            return {
                "success": False,
                "message": "No legal moves available",
                "game_state": self.get_game_state(game_id)
            }

        success, explanations = engine.make_move(move)
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"AI move failed: {'; '.join(explanations)}"
            )

        self._handle_turn_end(engine)

        move_type_str = {
            MoveType.NORMAL: "normal",
            MoveType.ENTER: "enter",
            MoveType.BEAR_OFF: "bear_off"
        }[move.move_type]

        return {
            "success": True,
            "move": {
                "move_type": move_type_str,
                "from_point": move.from_point,
                "to_point": move.to_point,
                "die_value": move.die_value
            },
            "explanations": explanations,
            "game_state": self.get_game_state(game_id)
        }

    def set_starting_player(self, game_id: str, player: str) -> Dict:
        """Set the starting player."""
        engine = self._get_engine(game_id)
        player_str = player.lower()

        if player_str == "white":
            engine.current_player = PlayerColor.WHITE
        elif player_str == "black":
            engine.current_player = PlayerColor.BLACK
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid player. Must be 'white' or 'black'"
            )

        return {
            "message": f"Starting player set to {player_str}",
            "game_state": self.get_game_state(game_id)
        }

    def delete_game(self, game_id: str) -> Dict:
        """Delete a game."""
        if game_id not in self.games:
            raise HTTPException(status_code=404, detail="Game not found")
        del self.games[game_id]
        return {"message": "Game deleted"}

    def get_game_state(self, game_id: str) -> GameState:
        """Get game state."""
        engine = self._get_engine(game_id)

        points = []
        for i in range(1, engine.board.num_points + 1):
            point = engine.board.get_point(i)
            points.append(PointData(
                number=i,
                white_pieces=point.get_pieces(PlayerColor.WHITE),
                black_pieces=point.get_pieces(PlayerColor.BLACK)
            ))

        board_state = BoardState(
            points=points,
            bar_white=engine.board.get_bar_count(PlayerColor.WHITE),
            bar_black=engine.board.get_bar_count(PlayerColor.BLACK),
            borne_off_white=engine.board.borne_off[PlayerColor.WHITE],
            borne_off_black=engine.board.borne_off[PlayerColor.BLACK],
            current_player=engine.current_player.value if engine.current_player else None,
            dice=engine.current_dice,
            game_over=engine.game_over,
            winner=engine.winner.value if engine.winner else None
        )

        return GameState(
            game_id=game_id,
            variant=engine.rules.variant_name,
            board=board_state,
            legal_moves=self._get_legal_moves(engine),
            can_roll=not engine.game_over and engine.current_dice is None
        )

    def _get_engine(self, game_id: str) -> GameEngine:
        """Get game engine or raise 404."""
        if game_id not in self.games:
            raise HTTPException(status_code=404, detail="Game not found")
        return self.games[game_id]

    def _check_game_not_over(self, engine: GameEngine):
        """Check if game is not over."""
        if engine.game_over:
            raise HTTPException(status_code=400, detail="Game is over")

    def _parse_initial_setup(self, setup: Dict) -> Dict[PlayerColor, Dict[int, int]]:
        """Parse initial setup from config."""
        initial_setup = {}
        for color_str, positions in setup.items():
            color = PlayerColor.WHITE if color_str == "white" else PlayerColor.BLACK
            initial_setup[color] = {int(k): v for k, v in positions.items()}
        return initial_setup

    def _create_move(
        self,
        engine: GameEngine,
        move_type: str,
        from_point: Optional[int],
        to_point: Optional[int],
        die_value: Optional[int]
    ) -> Move:
        """Create a Move object from request data."""
        move_type_map = {
            "normal": MoveType.NORMAL,
            "enter": MoveType.ENTER,
            "bear_off": MoveType.BEAR_OFF
        }

        move_type_enum = move_type_map.get(move_type)
        if not move_type_enum:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid move_type: {move_type}"
            )

        return Move(
            color=engine.current_player,
            move_type=move_type_enum,
            from_point=from_point,
            to_point=to_point,
            die_value=die_value or 0
        )

    def _handle_turn_end(self, engine: GameEngine):
        """Handle turn end logic."""
        if not engine.game_over:
            if not engine.has_remaining_moves():
                engine.switch_player()
            else:
                remaining_moves = engine.get_legal_moves()
                if not remaining_moves:
                    engine.switch_player()

    def _get_legal_moves(self, engine: GameEngine) -> List[LegalMove]:
        """Get legal moves for engine."""
        if not engine.current_dice:
            return []

        moves = engine.get_legal_moves()
        result = []

        for move in moves:
            move_type_str = {
                MoveType.NORMAL: "normal",
                MoveType.ENTER: "enter",
                MoveType.BEAR_OFF: "bear_off"
            }[move.move_type]

            result.append(LegalMove(
                move_type=move_type_str,
                from_point=move.from_point,
                to_point=move.to_point,
                die_value=move.die_value
            ))

        return result
