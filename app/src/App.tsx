import { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import Dice from './components/Dice';
import FirstPlayerRollModal from './components/FirstPlayerRollModal';
import FirstPlayerResultModal from './components/FirstPlayerResultModal';
import CustomDropdown from './components/CustomDropdown';
import { api } from './api';
import type { GameState, LegalMove } from './api';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [showFirstPlayerRoll, setShowFirstPlayerRoll] = useState(false);
  const [showFirstPlayerResult, setShowFirstPlayerResult] = useState(false);
  const [firstPlayer, setFirstPlayer] = useState<'white' | 'black' | null>(null);
  const [validMoves, setValidMoves] = useState<LegalMove[]>([]);

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

  const createNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await api.createGame(selectedVariant);
      setGameState(state);
      setSelectedPoint(null);
      // Show first player roll modal
      setShowFirstPlayerRoll(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstPlayerRollComplete = async (player: 'white' | 'black') => {
    setShowFirstPlayerRoll(false);
    setFirstPlayer(player);
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
      const moveRequest = {
        from_point: move.from_point,
        to_point: move.to_point,
        move_type: move.move_type,
        die_value: move.die_value,
      };
      const result = await api.makeMove(gameState.game_id, moveRequest);
      setGameState(result.game_state);
      setSelectedPoint(null);
      setValidMoves([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
    }
  };

  const handlePointClick = (pointNumber: number) => {
    if (!gameState || !gameState.board.dice) return;
    
    if (selectedPoint === null) {
      // First click - select the point and show valid moves
      setSelectedPoint(pointNumber);
      
      // Filter valid moves from this point
      const movesFromPoint = gameState.legal_moves.filter(
        (m) => m.from_point === pointNumber
      );
      setValidMoves(movesFromPoint);
    } else {
      // Second click - try to make a move
      const move = gameState.legal_moves.find(
        (m) =>
          m.move_type === 'normal' &&
          m.from_point === selectedPoint &&
          m.to_point === pointNumber
      );
      
      if (move) {
        makeMove(move);
        setSelectedPoint(null);
        setValidMoves([]);
      } else {
        // Clicked a different point - update selection
        setSelectedPoint(pointNumber);
        const movesFromPoint = gameState.legal_moves.filter(
          (m) => m.from_point === pointNumber
        );
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
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`
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
      <header className="App-header">
        <h1>TABLA BAKI - Backgammon</h1>
        <div className="game-info">
          <span>Variant: {gameState.variant}</span>
          <span>Game ID: {gameState.game_id}</span>
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
          />
        </div>
        <div className="dice-section">
          <Dice
            dice={gameState.board.dice}
            onRoll={rollDice}
            disabled={!gameState.can_roll || gameState.board.game_over}
          />
          {selectedPoint !== null && validMoves.length > 0 && (
            <div className="valid-moves-list">
              <h3>Valid Moves from Point {selectedPoint}</h3>
              <div className="moves-container">
                {validMoves.map((move, idx) => (
                  <div key={idx} className="move-item">
                    {move.move_type === 'normal' && move.to_point !== null ? (
                      <span>
                        Point {move.from_point} → Point {move.to_point} (Die: {move.die_value})
                      </span>
                    ) : move.move_type === 'enter' ? (
                      <span>
                        Enter from Bar → Point {move.to_point} (Die: {move.die_value})
                      </span>
                    ) : move.move_type === 'bear_off' ? (
                      <span>
                        Bear off from Point {move.from_point} (Die: {move.die_value})
                      </span>
                    ) : (
                      <span>Move {idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedPoint !== null && validMoves.length === 0 && gameState.board.dice && (
            <div className="valid-moves-list">
              <h3>No Valid Moves</h3>
              <p>No valid moves available from point {selectedPoint}</p>
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
    </div>
  );
}

export default App;
