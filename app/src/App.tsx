import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Board from './components/Board';
import Dice from './components/Dice';
import FirstPlayerRollModal from './components/FirstPlayerRollModal';
import FirstPlayerResultModal from './components/FirstPlayerResultModal';
import VariantRulesModal from './components/VariantRulesModal';
import ExitConfirmModal from './components/ExitConfirmModal';
import CustomDropdown from './components/CustomDropdown';
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
} from './hooks/useGameApi';
import { waitForAnimation } from './utils/animation';
import { storage } from './utils/storage';
import type {
  LegalMove,
  BoardState,
  MoveAnimation,
} from './types/game';

function App() {
  const queryClient = useQueryClient();
  const [gameId, setGameId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('standard');
  const [error, setError] = useState<string | null>(null);
  // Note: we use `0` as a sentinel for selecting the Bar (points are 1-24).
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [showFirstPlayerRoll, setShowFirstPlayerRoll] = useState(false);
  const [showFirstPlayerResult, setShowFirstPlayerResult] = useState(false);
  const [firstPlayer, setFirstPlayer] = useState<'white' | 'black' | null>(null);
  const [validMoves, setValidMoves] = useState<LegalMove[]>([]);
  const [showVariantRules, setShowVariantRules] = useState(false);
  const [firstPlayerRollDone, setFirstPlayerRollDone] = useState(false);
  const [previousBoard, setPreviousBoard] = useState<BoardState | null>(null);
  const [lastMove, setLastMove] = useState<MoveAnimation | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [gameMode, setGameMode] = useState<'local' | 'ai'>('local');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [humanPlayer, setHumanPlayer] = useState<'white' | 'black'>('white');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // React Query hooks
  const { data: variants = [] } = useVariants();
  const { data: gameState } = useGame(gameId, !!gameId);
  const { data: variantRules } = useVariantRules(
    showVariantRules ? (gameState?.variant || selectedVariant) : null,
    showVariantRules
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
          move_type: result.move.move_type
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
      setError(err instanceof Error ? err.message : 'AI move failed');
    } finally {
      setIsAiThinking(false);
    }
  }, [gameId, gameState, aiDifficulty, aiMoveMutation]);

  // Handle AI turns automatically
  useEffect(() => {
    if (
      !gameState ||
      !gameId ||
      gameMode !== 'ai' ||
      gameState.board.game_over ||
      createGameMutation.isPending ||
      rollDiceMutation.isPending ||
      makeMoveMutation.isPending ||
      aiMoveMutation.isPending ||
      isAiThinking ||
      showFirstPlayerRoll ||
      showFirstPlayerResult
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
            setError(err instanceof Error ? err.message : 'Failed to roll dice for AI');
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
  }, [gameState, gameId, gameMode, humanPlayer, createGameMutation.isPending, rollDiceMutation.isPending, makeMoveMutation.isPending, aiMoveMutation.isPending, isAiThinking, showFirstPlayerRoll, showFirstPlayerResult, makeAIMove]);

  const checkVariantSeen = (variant: string): boolean => {
    const seen = storage.get<string[]>('seenVariants', []);
    return seen.includes(variant);
  };

  const markVariantSeen = (variant: string) => {
    const seen = storage.get<string[]>('seenVariants', []);
    if (!seen.includes(variant)) {
      seen.push(variant);
      storage.set('seenVariants', seen);
    }
  };

  const createNewGame = async () => {
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Failed to create game');
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
    setShowFirstPlayerResult(false);
    setFirstPlayer(null);
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

  const handleFirstPlayerRollComplete = async (player: 'white' | 'black') => {
    setShowFirstPlayerRoll(false);
    setFirstPlayer(player);
    setFirstPlayerRollDone(true);
    setShowFirstPlayerResult(true);
    
    // Set the starting player in the game
    if (gameId) {
      try {
        await setStartingPlayerMutation.mutateAsync({
          gameId,
          player,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set starting player');
      }
    }
  };

  const handleFirstPlayerResultClose = () => {
    setShowFirstPlayerResult(false);
    setFirstPlayer(null);
  };

  const rollDice = async () => {
    if (!gameId) return;
    setError(null);
    try {
      await rollDiceMutation.mutateAsync(gameId);
      setSelectedPoint(null);
      setValidMoves([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll dice');
    }
  };

  const makeMove = async (move: LegalMove) => {
    if (!gameId || !gameState) return;
    setError(null);
    try {
      setPreviousBoard({ ...gameState.board });
      setLastMove({
        from_point: move.from_point ?? 0,
        to_point: move.to_point ?? 0,
        move_type: move.move_type
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
          }, 800);
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    }
  };

  const handlePointClick = (pointNumber: number) => {
    if (!gameState || !gameState.board.dice) return;

    const currentPlayer = gameState.board.current_player;
    const barCount =
      currentPlayer === 'white'
        ? gameState.board.bar_white
        : currentPlayer === 'black'
          ? gameState.board.bar_black
          : 0;

    const enterMoves = gameState.legal_moves.filter((m) => m.move_type === 'enter');
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
          ? gameState.legal_moves.filter((m) => m.move_type === 'enter')
          : gameState.legal_moves.filter((m) => m.from_point === pointNumber);
      setValidMoves(movesFromPoint);
    } else {
      // Second click - try to make a move
      // If user clicks the same point again, allow bear-off directly when available.
      if (selectedPoint !== 0 && pointNumber === selectedPoint) {
        const bearOffMove = gameState.legal_moves.find(
          (m) => m.move_type === 'bear_off' && m.from_point === selectedPoint
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
          return m.move_type === 'enter' && m.to_point === pointNumber;
        }
        return m.move_type === 'normal' && m.from_point === selectedPoint && m.to_point === pointNumber;
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
            ? gameState.legal_moves.filter((m) => m.move_type === 'enter')
            : gameState.legal_moves.filter((m) => m.from_point === pointNumber);
        setValidMoves(movesFromPoint);
      }
    }
  };

  const isLoading = createGameMutation.isPending || rollDiceMutation.isPending || makeMoveMutation.isPending || aiMoveMutation.isPending || setStartingPlayerMutation.isPending;

  if (!gameState) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,0,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,69,19,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2)_0%,transparent_60%),linear-gradient(135deg,#0a1a0a_0%,#1a2a1a_25%,#0f1419_50%,#1a1a2a_75%,#0a0a1a_100%)] bg-[length:200%_200%,200%_200%,200%_200%,100%_100%] animate-[casinoGlow_20s_ease_infinite] overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4 overflow-hidden relative bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,0,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,69,19,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2)_0%,transparent_60%),linear-gradient(135deg,#0a1a0a_0%,#1a2a1a_25%,#0f1419_50%,#1a1a2a_75%,#0a0a1a_100%)] bg-[length:200%_200%,200%_200%,200%_200%,100%_100%] animate-[casinoGlow_20s_ease_infinite] before:content-[''] before:absolute before:rounded-full before:blur-[80px] before:opacity-60 before:animate-[blobFloat_20s_ease-in-out_infinite] before:w-[500px] before:h-[500px] before:bg-[rgba(255,107,107,0.5)] before:-top-[200px] before:-left-[200px] after:content-[''] after:absolute after:rounded-full after:blur-[80px] after:opacity-60 after:animate-[blobFloat_20s_ease-in-out_infinite] after:delay-[-10s] after:w-[600px] after:h-[600px] after:bg-[rgba(107,255,255,0.5)] after:-bottom-[300px] after:-right-[300px]">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden z-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute w-1.5 h-1.5 bg-[rgba(255,215,0,0.6)] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)] animate-[floatUp_linear_infinite]" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
                top: `${Math.random() * 100}%`,
                transform: `translateY(${Math.random() * 200 - 100}px)`
              }}></div>
            ))}
          </div>
          
          <h1 className="text-[2.8em] text-white m-0 font-['Bungee','Black_Ops_One','Audiowide',cursive] tracking-[4px] font-black bg-gradient-to-br from-[#ffd700] via-[#ff8c00] to-[#ff4500] bg-clip-text text-transparent animate-[titleGlow_3s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(255,215,0,0.9),0_0_20px_rgba(255,140,0,0.7),0_0_30px_rgba(255,69,0,0.5),0_0_40px_rgba(255,255,255,0.3),2px_2px_4px_rgba(0,0,0,0.5)] relative z-[1]">TABLA BAKI</h1>
          <h2 className="text-[1.4em] text-white m-0 font-['Orbitron','Audiowide',sans-serif] tracking-[2px] opacity-95 font-bold uppercase drop-shadow-[0_0_10px_rgba(255,215,0,0.6),0_0_20px_rgba(255,140,0,0.4),2px_2px_4px_rgba(0,0,0,0.3)] relative z-[1]">Backgammon Game</h2>
          <div className="flex flex-col gap-3 items-center bg-white/15 backdrop-blur-[10px] p-4 rounded-2xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] animate-[cardFloat_6s_ease-in-out_infinite] relative z-[5] w-full max-w-[350px]">
            <CustomDropdown
              options={variants}
              value={selectedVariant}
              onChange={setSelectedVariant}
              label="Select Variant:"
            />
          </div>
          <div className="flex flex-col gap-2 items-center bg-white/15 backdrop-blur-[10px] p-4 rounded-2xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] animate-[cardFloat_6s_ease-in-out_infinite] delay-75 relative z-[4] w-full max-w-[350px]">
            <CustomDropdown
              options={[
                { value: 'local', label: '👥 Local (2 Players)' },
                { value: 'ai', label: '🤖 Single Player vs AI' }
              ]}
              value={gameMode}
              onChange={(val) => setGameMode(val as 'local' | 'ai')}
              label="Game Mode:"
              searchable={false}
            />
            
            {gameMode === 'ai' && (
              <>
                <CustomDropdown
                  options={[
                    { value: 'easy', label: '😊 Easy' },
                    { value: 'medium', label: '🎯 Medium' },
                    { value: 'hard', label: '🔥 Hard' }
                  ]}
                  value={aiDifficulty}
                  onChange={(val) => setAiDifficulty(val as 'easy' | 'medium' | 'hard')}
                  label="AI Difficulty:"
                  searchable={false}
                />
                
                <CustomDropdown
                  options={[
                    { value: 'white', label: '⚪ White' },
                    { value: 'black', label: '⚫ Black' }
                  ]}
                  value={humanPlayer}
                  onChange={(val) => setHumanPlayer(val as 'white' | 'black')}
                  label="You Play As:"
                  searchable={false}
                />
              </>
            )}
          </div>
          <button
            className="py-2.5 px-5 text-sm border-none rounded-lg cursor-pointer font-bold transition-all relative z-0 font-['Orbitron','Audiowide',sans-serif] tracking-[1px] uppercase bg-gradient-to-br from-[#4CAF50] to-[#45a049] text-white shadow-[0_6px_20px_rgba(76,175,80,0.4),0_0_0_0_rgba(76,175,80,0.7)] animate-[pulseButton_2s_ease-in-out_infinite] border-2 border-white/30 relative overflow-hidden before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:w-0 before:h-0 before:rounded-full before:bg-white/30 before:-translate-x-1/2 before:-translate-y-1/2 before:transition-all before:duration-600 hover:before:w-[300px] hover:before:h-[300px] hover:bg-gradient-to-br hover:from-[#45a049] hover:to-[#4CAF50] hover:scale-110 hover:shadow-[0_8px_30px_rgba(76,175,80,0.6),0_0_0_4px_rgba(76,175,80,0.3)] active:scale-105 disabled:bg-gray-300/50 disabled:cursor-not-allowed disabled:transform-none disabled:animate-none disabled:shadow-none relative z-[1]"
            onClick={createNewGame}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : '🎲 Start New Game 🎲'}
          </button>
          {error && <div className="bg-[rgba(244,67,54,0.9)] backdrop-blur-[10px] text-white py-2.5 px-[18px] rounded-[10px] mt-2.5 text-center border-2 border-white/30 shadow-[0_4px_15px_rgba(244,67,54,0.4)] animate-[shakeError_0.5s_ease-in-out] text-sm relative z-[1]">{error}</div>}
        </div>
      </div>
    );
  }

  const currentPlayerClass = gameState.board.current_player ? `${gameState.board.current_player}-turn` : '';
  const isWhiteTurn = currentPlayerClass === 'white-turn';

  return (
    <div className="h-screen w-screen flex flex-col bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,0,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,69,19,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2)_0%,transparent_60%),linear-gradient(135deg,#0a1a0a_0%,#1a2a1a_25%,#0f1419_50%,#1a1a2a_75%,#0a0a1a_100%)] bg-[length:200%_200%,200%_200%,200%_200%,100%_100%] animate-[casinoGlow_20s_ease_infinite] overflow-hidden">
      <header 
        className={`relative py-2.5 px-4 shadow-[0_4px_15px_rgba(0,0,0,0.4)] flex-shrink-0 border-b-2 overflow-hidden transition-[color,border-color] duration-700 ease-in-out ${
          isWhiteTurn ? 'text-[#222] border-b-[rgba(0,0,0,0.1)]' : 'text-[#f4f4f4] border-b-[rgba(184,134,11,0.5)]'
        }`}
      >
        {/* Beige background layer */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-[#f5e6d3] via-[#e8d5c4] to-[#f5e6d3] transition-opacity duration-700 ease-in-out pointer-events-none ${
            isWhiteTurn ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {/* Dark background layer */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-[#0a1a0a] via-[#1a2a1a] to-[#0a1a0a] transition-opacity duration-700 ease-in-out pointer-events-none ${
            isWhiteTurn ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <div className="relative z-10 flex items-center justify-between w-full gap-3 h-full">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <h1 className={`m-0 text-[1.8em] tracking-[2px] whitespace-nowrap font-['Bungee','Black_Ops_One','Audiowide',cursive] font-black animate-[titleGlow_3s_ease-in-out_infinite] ${
              currentPlayerClass === 'white-turn' 
                ? 'text-[#8B4513] drop-shadow-[0_0_4px_rgba(139,69,19,0.4),2px_2px_4px_rgba(0,0,0,0.2)]' 
                : 'bg-gradient-to-br from-[#ffd700] via-[#ff8c00] to-[#ff4500] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,215,0,0.8),0_0_15px_rgba(255,140,0,0.6),2px_2px_4px_rgba(0,0,0,0.5)]'
            }`}>
              🔥 TABLA BAKI
            </h1>
          </div>

          {/* White Stats */}
          <div className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border ${
            currentPlayerClass === 'black-turn' 
              ? 'bg-white/10 border-white/20' 
              : 'bg-[#f0e6d8] border-[#d4c4b0]'
          }`}>
            <span className="text-base leading-none">⚪</span>
            <span className={`text-[10px] font-bold tracking-[1px] uppercase ${currentPlayerClass === 'black-turn' ? 'text-[#f4f4f4]' : 'text-[#5c4a37]'} font-['Orbitron','Audiowide',sans-serif]`}>W</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[10px] leading-none">🚫</span>
              <span className={`text-[11px] font-bold ${currentPlayerClass === 'black-turn' ? 'text-[#f4f4f4]' : 'text-[#5c4a37]'}`}>{gameState.board.bar_white}</span>
            </div>
            <div className={`w-px h-4 mx-0.5 ${currentPlayerClass === 'black-turn' ? 'bg-gray-400' : 'bg-[#d4c4b0]'}`}></div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] leading-none">✅</span>
              <span className={`text-[11px] font-bold ${currentPlayerClass === 'black-turn' ? 'text-[#f4f4f4]' : 'text-[#5c4a37]'}`}>{gameState.board.borne_off_white}</span>
            </div>
          </div>

          {/* Black Stats */}
          <div className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border ${
            currentPlayerClass === 'black-turn' 
              ? 'bg-white/10 border-white/20' 
              : 'bg-[#f0e6d8] border-[#d4c4b0]'
          }`}>
            <span className="text-base leading-none">⚫</span>
            <span className={`text-[10px] font-bold tracking-[1px] uppercase ${currentPlayerClass === 'black-turn' ? 'text-[#f4f4f4]' : 'text-[#5c4a37]'} font-['Orbitron','Audiowide',sans-serif]`}>B</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[10px] leading-none">🚫</span>
              <span className={`text-[11px] font-bold ${currentPlayerClass === 'black-turn' ? 'text-[#f4f4f4]' : 'text-[#5c4a37]'}`}>{gameState.board.bar_black}</span>
            </div>
            <div className={`w-px h-4 mx-0.5 ${currentPlayerClass === 'black-turn' ? 'bg-gray-400' : 'bg-[#d4c4b0]'}`}></div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] leading-none">✅</span>
              <span className={`text-[11px] font-bold ${currentPlayerClass === 'black-turn' ? 'text-[#f4f4f4]' : 'text-[#5c4a37]'}`}>{gameState.board.borne_off_black}</span>
            </div>
          </div>

          {/* AI Thinking Indicator */}
          {gameMode === 'ai' && isAiThinking && gameState.board.current_player !== humanPlayer && (
            <div className="flex items-center py-1 px-2.5 bg-[rgba(255,107,107,0.2)] border border-[rgba(255,107,107,0.4)] rounded-full animate-[aiPulse_1.5s_ease-in-out_infinite] flex-shrink-0">
              <span className="text-[10px] font-semibold text-[rgba(255,107,107,0.95)] font-['Orbitron','Audiowide',sans-serif] tracking-[0.5px]">🤖 AI</span>
            </div>
          )}

          {/* Variant Name */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <span className={`inline-flex items-center py-1 px-3 rounded-full border text-xs font-bold font-['Cinzel','Uncial_Antiqua',serif] tracking-[1px] capitalize truncate ${
              currentPlayerClass === 'black-turn' 
                ? 'bg-white/10 border-white/15 text-[#f4f4f4]' 
                : 'bg-[#f0e6d8] border-[#d4c4b0] text-[#5c4a37]'
            }`}>
              {gameState.variant}
            </span>
          </div>

          {/* AI Difficulty Badge */}
          {gameMode === 'ai' && (
            <div className={`flex items-center justify-center w-7 h-7 rounded-full border text-sm cursor-help transition-all flex-shrink-0 ${
              currentPlayerClass === 'black-turn' 
                ? 'bg-white/10 border-white/15 hover:bg-white/15 hover:scale-110' 
                : 'bg-[#f0e6d8] border-[#d4c4b0] hover:bg-[#e8dcc8] hover:scale-110'
            }`} title={`AI Difficulty: ${aiDifficulty}`}>
              {aiDifficulty === 'easy' ? '😊' : aiDifficulty === 'medium' ? '🎯' : '🔥'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              className={`w-7 h-7 rounded-full border cursor-pointer flex items-center justify-center text-sm p-0 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] ${
                currentPlayerClass === 'black-turn' 
                  ? 'bg-white/15 border-white/20 hover:bg-white/25 text-white' 
                  : 'bg-[#f0e6d8] border-[#d4c4b0] text-[#8B4513] hover:bg-[#e8dcc8]'
              }`}
              onClick={handleShowVariantRules}
              title="View variant rules"
            >
              ⚠️
            </button>
            <button
              className={`w-7 h-7 rounded-full border cursor-pointer flex items-center justify-center text-sm p-0 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] ${
                currentPlayerClass === 'black-turn' 
                  ? 'bg-white/15 border-white/20 hover:bg-[rgba(255,107,107,0.3)] hover:border-[rgba(255,107,107,0.4)] text-white' 
                  : 'bg-[#f0e6d8] border-[#d4c4b0] text-[#8B4513] hover:bg-[#d4a574] hover:text-white'
              }`}
              onClick={handleExitToMenu}
              title="Exit to menu"
            >
              🚪
            </button>
          </div>
        </div>
      </header>
      
      {error && <div className="bg-[#f44336] text-white py-4 text-center font-bold">{error}</div>}
      
      <div className="flex gap-5 p-2.5 flex-1 min-h-0 items-stretch justify-center overflow-hidden">
        <div className="flex-1 flex items-stretch justify-center min-w-0 overflow-hidden h-full min-h-0">
          <Board
            board={gameState.board}
            onPointClick={handlePointClick}
            selectedPoint={selectedPoint}
            validMoves={validMoves}
            currentPlayer={gameState.board.current_player}
            previousBoard={previousBoard}
            lastMove={lastMove}
          />
        </div>
        <div className="flex flex-col items-center justify-start py-5 min-w-[250px] gap-5">
          <Dice
            dice={gameState.board.dice}
            onRoll={rollDice}
            disabled={
              !gameState.can_roll || 
              gameState.board.game_over || 
              (gameMode === 'ai' && gameState.board.current_player !== humanPlayer)
            }
            currentPlayer={gameState.board.current_player}
          />
          
          <div className="w-full max-w-[300px] h-[250px] mx-auto bg-gradient-to-br from-white/10 to-white/5 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_3s_infinite]">
            <div className="flex flex-col items-center justify-center gap-3 z-[1] text-white/60">
              <div className="text-[32px] opacity-70">📢</div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-semibold tracking-[1px] uppercase opacity-80">Advertisement</div>
                <div className="text-[10px] opacity-60 font-mono">300 × 250</div>
              </div>
            </div>
          </div>
          <div className="w-full max-w-[300px] h-[250px] mx-auto bg-gradient-to-br from-white/10 to-white/5 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_3s_infinite]">
            <div className="flex flex-col items-center justify-center gap-3 z-[1] text-white/60">
              <div className="text-[32px] opacity-70">📢</div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-semibold tracking-[1px] uppercase opacity-80">Advertisement</div>
                <div className="text-[10px] opacity-60 font-mono">300 × 250</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="w-[50px] h-[50px] border-[5px] border-gray-200 border-t-green-500 rounded-full animate-[spin_1s_linear_infinite]"></div>
        </div>
      )}
      
      <FirstPlayerRollModal
        isOpen={showFirstPlayerRoll}
        onComplete={handleFirstPlayerRollComplete}
      />
      
      <FirstPlayerResultModal
        isOpen={showFirstPlayerResult}
        firstPlayer={firstPlayer || 'white'}
        onClose={handleFirstPlayerResultClose}
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
