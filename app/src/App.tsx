import { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import GameControls from './components/GameControls';
import { api } from './api';
import type { GameState, LegalMove } from './api';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const vars = await api.listVariants();
      setVariants(vars);
      if (vars.length > 0 && !variants.includes(selectedVariant)) {
        setSelectedVariant(vars[0]);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const rollDice = async () => {
    if (!gameState) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.rollDice(gameState.game_id);
      setGameState(result.game_state);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
    }
  };

  const handlePointClick = (pointNumber: number) => {
    if (!gameState || !gameState.board.dice) return;
    
    if (selectedPoint === null) {
      setSelectedPoint(pointNumber);
    } else {
      // Try to make a move
      const move = gameState.legal_moves.find(
        (m) =>
          m.move_type === 'normal' &&
          m.from_point === selectedPoint &&
          m.to_point === pointNumber
      );
      
      if (move) {
        makeMove(move);
      } else {
        setSelectedPoint(pointNumber);
      }
    }
  };

  if (!gameState) {
    return (
      <div className="App">
        <div className="start-screen">
          <h1>TABLA BAKI</h1>
          <h2>Backgammon Game</h2>
          <div className="variant-selector">
            <label>Select Variant:</label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
            >
              {variants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={createNewGame}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Start New Game'}
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
          />
        </div>
        <div className="controls-section">
          <GameControls
            gameState={gameState}
            onRollDice={rollDice}
            onMakeMove={makeMove}
            onNewGame={createNewGame}
          />
        </div>
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default App;
