import React, { useState } from 'react';
import type { LegalMove, GameState } from '../api';
import './GameControls.css';

interface GameControlsProps {
  gameState: GameState;
  onRollDice: () => void;
  onMakeMove: (move: LegalMove) => void;
  onNewGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onRollDice,
  onMakeMove,
  onNewGame,
}) => {
  const [selectedMove, setSelectedMove] = useState<LegalMove | null>(null);
  const [fromPoint, setFromPoint] = useState<string>('');
  const [toPoint, setToPoint] = useState<string>('');

  const handleMoveClick = (move: LegalMove) => {
    setSelectedMove(move);
    if (move.from_point) setFromPoint(move.from_point.toString());
    if (move.to_point) setToPoint(move.to_point.toString());
  };

  const handleManualMove = () => {
    if (!fromPoint || !toPoint) return;

    // Find matching legal move
    const legalMove = gameState.legal_moves.find(
      (m) =>
        m.move_type === 'normal' &&
        m.from_point === parseInt(fromPoint) &&
        m.to_point === parseInt(toPoint)
    );

    if (legalMove) {
      onMakeMove(legalMove);
      setFromPoint('');
      setToPoint('');
      setSelectedMove(null);
    }
  };

  const handleEnterMove = (point: string) => {
    const move = gameState.legal_moves.find(
      (m) => m.move_type === 'enter' && m.to_point === parseInt(point)
    );
    if (move) {
      onMakeMove(move);
    }
  };

  const handleBearOff = (point: string) => {
    const move = gameState.legal_moves.find(
      (m) => m.move_type === 'bear_off' && m.from_point === parseInt(point)
    );
    if (move) {
      onMakeMove(move);
    }
  };

  return (
    <div className="game-controls">
      <div className="controls-section">
        <h3>Game Info</h3>
        <div className="info-item">
          <strong>Variant:</strong> {gameState.variant}
        </div>
        <div className="info-item">
          <strong>Current Player:</strong>{' '}
          <span className={`player ${gameState.board.current_player}`}>
            {gameState.board.current_player || 'None'}
          </span>
        </div>
        {gameState.board.dice && (
          <div className="info-item dice-display">
            <strong>Dice:</strong>
            <div className="dice">
              <span className="die">{gameState.board.dice[0]}</span>
              <span className="die">{gameState.board.dice[1]}</span>
            </div>
          </div>
        )}
        {gameState.board.game_over && (
          <div className="info-item winner">
            <strong>Winner: {gameState.board.winner}</strong>
          </div>
        )}
      </div>

      <div className="controls-section">
        <h3>Actions</h3>
        {gameState.can_roll && !gameState.board.game_over && (
          <button className="btn btn-primary" onClick={onRollDice}>
            Roll Dice
          </button>
        )}
        <button className="btn btn-secondary" onClick={onNewGame}>
          New Game
        </button>
      </div>

      {gameState.legal_moves.length > 0 && (
        <div className="controls-section">
          <h3>Legal Moves ({gameState.legal_moves.length})</h3>
          <div className="legal-moves-list">
            {gameState.legal_moves.slice(0, 10).map((move, idx) => (
              <button
                key={idx}
                className={`move-btn ${selectedMove === move ? 'selected' : ''}`}
                onClick={() => handleMoveClick(move)}
              >
                {move.move_type === 'normal' && (
                  <span>
                    {move.from_point} → {move.to_point} (die {move.die_value})
                  </span>
                )}
                {move.move_type === 'enter' && (
                  <span>Enter → {move.to_point} (die {move.die_value})</span>
                )}
                {move.move_type === 'bear_off' && (
                  <span>Bear off {move.from_point} (die {move.die_value})</span>
                )}
              </button>
            ))}
            {gameState.legal_moves.length > 10 && (
              <div className="more-moves">... and {gameState.legal_moves.length - 10} more</div>
            )}
          </div>
          {selectedMove && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onMakeMove(selectedMove);
                setSelectedMove(null);
              }}
            >
              Make Selected Move
            </button>
          )}
        </div>
      )}

      <div className="controls-section">
        <h3>Manual Move</h3>
        <div className="manual-move">
          <input
            type="number"
            placeholder="From"
            value={fromPoint}
            onChange={(e) => setFromPoint(e.target.value)}
            className="move-input"
          />
          <span>→</span>
          <input
            type="number"
            placeholder="To"
            value={toPoint}
            onChange={(e) => setToPoint(e.target.value)}
            className="move-input"
          />
          <button className="btn btn-primary" onClick={handleManualMove}>
            Move
          </button>
        </div>
        {gameState.board.bar_white > 0 || gameState.board.bar_black > 0 ? (
          <div className="special-moves">
            <input
              type="number"
              placeholder="Enter to point"
              className="move-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEnterMove((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="btn btn-small"
              onClick={() => {
                const input = document.querySelector('.special-moves input') as HTMLInputElement;
                if (input) handleEnterMove(input.value);
              }}
            >
              Enter
            </button>
          </div>
        ) : null}
        {gameState.board.borne_off_white + gameState.board.borne_off_black < 30 && (
          <div className="special-moves">
            <input
              type="number"
              placeholder="Bear off from"
              className="move-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleBearOff((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="btn btn-small"
              onClick={() => {
                const input = document.querySelectorAll('.special-moves input')[1] as HTMLInputElement;
                if (input) handleBearOff(input.value);
              }}
            >
              Bear Off
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameControls;

