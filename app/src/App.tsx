import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Board from "./components/Board";
import Dice from "./components/Dice";
import FirstPlayerRollModal from "./components/FirstPlayerRollModal";
import VariantRulesModal from "./components/VariantRulesModal";
import ExitConfirmModal from "./components/ExitConfirmModal";
import CustomDropdown from "./components/CustomDropdown";
import {
  useVariants,
  useVariantRules,
  useGame,
  useCreateGame,
  useRollDice,
  useMakeMove,
  useAIMove,
  useSetStartingPlayer,
  gameKeys,
} from "./hooks/useGameApi";
import { waitForAnimation } from "./utils/animation";
import { storage } from "./utils/storage";
import type { LegalMove, BoardState, MoveAnimation } from "./types/game";

function App() {
  const queryClient = useQueryClient();
  const [gameId, setGameId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("standard");
  const [error, setError] = useState<string | null>(null);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [isExecutingMove, setIsExecutingMove] = useState(false);
  // Note: we use `0` as a sentinel for selecting the Bar (points are 1-24).
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [showFirstPlayerRoll, setShowFirstPlayerRoll] = useState(false);
  const [validMoves, setValidMoves] = useState<LegalMove[]>([]);
  const [showVariantRules, setShowVariantRules] = useState(false);
  const [firstPlayerRollDone, setFirstPlayerRollDone] = useState(false);
  const [previousBoard, setPreviousBoard] = useState<BoardState | null>(null);
  const [lastMove, setLastMove] = useState<MoveAnimation | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [gameMode, setGameMode] = useState<"local" | "ai">("local");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [humanPlayer, setHumanPlayer] = useState<"white" | "black">("white");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // React Query hooks
  const { data: variants = [], error: variantsError } = useVariants();
  const { data: gameState } = useGame(gameId, !!gameId);
  const { data: variantRules } = useVariantRules(
    showVariantRules ? gameState?.variant || selectedVariant : null,
    showVariantRules,
  );

  const createGameMutation = useCreateGame();
  const rollDiceMutation = useRollDice();
  const makeMoveMutation = useMakeMove();
  const aiMoveMutation = useAIMove();
  const setStartingPlayerMutation = useSetStartingPlayer();

  // Update selected variant when variants load
  useEffect(() => {
    if (variants.length > 0 && !variants.includes(selectedVariant)) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const makeAIMove = useCallback(async () => {
    if (!gameId || !gameState) return;

    setIsAiThinking(true);
    setError(null);

    try {
      const result = await aiMoveMutation.mutateAsync({
        gameId,
        difficulty: aiDifficulty,
      });

      // If AI made a move, set up animation first before updating game state
      if (result.move) {
        // Store the previous board state for animation (keep old gameState visible)
        setPreviousBoard({ ...gameState.board });
        setLastMove({
          from_point: result.move.from_point || 0,
          to_point: result.move.to_point || 0,
          move_type: result.move.move_type,
        });

        // Wait for animation to complete before updating game state
        waitForAnimation(() => {
          setSelectedPoint(null);
          setValidMoves([]);
          setPreviousBoard(null);
          setLastMove(null);
        });
      } else {
        // No move made, update state immediately
        setSelectedPoint(null);
        setValidMoves([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI move failed");
    } finally {
      setIsAiThinking(false);
    }
  }, [gameId, gameState, aiDifficulty, aiMoveMutation]);

  // Handle AI turns automatically
  useEffect(() => {
    if (
      !gameState ||
      !gameId ||
      gameMode !== "ai" ||
      gameState.board.game_over ||
      createGameMutation.isPending ||
      rollDiceMutation.isPending ||
      makeMoveMutation.isPending ||
      aiMoveMutation.isPending ||
      isAiThinking ||
      showFirstPlayerRoll
    ) {
      return;
    }

    const currentPlayer = gameState.board.current_player;
    // AI plays when it's NOT the human player's turn
    const isAiTurn = currentPlayer !== humanPlayer;

    if (isAiTurn) {
      // AI needs to roll dice
      if (gameState.can_roll && !gameState.board.dice) {
        const timer = setTimeout(async () => {
          try {
            await rollDiceMutation.mutateAsync(gameId);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Failed to roll dice for AI",
            );
          }
        }, 800);
        return () => clearTimeout(timer);
      }

      // AI has dice rolled, make move
      if (gameState.board.dice && gameState.legal_moves.length > 0) {
        const timer = setTimeout(() => {
          makeAIMove();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    gameState,
    gameId,
    gameMode,
    humanPlayer,
    createGameMutation.isPending,
    rollDiceMutation.isPending,
    makeMoveMutation.isPending,
    aiMoveMutation.isPending,
    isAiThinking,
    showFirstPlayerRoll,
    makeAIMove,
    rollDiceMutation,
  ]);

  const checkVariantSeen = (variant: string): boolean => {
    const seen = storage.get<string[]>("seenVariants", []);
    return seen.includes(variant);
  };

  const markVariantSeen = (variant: string) => {
    const seen = storage.get<string[]>("seenVariants", []);
    if (!seen.includes(variant)) {
      seen.push(variant);
      storage.set("seenVariants", seen);
    }
  };

  const createNewGame = async () => {
    setError(null);
    setGameMessage(null);
    setFirstPlayerRollDone(false);
    try {
      const state = await createGameMutation.mutateAsync({
        variant: selectedVariant,
      });
      setGameId(state.game_id);
      setSelectedPoint(null);

      // Check if variant has been seen before
      const isFirstTime = !checkVariantSeen(selectedVariant);

      if (isFirstTime) {
        // Mark variant as seen and show rules modal
        markVariantSeen(selectedVariant);
        setShowVariantRules(true);
      } else {
        // Show first player roll modal immediately if variant already seen
        setShowFirstPlayerRoll(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    }
  };

  const handleVariantRulesClose = () => {
    setShowVariantRules(false);
    // Show first player roll modal after variant rules modal closes, but only if not already done
    if (gameState && !firstPlayerRollDone) {
      setShowFirstPlayerRoll(true);
    }
  };

  const handleShowVariantRules = () => {
    setShowVariantRules(true);
  };

  const handleExitToMenu = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    if (gameId) {
      queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
    }
    setGameId(null);
    setSelectedPoint(null);
    setValidMoves([]);
    setShowFirstPlayerRoll(false);
    setFirstPlayerRollDone(false);
    setPreviousBoard(null);
    setLastMove(null);
    setError(null);
    setShowExitConfirm(false);
    setIsAiThinking(false);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const handleFirstPlayerRollComplete = async (player: "white" | "black") => {
    setShowFirstPlayerRoll(false);
    setFirstPlayerRollDone(true);

    // Set the starting player in the game
    if (gameId) {
      try {
        await setStartingPlayerMutation.mutateAsync({
          gameId,
          player,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to set starting player",
        );
      }
    }
  };

  const rollDice = async () => {
    if (!gameId) return;
    setError(null);
    try {
      const result = await rollDiceMutation.mutateAsync(gameId);
      setSelectedPoint(null);
      setValidMoves([]);
      setGameMessage(result.message || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to roll dice");
    }
  };

  const makeMove = async (move: LegalMove) => {
    if (!gameId || !gameState) return;
    setError(null);
    setGameMessage(null);
    setIsExecutingMove(true);
    try {
      setPreviousBoard({ ...gameState.board });
      setLastMove({
        from_point: move.from_point ?? 0,
        to_point: move.to_point ?? 0,
        move_type: move.move_type,
      });

      const moveRequest = {
        from_point: move.from_point,
        to_point: move.to_point,
        move_type: move.move_type,
        die_value: move.die_value,
      };

      await makeMoveMutation.mutateAsync({
        gameId,
        move: moveRequest,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setSelectedPoint(null);
            setValidMoves([]);
            setPreviousBoard(null);
            setLastMove(null);
            setIsExecutingMove(false);
          }, 800);
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make move");
      setIsExecutingMove(false);
    }
  };

  const handlePointClick = (pointNumber: number) => {
    if (!gameState || !gameState.board.dice) return;

    const currentPlayer = gameState.board.current_player;
    const barCount =
      currentPlayer === "white"
        ? gameState.board.bar_white
        : currentPlayer === "black"
          ? gameState.board.bar_black
          : 0;

    const enterMoves = gameState.legal_moves.filter(
      (m) => m.move_type === "enter",
    );
    const hasForcedBarMove = barCount > 0 && enterMoves.length > 0;

    if (selectedPoint === null) {
      // If player has checkers on the bar, standard backgammon forces entering first.
      if (hasForcedBarMove) {
        setSelectedPoint(0);
        setValidMoves(enterMoves);

        // If they clicked a destination point, allow entering in one click.
        if (pointNumber !== 0) {
          const enterMove = enterMoves.find((m) => m.to_point === pointNumber);
          if (enterMove) {
            makeMove(enterMove);
            setSelectedPoint(null);
            setValidMoves([]);
          }
        }
        return;
      }

      // First click - select the point and show valid moves
      setSelectedPoint(pointNumber);

      // Filter valid moves from this point
      const movesFromPoint =
        pointNumber === 0
          ? gameState.legal_moves.filter((m) => m.move_type === "enter")
          : gameState.legal_moves.filter((m) => m.from_point === pointNumber);
      setValidMoves(movesFromPoint);
    } else {
      // Second click - try to make a move
      // If user clicks the same point again, allow bear-off directly when available.
      if (selectedPoint !== 0 && pointNumber === selectedPoint) {
        const bearOffMove = gameState.legal_moves.find(
          (m) => m.move_type === "bear_off" && m.from_point === selectedPoint,
        );
        if (bearOffMove) {
          makeMove(bearOffMove);
          setSelectedPoint(null);
          setValidMoves([]);
          return;
        }
      }

      const move = gameState.legal_moves.find((m) => {
        if (selectedPoint === 0) {
          return m.move_type === "enter" && m.to_point === pointNumber;
        }
        return (
          m.move_type === "normal" &&
          m.from_point === selectedPoint &&
          m.to_point === pointNumber
        );
      });

      if (move) {
        makeMove(move);
        setSelectedPoint(null);
        setValidMoves([]);
      } else {
        // Clicked a different point - update selection
        setSelectedPoint(pointNumber);
        const movesFromPoint =
          pointNumber === 0
            ? gameState.legal_moves.filter((m) => m.move_type === "enter")
            : gameState.legal_moves.filter((m) => m.from_point === pointNumber);
        setValidMoves(movesFromPoint);
      }
    }
  };

  const isLoading =
    createGameMutation.isPending ||
    rollDiceMutation.isPending ||
    makeMoveMutation.isPending ||
    aiMoveMutation.isPending ||
    setStartingPlayerMutation.isPending;

  const displayError =
    error || (variantsError instanceof Error ? variantsError.message : null);

  if (!gameState) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,0,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,69,19,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2)_0%,transparent_60%),linear-gradient(135deg,#0a1a0a_0%,#1a2a1a_25%,#0f1419_50%,#1a1a2a_75%,#0a0a1a_100%)] bg-[length:200%_200%,200%_200%,200%_200%,100%_100%] animate-[casinoGlow_20s_ease_infinite] overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full w-full gap-2 mid:gap-3 desktop:gap-3 big:gap-4 p-3 mid:p-4 desktop:p-4 overflow-hidden relative bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,0,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,69,19,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2)_0%,transparent_60%),linear-gradient(135deg,#0a1a0a_0%,#1a2a1a_25%,#0f1419_50%,#1a1a2a_75%,#0a0a1a_100%)] bg-[length:200%_200%,200%_200%,200%_200%,100%_100%] animate-[casinoGlow_20s_ease_infinite] before:content-[''] before:absolute before:rounded-full before:blur-[80px] before:opacity-60 before:animate-[blobFloat_20s_ease-in-out_infinite] before:w-[500px] before:h-[500px] before:bg-[rgba(255,107,107,0.5)] before:-top-[200px] before:-left-[200px] after:content-[''] after:absolute after:rounded-full after:blur-[80px] after:opacity-60 after:animate-[blobFloat_20s_ease-in-out_infinite] after:delay-[-10s] after:w-[600px] after:h-[600px] after:bg-[rgba(107,255,255,0.5)] after:-bottom-[300px] after:-right-[300px]">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden z-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-[rgba(255,215,0,0.6)] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)] animate-[floatUp_linear_infinite]"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                  top: `${Math.random() * 100}%`,
                  transform: `translateY(${Math.random() * 200 - 100}px)`,
                }}
              ></div>
            ))}
          </div>

          <h1 className="text-[1.8em] mid:text-[2.2em] desktop:text-[2.8em] big:text-[3.5em] text-white m-0 font-['Bungee','Black_Ops_One','Audiowide',cursive] tracking-[2px] mid:tracking-[3px] desktop:tracking-[4px] font-black bg-gradient-to-br from-[#ffd700] via-[#ff8c00] to-[#ff4500] bg-clip-text text-transparent animate-[titleGlow_3s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(255,215,0,0.9),0_0_20px_rgba(255,140,0,0.7),0_0_30px_rgba(255,69,0,0.5),0_0_40px_rgba(255,255,255,0.3),2px_2px_4px_rgba(0,0,0,0.5)] relative z-[1]">
            TABLA BAKI
          </h1>
          <h2 className="text-[1em] mid:text-[1.2em] desktop:text-[1.4em] big:text-[1.8em] text-white m-0 font-['Orbitron','Audiowide',sans-serif] tracking-[1px] mid:tracking-[1.5px] desktop:tracking-[2px] opacity-95 font-bold uppercase drop-shadow-[0_0_10px_rgba(255,215,0,0.6),0_0_20px_rgba(255,140,0,0.4),2px_2px_4px_rgba(0,0,0,0.3)] relative z-[1]">
            Backgammon Game
          </h2>
          <div className="flex flex-col gap-2 mid:gap-2.5 desktop:gap-3 big:gap-3.5 items-center bg-white/15 backdrop-blur-[10px] p-3 mid:p-3.5 desktop:p-4 big:p-5 rounded-2xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] animate-[cardFloat_6s_ease-in-out_infinite] relative z-[5] w-full max-w-[300px] mid:max-w-[320px] desktop:max-w-[350px] big:max-w-[420px]">
            <CustomDropdown
              options={variants}
              value={selectedVariant}
              onChange={setSelectedVariant}
              label="Select Variant:"
            />
          </div>
          <div className="flex flex-col gap-2 mid:gap-2.5 desktop:gap-3 big:gap-3.5 items-center bg-white/15 backdrop-blur-[10px] p-3 mid:p-3.5 desktop:p-4 big:p-5 rounded-2xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] animate-[cardFloat_6s_ease-in-out_infinite] delay-75 relative z-[4] w-full max-w-[300px] mid:max-w-[320px] desktop:max-w-[350px] big:max-w-[420px]">
            <CustomDropdown
              options={[
                { value: "local", label: "👥 Local (2 Players)" },
                { value: "ai", label: "🤖 Single Player vs AI" },
              ]}
              value={gameMode}
              onChange={(val) => setGameMode(val as "local" | "ai")}
              label="Game Mode:"
              searchable={false}
            />

            {gameMode === "ai" && (
              <>
                <CustomDropdown
                  options={[
                    { value: "easy", label: "😊 Easy" },
                    { value: "medium", label: "🎯 Medium" },
                    { value: "hard", label: "🔥 Hard" },
                  ]}
                  value={aiDifficulty}
                  onChange={(val) =>
                    setAiDifficulty(val as "easy" | "medium" | "hard")
                  }
                  label="AI Difficulty:"
                  searchable={false}
                />

                <CustomDropdown
                  options={[
                    { value: "white", label: "⚪ White" },
                    { value: "black", label: "⚫ Black" },
                  ]}
                  value={humanPlayer}
                  onChange={(val) => setHumanPlayer(val as "white" | "black")}
                  label="You Play As:"
                  searchable={false}
                />
              </>
            )}
          </div>
          <button
            className="py-2 px-4 mid:py-2.5 mid:px-5 desktop:py-2.5 desktop:px-5 big:py-3 big:px-7 text-xs mid:text-sm desktop:text-sm big:text-base border-none rounded-lg cursor-pointer font-bold transition-all relative z-[1] font-['Orbitron','Audiowide',sans-serif] tracking-[1px] uppercase bg-gradient-to-br from-[#4CAF50] to-[#45a049] text-white shadow-[0_6px_20px_rgba(76,175,80,0.4),0_0_0_0_rgba(76,175,80,0.7)] animate-[pulseButton_2s_ease-in-out_infinite] border-2 border-white/30 overflow-hidden before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:w-0 before:h-0 before:rounded-full before:bg-white/30 before:-translate-x-1/2 before:-translate-y-1/2 before:transition-all before:duration-600 hover:before:w-[300px] hover:before:h-[300px] hover:bg-gradient-to-br hover:from-[#45a049] hover:to-[#4CAF50] hover:scale-110 hover:shadow-[0_8px_30px_rgba(76,175,80,0.6),0_0_0_4px_rgba(76,175,80,0.3)] active:scale-105 disabled:bg-gray-300/50 disabled:cursor-not-allowed disabled:transform-none disabled:animate-none disabled:shadow-none"
            onClick={createNewGame}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "🎲 Start New Game 🎲"}
          </button>
          {displayError && (
            <div className="bg-[rgba(244,67,54,0.9)] backdrop-blur-[10px] text-white py-2 px-3 mid:py-2.5 mid:px-4 desktop:py-2.5 desktop:px-[18px] rounded-[10px] mt-2 mid:mt-2.5 text-center border-2 border-white/30 shadow-[0_4px_15px_rgba(244,67,54,0.4)] animate-[shakeError_0.5s_ease-in-out] text-xs mid:text-sm desktop:text-sm big:text-base relative z-[1]">
              {displayError}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPlayerClass = gameState.board.current_player
    ? `${gameState.board.current_player}-turn`
    : "";
  const isWhiteTurn = currentPlayerClass === "white-turn";

  return (
    <div
      className={`relative h-screen w-screen flex flex-col bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,0,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,69,19,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2)_0%,transparent_60%),linear-gradient(135deg,#0a1a0a_0%,#1a2a1a_25%,#0f1419_50%,#1a1a2a_75%,#0a0a1a_100%)] bg-[length:200%_200%,200%_200%,100%_100%] animate-[casinoGlow_20s_ease_infinite] overflow-hidden ${isExecutingMove ? "cursor-wait" : ""}`}
    >
      {/* Portrait overlay: shown only on narrow portrait screens */}
      <div className="portrait-small:flex hidden fixed inset-0 z-[9999] bg-gradient-to-br from-[#0a1a0a] via-[#1a2a1a] to-[#0a0a1a] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="text-6xl animate-[spin_3s_linear_infinite]">📱</div>
        <h2 className="text-2xl font-black text-white font-['Bungee','Black_Ops_One','Audiowide',cursive] tracking-[2px]">
          Rotate Your Screen
        </h2>
        <p className="text-white/70 text-base max-w-[280px] leading-relaxed">
          For the best gaming experience, please rotate your device to landscape mode.
        </p>
        <div className="w-16 h-10 border-2 border-white/40 rounded-lg relative animate-[rotateHint_2s_ease-in-out_infinite]">
          <div className="absolute inset-1 border border-white/20 rounded-sm" />
        </div>
      </div>

      <header
        className={`relative py-1 px-2 mid:py-1.5 mid:px-3 desktop:py-2.5 desktop:px-4 shadow-[0_4px_15px_rgba(0,0,0,0.4)] flex-shrink-0 border-b-2 overflow-hidden transition-[color,border-color] duration-700 ease-in-out ${
          isWhiteTurn
            ? "text-[#222] border-b-[rgba(0,0,0,0.1)]"
            : "text-[#f4f4f4] border-b-[rgba(184,134,11,0.5)]"
        }`}
      >
        {gameMessage &&
          gameState.legal_moves.length === 0 &&
          !gameState.board.game_over && (
            <div className="absolute top-0 left-0 right-0 pointer-events-none z-30">
              <div className="px-3 py-1.5 mid:px-4 mid:py-2 desktop:px-4 desktop:py-2 bg-gradient-to-b from-[#f7f1c4] to-[#ede5b0] text-[#3d2b00] font-semibold text-[11px] mid:text-xs desktop:text-sm big:text-base text-center border-b border-[#e0d291] shadow-sm animate-[slideDown_0.6s_ease-out]">
                {gameMessage}
              </div>
            </div>
          )}
        {/* Beige background layer */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-[#f5e6d3] via-[#e8d5c4] to-[#f5e6d3] transition-opacity duration-700 ease-in-out pointer-events-none ${
            isWhiteTurn ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Dark background layer */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-[#0a1a0a] via-[#1a2a1a] to-[#0a1a0a] transition-opacity duration-700 ease-in-out pointer-events-none ${
            isWhiteTurn ? "opacity-0" : "opacity-100"
          }`}
        />
        <div className="relative z-10 flex items-center justify-between w-full gap-1.5 mid:gap-2 desktop:gap-3 big:gap-4 h-full">
          {/* Logo - compact on small screens */}
          <div className="flex items-center flex-shrink-0">
            <h1
              className={`m-0 text-base mid:text-lg desktop:text-[1.8em] big:text-[2.2em] tracking-[1px] mid:tracking-[1.5px] desktop:tracking-[2px] whitespace-nowrap font-['Bungee','Black_Ops_One','Audiowide',cursive] font-black animate-[titleGlow_3s_ease-in-out_infinite] ${
                currentPlayerClass === "white-turn"
                  ? "text-[#8B4513] drop-shadow-[0_0_4px_rgba(139,69,19,0.4),2px_2px_4px_rgba(0,0,0,0.2)]"
                  : "bg-gradient-to-br from-[#ffd700] via-[#ff8c00] to-[#ff4500] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,215,0,0.8),0_0_15px_rgba(255,140,0,0.6),2px_2px_4px_rgba(0,0,0,0.5)]"
              }`}
            >
              <span className="desktop:hidden">🔥 TB</span>
              <span className="hidden desktop:inline">🔥 TABLA BAKI</span>
            </h1>
          </div>

          {/* White Stats */}
          <div
            className={`flex items-center gap-1 desktop:gap-1.5 py-1 desktop:py-1.5 px-1.5 desktop:px-2.5 rounded-lg border ${
              currentPlayerClass === "black-turn"
                ? "bg-white/10 border-white/20"
                : "bg-[#f0e6d8] border-[#d4c4b0]"
            }`}
          >
            <span className="text-sm desktop:text-base leading-none">⚪</span>
            <span
              className={`text-[9px] desktop:text-[10px] font-bold tracking-[1px] uppercase ${currentPlayerClass === "black-turn" ? "text-[#f4f4f4]" : "text-[#5c4a37]"} font-['Orbitron','Audiowide',sans-serif]`}
            >
              W
            </span>
            <div className="flex items-center gap-0.5 desktop:gap-1 ml-0.5 desktop:ml-1">
              <span className="text-[9px] desktop:text-[10px] leading-none">🚫</span>
              <span
                className={`text-[10px] desktop:text-[11px] font-bold ${currentPlayerClass === "black-turn" ? "text-[#f4f4f4]" : "text-[#5c4a37]"}`}
              >
                {gameState.board.bar_white}
              </span>
            </div>
            <div
              className={`w-px h-3 desktop:h-4 mx-0.5 ${currentPlayerClass === "black-turn" ? "bg-gray-400" : "bg-[#d4c4b0]"}`}
            ></div>
            <div className="flex items-center gap-0.5 desktop:gap-1">
              <span className="text-[9px] desktop:text-[10px] leading-none">✅</span>
              <span
                className={`text-[10px] desktop:text-[11px] font-bold ${currentPlayerClass === "black-turn" ? "text-[#f4f4f4]" : "text-[#5c4a37]"}`}
              >
                {gameState.board.borne_off_white}
              </span>
            </div>
          </div>

          {/* Black Stats */}
          <div
            className={`flex items-center gap-1 desktop:gap-1.5 py-1 desktop:py-1.5 px-1.5 desktop:px-2.5 rounded-lg border ${
              currentPlayerClass === "black-turn"
                ? "bg-white/10 border-white/20"
                : "bg-[#f0e6d8] border-[#d4c4b0]"
            }`}
          >
            <span className="text-sm desktop:text-base leading-none">⚫</span>
            <span
              className={`text-[9px] desktop:text-[10px] font-bold tracking-[1px] uppercase ${currentPlayerClass === "black-turn" ? "text-[#f4f4f4]" : "text-[#5c4a37]"} font-['Orbitron','Audiowide',sans-serif]`}
            >
              B
            </span>
            <div className="flex items-center gap-0.5 desktop:gap-1 ml-0.5 desktop:ml-1">
              <span className="text-[9px] desktop:text-[10px] leading-none">🚫</span>
              <span
                className={`text-[10px] desktop:text-[11px] font-bold ${currentPlayerClass === "black-turn" ? "text-[#f4f4f4]" : "text-[#5c4a37]"}`}
              >
                {gameState.board.bar_black}
              </span>
            </div>
            <div
              className={`w-px h-3 desktop:h-4 mx-0.5 ${currentPlayerClass === "black-turn" ? "bg-gray-400" : "bg-[#d4c4b0]"}`}
            ></div>
            <div className="flex items-center gap-0.5 desktop:gap-1">
              <span className="text-[9px] desktop:text-[10px] leading-none">✅</span>
              <span
                className={`text-[10px] desktop:text-[11px] font-bold ${currentPlayerClass === "black-turn" ? "text-[#f4f4f4]" : "text-[#5c4a37]"}`}
              >
                {gameState.board.borne_off_black}
              </span>
            </div>
          </div>

          {/* AI Thinking Indicator */}
          {gameMode === "ai" &&
            isAiThinking &&
            gameState.board.current_player !== humanPlayer && (
              <div className="flex items-center py-1 px-1.5 desktop:px-2.5 bg-[rgba(255,107,107,0.2)] border border-[rgba(255,107,107,0.4)] rounded-full animate-[aiPulse_1.5s_ease-in-out_infinite] flex-shrink-0">
                <span className="text-[9px] desktop:text-[10px] font-semibold text-[rgba(255,107,107,0.95)] font-['Orbitron','Audiowide',sans-serif] tracking-[0.5px]">
                  🤖 AI
                </span>
              </div>
            )}

          {/* Variant Name - hidden on very small, shown on desktop */}
          <div className="hidden desktop:flex flex-1 items-center justify-center min-w-0">
            <span
              className={`inline-flex items-center py-1 px-3 big:py-1.5 big:px-4 rounded-full border text-xs desktop:text-sm big:text-base font-bold font-['Cinzel','Uncial_Antiqua',serif] tracking-[1px] capitalize truncate ${
                currentPlayerClass === "black-turn"
                  ? "bg-white/10 border-white/15 text-[#f4f4f4]"
                  : "bg-[#f0e6d8] border-[#d4c4b0] text-[#5c4a37]"
              }`}
            >
              {gameState.variant}
            </span>
          </div>

          {/* AI Difficulty Badge */}
          {gameMode === "ai" && (
            <div
              className={`flex items-center justify-center w-6 h-6 mid:w-7 mid:h-7 desktop:w-7 desktop:h-7 big:w-8 big:h-8 rounded-full border text-xs mid:text-sm desktop:text-sm big:text-base cursor-help transition-all flex-shrink-0 ${
                currentPlayerClass === "black-turn"
                  ? "bg-white/10 border-white/15 hover:bg-white/15 hover:scale-110"
                  : "bg-[#f0e6d8] border-[#d4c4b0] hover:bg-[#e8dcc8] hover:scale-110"
              }`}
              title={`AI Difficulty: ${aiDifficulty}`}
            >
              {aiDifficulty === "easy"
                ? "😊"
                : aiDifficulty === "medium"
                  ? "🎯"
                  : "🔥"}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 mid:gap-1.5 desktop:gap-1.5 big:gap-2 flex-shrink-0">
            <button
              className={`w-6 h-6 mid:w-7 mid:h-7 desktop:w-7 desktop:h-7 big:w-8 big:h-8 rounded-full border cursor-pointer flex items-center justify-center text-xs mid:text-sm desktop:text-sm big:text-base p-0 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] ${
                currentPlayerClass === "black-turn"
                  ? "bg-white/15 border-white/20 hover:bg-white/25 text-white"
                  : "bg-[#f0e6d8] border-[#d4c4b0] text-[#8B4513] hover:bg-[#e8dcc8]"
              }`}
              onClick={handleShowVariantRules}
              title="View variant rules"
            >
              ⚠️
            </button>
            <button
              className={`w-6 h-6 mid:w-7 mid:h-7 desktop:w-7 desktop:h-7 big:w-8 big:h-8 rounded-full border cursor-pointer flex items-center justify-center text-xs mid:text-sm desktop:text-sm big:text-base p-0 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] ${
                currentPlayerClass === "black-turn"
                  ? "bg-white/15 border-white/20 hover:bg-[rgba(255,107,107,0.3)] hover:border-[rgba(255,107,107,0.4)] text-white"
                  : "bg-[#f0e6d8] border-[#d4c4b0] text-[#8B4513] hover:bg-[#d4a574] hover:text-white"
              }`}
              onClick={handleExitToMenu}
              title="Exit to menu"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {displayError && (
        <div className="bg-[#f44336] text-white py-2 mid:py-3 desktop:py-4 text-center font-bold text-xs mid:text-sm desktop:text-base">
          {displayError}
        </div>
      )}

      {/* ── Main play area ── */}
      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
        {/* Board: fills most of the space */}
        <div className="flex-1 flex items-stretch justify-center min-w-0 overflow-hidden h-full min-h-0 p-1 desktop:p-2.5">
          <Board
            board={gameState.board}
            onPointClick={handlePointClick}
            selectedPoint={selectedPoint}
            validMoves={
              selectedPoint !== null
                ? validMoves
                : gameState.board.dice &&
                    gameState.board.dice[0] === gameState.board.dice[1]
                  ? gameState.legal_moves
                  : validMoves
            }
            currentPlayer={gameState.board.current_player}
            previousBoard={previousBoard}
            lastMove={lastMove}
          />
        </div>

        {/* Right sidebar: dice strip */}
        <div className="flex flex-col items-center justify-center gap-2 w-[90px] mid:w-[110px] desktop:w-auto desktop:min-w-[180px] big:min-w-[220px] mid:gap-3 desktop:gap-5 desktop:py-5 flex-shrink-0">
          <Dice
            dice={gameState.board.dice}
            onRoll={rollDice}
            disabled={
              !gameState.can_roll ||
              gameState.board.game_over ||
              (gameMode === "ai" &&
                gameState.board.current_player !== humanPlayer)
            }
            currentPlayer={
              gameState.board.current_player as "white" | "black" | null
            }
          />
        </div>
      </div>

      {gameState.board.game_over && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-3 mid:p-4">
          <div className="w-full max-w-[90%] mid:max-w-md desktop:max-w-lg rounded-[20px] mid:rounded-[28px] desktop:rounded-[32px] border border-white/10 bg-slate-950/95 p-5 mid:p-6 desktop:p-8 big:p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            <div className="text-xl mid:text-2xl desktop:text-3xl big:text-4xl font-black tracking-[0.08em] text-white">
              Game Over
            </div>
            <p className="mt-3 mid:mt-4 text-sm mid:text-base desktop:text-lg big:text-xl text-white/80">
              Winner:{" "}
              <span className="font-semibold text-amber-300">
                {gameState.board.winner}
              </span>
            </p>
            <p className="mt-1.5 mid:mt-2 text-xs mid:text-sm desktop:text-sm big:text-base text-white/70">
              Thanks for playing. Start a new match or switch variants.
            </p>
            <button
              className="mt-4 mid:mt-5 desktop:mt-6 inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 mid:px-5 mid:py-2.5 desktop:px-6 desktop:py-3 big:px-8 big:py-3.5 text-xs mid:text-sm desktop:text-sm big:text-base font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-amber-300"
              onClick={createNewGame}
            >
              Start New Game
            </button>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="w-[50px] h-[50px] border-[5px] border-gray-200 border-t-green-500 rounded-full animate-[spin_1s_linear_infinite]"></div>
        </div>
      )}

      <FirstPlayerRollModal
        isOpen={showFirstPlayerRoll}
        onComplete={handleFirstPlayerRollComplete}
      />

      <VariantRulesModal
        isOpen={showVariantRules}
        variant={gameState?.variant || selectedVariant}
        rules={variantRules || null}
        onClose={handleVariantRulesClose}
      />

      <ExitConfirmModal
        isOpen={showExitConfirm}
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </div>
  );
}

export default App;
