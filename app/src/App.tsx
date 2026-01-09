import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Board from './components/Board';
import Dice from './components/Dice';
import FirstPlayerRollModal from './components/FirstPlayerRollModal';
import FirstPlayerResultModal from './components/FirstPlayerResultModal';
import VariantRulesModal from './components/VariantRulesModal';
import ExitConfirmModal from './components/ExitConfirmModal';
import CustomDropdown from './components/CustomDropdown';
import { api } from './api';
import type { GameState, LegalMove, BoardState } from './api';
import type { VariantRules } from './components/VariantRulesModal';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Note: we use `0` as a sentinel for selecting the Bar (points are 1-24).
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [showFirstPlayerRoll, setShowFirstPlayerRoll] = useState(false);
  const [showFirstPlayerResult, setShowFirstPlayerResult] = useState(false);
  const [firstPlayer, setFirstPlayer] = useState<'white' | 'black' | null>(null);
  const [validMoves, setValidMoves] = useState<LegalMove[]>([]);
  const [showVariantRules, setShowVariantRules] = useState(false);
  const [variantRules, setVariantRules] = useState<VariantRules | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [firstPlayerRollDone, setFirstPlayerRollDone] = useState(false);
  const [previousBoard, setPreviousBoard] = useState<BoardState | null>(null);
  const [lastMove, setLastMove] = useState<{ from_point: number; to_point: number; move_type: string } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [gameMode, setGameMode] = useState<'local' | 'ai'>('local');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [humanPlayer, setHumanPlayer] = useState<'white' | 'black'>('white');
  const [isAiThinking, setIsAiThinking] = useState(false);

  useEffect(() => {
    loadVariants();
  }, []);

  const makeAIMove = useCallback(async () => {
    if (!gameState) return;
    
    setIsAiThinking(true);
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.aiMove(gameState.game_id, aiDifficulty);
      
      // If AI made a move, set up animation first before updating game state
      if (result.move) {
        // Store the previous board state for animation (keep old gameState visible)
        setPreviousBoard({ ...gameState.board });
        setLastMove({
          from_point: result.move.from_point || 0,
          to_point: result.move.to_point || 0,
          move_type: result.move.move_type
        });
        
        // Wait for animation to complete (800ms) before updating game state
        // This ensures the checker animation finishes before showing the new position
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              // Update game state after animation completes - checker will appear in new position
              setGameState(result.game_state);
              setSelectedPoint(null);
              setValidMoves([]);
              setPreviousBoard(null);
              setLastMove(null);
            }, 800);
          });
        });
      } else {
        // No move made, update state immediately
        setGameState(result.game_state);
        setSelectedPoint(null);
        setValidMoves([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI move failed');
    } finally {
      setLoading(false);
      setIsAiThinking(false);
    }
  }, [gameState, aiDifficulty]);

  // Handle AI turns automatically
  useEffect(() => {
    if (
      !gameState ||
      gameMode !== 'ai' ||
      gameState.board.game_over ||
      loading ||
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
            const result = await api.rollDice(gameState.game_id);
            setGameState(result.game_state);
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
  }, [gameState, gameMode, humanPlayer, loading, isAiThinking, showFirstPlayerRoll, showFirstPlayerResult, makeAIMove]);

  const loadVariants = async () => {
    try {
      const vars = await api.listVariants();
      // Sort variants: Portes, Plakoto, Fevga first, then rest alphabetically
      const priorityVariants = ['portes', 'plakoto', 'fevga'];
      const sortedVariants = [
        ...priorityVariants.filter(v => vars.includes(v)),
        ...vars.filter(v => !priorityVariants.includes(v)).sort()
      ];
      setVariants(sortedVariants);
      if (sortedVariants.length > 0 && !sortedVariants.includes(selectedVariant)) {
        setSelectedVariant(sortedVariants[0]);
      }
    } catch (err) {
      setError('Failed to load variants');
    }
  };

  const checkVariantSeen = (variant: string): boolean => {
    const seenVariants = localStorage.getItem('seenVariants');
    if (!seenVariants) return false;
    const seen = JSON.parse(seenVariants);
    return seen.includes(variant);
  };

  const markVariantSeen = (variant: string) => {
    const seenVariants = localStorage.getItem('seenVariants');
    const seen = seenVariants ? JSON.parse(seenVariants) : [];
    if (!seen.includes(variant)) {
      seen.push(variant);
      localStorage.setItem('seenVariants', JSON.stringify(seen));
    }
  };

  const loadVariantRules = async (variant: string) => {
    setLoadingRules(true);
    try {
      const rules = await api.getVariantRules(variant);
      setVariantRules(rules);
    } catch (err) {
      console.error('Failed to load variant rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const createNewGame = async () => {
    setLoading(true);
    setError(null);
    setFirstPlayerRollDone(false);
    try {
      const state = await api.createGame(selectedVariant);
      setGameState(state);
      setSelectedPoint(null);
      
      // Check if variant has been seen before
      const isFirstTime = !checkVariantSeen(selectedVariant);
      
      if (isFirstTime) {
        // Load rules and show modal
        await loadVariantRules(selectedVariant);
        markVariantSeen(selectedVariant);
        setShowVariantRules(true);
      } else {
        // Show first player roll modal immediately if variant already seen
        setShowFirstPlayerRoll(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantRulesClose = () => {
    setShowVariantRules(false);
    // Show first player roll modal after variant rules modal closes, but only if not already done
    if (gameState && !firstPlayerRollDone) {
      setShowFirstPlayerRoll(true);
    }
  };

  const handleShowVariantRules = async () => {
    const variantToShow = gameState?.variant || selectedVariant;
    if (!variantRules || variantRules.variant !== variantToShow) {
      await loadVariantRules(variantToShow);
    }
    setShowVariantRules(true);
  };

  const handleExitToMenu = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setGameState(null);
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
    if (gameState) {
      try {
        const updatedState = await api.setStartingPlayer(gameState.game_id, player);
        setGameState(updatedState);
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
    if (!gameState) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.rollDice(gameState.game_id);
      setGameState(result.game_state);
      setSelectedPoint(null);
      setValidMoves([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll dice');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (move: LegalMove) => {
    if (!gameState) return;
    setLoading(true);
    setError(null);
    try {
      setPreviousBoard({ ...gameState.board });
      setLastMove({
        from_point: move.from_point,
        to_point: move.to_point,
        move_type: move.move_type
      });
      
      const moveRequest = {
        from_point: move.from_point,
        to_point: move.to_point,
        move_type: move.move_type,
        die_value: move.die_value,
      };
      
      const result = await api.makeMove(gameState.game_id, moveRequest);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setGameState(result.game_state);
            setSelectedPoint(null);
            setValidMoves([]);
            setPreviousBoard(null);
            setLastMove(null);
          }, 800);
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
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

  if (!gameState) {
    return (
      <div className="App">
        <div className="start-screen">
          {/* Floating particles */}
          <div className="particles">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
                top: `${Math.random() * 100}%`,
                transform: `translateY(${Math.random() * 200 - 100}px)`
              }}></div>
            ))}
          </div>
          
          <h1>TABLA BAKI</h1>
          <h2>Backgammon Game</h2>
          <div className="variant-selector">
            <CustomDropdown
              options={variants}
              value={selectedVariant}
              onChange={setSelectedVariant}
              label="Select Variant:"
            />
          </div>
          <div className="game-mode-selector">
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
            className="btn btn-primary"
            onClick={createNewGame}
            disabled={loading}
          >
            {loading ? 'Loading...' : '🎲 Start New Game 🎲'}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className={`App-header ${gameState.board.current_player ? `${gameState.board.current_player}-turn` : ''}`}>
        <div className="header-title-row">
          <h1>🔥 TABLA BAKI</h1>
        </div>

        <div className="header-content-row">
          <div className="player-status-header white-player-header">
            <div className="player-status-compact">
              <div className="player-icon-small white-icon">⚪</div>
              <div className="player-label-small">WHITE</div>
              <div className="player-stats-compact">
                <div className="stat-compact">
                  <span className="stat-icon-small">🚫</span>
                  <div className="checker-display-compact">
                    {gameState.board.bar_white > 0 ? (
                      <>
                        {Array.from({ length: Math.min(gameState.board.bar_white, 3) }).map((_, i) => (
                          <div key={i} className="mini-checker-compact white"></div>
                        ))}
                        {gameState.board.bar_white > 3 && <span className="checker-count-small">{gameState.board.bar_white}</span>}
                      </>
                    ) : (
                      <span className="zero-value-small">0</span>
                    )}
                  </div>
                </div>
                <div className="stat-compact">
                  <span className="stat-icon-small">✅</span>
                  <div className="checker-display-compact">
                    {gameState.board.borne_off_white > 0 ? (
                      <>
                        {Array.from({ length: Math.min(gameState.board.borne_off_white, 3) }).map((_, i) => (
                          <div key={i} className="mini-checker-compact white"></div>
                        ))}
                        {gameState.board.borne_off_white > 3 && <span className="checker-count-small">{gameState.board.borne_off_white}</span>}
                      </>
                    ) : (
                      <span className="zero-value-small">0</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="header-spacer"></div>

          <div className="player-status-header black-player-header">
            <div className="player-status-compact">
              <div className="player-icon-small black-icon">⚫</div>
              <div className="player-label-small">BLACK</div>
              <div className="player-stats-compact">
                <div className="stat-compact">
                  <span className="stat-icon-small">🚫</span>
                  <div className="checker-display-compact">
                    {gameState.board.bar_black > 0 ? (
                      <>
                        {Array.from({ length: Math.min(gameState.board.bar_black, 3) }).map((_, i) => (
                          <div key={i} className="mini-checker-compact black"></div>
                        ))}
                        {gameState.board.bar_black > 3 && <span className="checker-count-small">{gameState.board.bar_black}</span>}
                      </>
                    ) : (
                      <span className="zero-value-small">0</span>
                    )}
                  </div>
                </div>
                <div className="stat-compact">
                  <span className="stat-icon-small">✅</span>
                  <div className="checker-display-compact">
                    {gameState.board.borne_off_black > 0 ? (
                      <>
                        {Array.from({ length: Math.min(gameState.board.borne_off_black, 3) }).map((_, i) => (
                          <div key={i} className="mini-checker-compact black"></div>
                        ))}
                        {gameState.board.borne_off_black > 3 && <span className="checker-count-small">{gameState.board.borne_off_black}</span>}
                      </>
                    ) : (
                      <span className="zero-value-small">0</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="header-right-controls">
            {gameMode === 'ai' && isAiThinking && gameState.board.current_player !== humanPlayer && (
              <div className="ai-thinking-indicator">
                <span className="ai-thinking-text">🤖 AI Thinking...</span>
              </div>
            )}
            <span className="variant-chip">{gameState.variant}</span>
            {gameMode === 'ai' && (
              <span className="ai-difficulty-chip" title={`AI Difficulty: ${aiDifficulty}`}>
                {aiDifficulty === 'easy' ? '😊' : aiDifficulty === 'medium' ? '🎯' : '🔥'}
              </span>
            )}
            <button
              className="variant-help-button"
              onClick={handleShowVariantRules}
              title="View variant rules"
            >
              ⚠️
            </button>
            <button
              className="exit-button"
              onClick={handleExitToMenu}
              title="Exit to menu"
            >
              🚪
            </button>
          </div>
        </div>
      </header>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="game-container">
        <div className="board-section">
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
        <div className="dice-section">
          <Dice
            dice={gameState.board.dice}
            onRoll={rollDice}
            disabled={
              !gameState.can_roll || 
              gameState.board.game_over || 
              (gameMode === 'ai' && gameState.board.current_player !== humanPlayer)
            }
          />
          
          <div className="ad-placeholder">
            <div className="ad-content">
              <div className="ad-icon">📢</div>
              <div className="ad-text">
                <div className="ad-label">Advertisement</div>
                <div className="ad-size">300 × 250</div>
              </div>
            </div>
          </div>
          <div className="ad-placeholder">
            <div className="ad-content">
              <div className="ad-icon">📢</div>
              <div className="ad-text">
                <div className="ad-label">Advertisement</div>
                <div className="ad-size">300 × 250</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
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
        rules={variantRules}
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
