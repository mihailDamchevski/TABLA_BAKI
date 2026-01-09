import { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import Dice from './components/Dice';
import FirstPlayerRollModal from './components/FirstPlayerRollModal';
import FirstPlayerResultModal from './components/FirstPlayerResultModal';
import VariantRulesModal from './components/VariantRulesModal';
import CustomDropdown from './components/CustomDropdown';
import { api } from './api';
import type { GameState, LegalMove } from './api';
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

  useEffect(() => {
    loadVariants();
  }, []);

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
        <div className="header-top">
          <div className="header-title">
            <h1>TABLA BAKI</h1>
            <div className="header-subtitle">Backgammon</div>
          </div>

          <div className="turn-indicator">
            <div className={`player-badge ${gameState.board.current_player ?? 'none'}`}>
              <span className="player-dot" />
              <span className="player-text">
                {gameState.board.current_player ? `${gameState.board.current_player.toUpperCase()} TO MOVE` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="game-info">
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

          <div className="game-info-center">
            <span className="info-chip">
              Variant: <strong>{gameState.variant}</strong>
              <button
                className="variant-info-button"
                onClick={handleShowVariantRules}
                title="View variant rules"
              >
                <span className="variant-info-button-icon">⚠️</span>
                <span>Help</span>
              </button>
            </span>
            <span className="info-chip">Game: <strong>{gameState.game_id}</strong></span>
          </div>

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
            disabled={!gameState.can_roll || gameState.board.game_over}
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
          {selectedPoint !== null && validMoves.length > 0 && (
            <div className="valid-moves-list">
              <h3>Valid Moves from {selectedPoint === 0 ? 'Bar' : `Point ${selectedPoint}`}</h3>
              <div className="moves-container">
                {validMoves.map((move, idx) => {
                  const dice = gameState.board.dice;
                  const isCombinedMove = !!dice && move.move_type === 'normal' && move.die_value === dice[0] + dice[1];
                  const dieDisplay = isCombinedMove 
                    ? `Both dice (${dice[0]} + ${dice[1]} = ${move.die_value})`
                    : `Die: ${move.die_value}`;
                  
                  return (
                    <div key={idx} className={`move-item ${isCombinedMove ? 'combined-move' : ''}`}>
                      {move.move_type === 'normal' && move.to_point !== null ? (
                        <span>
                          Point {move.from_point} → Point {move.to_point} ({dieDisplay})
                        </span>
                      ) : move.move_type === 'enter' ? (
                        <span>
                          Enter from Bar → Point {move.to_point} ({dieDisplay})
                        </span>
                      ) : move.move_type === 'bear_off' ? (
                        <div className="move-row">
                          <span>
                            Bear off from Point {move.from_point} ({dieDisplay})
                          </span>
                          <button
                            className="move-action"
                            onClick={() => makeMove(move)}
                            disabled={loading}
                          >
                            Bear off
                          </button>
                        </div>
                      ) : (
                        <span>Move {idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {selectedPoint !== null && validMoves.length === 0 && gameState.board.dice && (
            <div className="valid-moves-list">
              <h3>No Valid Moves</h3>
              <p>No valid moves available from {selectedPoint === 0 ? 'Bar' : `point ${selectedPoint}`}</p>
            </div>
          )}
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
    </div>
  );
}

export default App;
