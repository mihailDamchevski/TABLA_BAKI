import React, { useState } from 'react';
import type { LegalMove, GameState } from '../types/game';

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
    <div className="flex flex-col gap-4 p-5 bg-[#f5f5f5] rounded-lg h-full overflow-y-auto overflow-x-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-2.5">
        <h3 className="m-0 pb-2.5 border-b-2 border-gray-300 text-gray-800">Game Info</h3>
        <div className="p-2 bg-white rounded text-sm">
          <strong>Variant:</strong> {gameState.variant}
        </div>
        <div className="p-2 bg-white rounded text-sm">
          <strong>Current Player:</strong>{' '}
          <span className={`font-bold ${gameState.board.current_player === 'black' ? 'text-white bg-black px-1.5 py-0.5 rounded' : 'text-black'}`}>
            {gameState.board.current_player || 'None'}
          </span>
        </div>
        {gameState.board.dice && (
          <div className="p-2 bg-white rounded text-sm flex items-center gap-2.5">
            <strong>Dice:</strong>
            <div className="flex gap-1.5">
              <span className="w-10 h-10 bg-white border-2 border-gray-800 rounded-lg flex items-center justify-center text-xl font-bold">{gameState.board.dice[0]}</span>
              <span className="w-10 h-10 bg-white border-2 border-gray-800 rounded-lg flex items-center justify-center text-xl font-bold">{gameState.board.dice[1]}</span>
            </div>
          </div>
        )}
        {gameState.board.game_over && (
          <div className="p-2 bg-green-500 text-white font-bold text-center rounded">
            <strong>Winner: {gameState.board.winner}</strong>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h3 className="m-0 pb-2.5 border-b-2 border-gray-300 text-gray-800">Actions</h3>
        {gameState.can_roll && !gameState.board.game_over && (
          <button className="py-2.5 px-5 border-none rounded bg-green-500 text-white text-sm font-bold cursor-pointer transition-all hover:bg-[#45a049]" onClick={onRollDice}>
            Roll Dice
          </button>
        )}
        <button className="py-2.5 px-5 border-none rounded bg-blue-500 text-white text-sm font-bold cursor-pointer transition-all hover:bg-[#0b7dda]" onClick={onNewGame}>
          New Game
        </button>
      </div>

      {gameState.legal_moves.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className="m-0 pb-2.5 border-b-2 border-gray-300 text-gray-800">Legal Moves ({gameState.legal_moves.length})</h3>
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {gameState.legal_moves.slice(0, 10).map((move, idx) => (
              <button
                key={idx}
                className={`p-2 bg-white border border-gray-300 rounded cursor-pointer text-left text-xs transition-all ${selectedMove === move ? 'bg-blue-500 text-white border-blue-700' : 'hover:bg-blue-50 hover:border-blue-500'}`}
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
              <div className="text-center text-gray-600 text-xs py-1.5">... and {gameState.legal_moves.length - 10} more</div>
            )}
          </div>
          {selectedMove && (
            <button
              className="py-2.5 px-5 border-none rounded bg-green-500 text-white text-sm font-bold cursor-pointer transition-all hover:bg-[#45a049]"
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

      <div className="flex flex-col gap-2.5">
        <h3 className="m-0 pb-2.5 border-b-2 border-gray-300 text-gray-800">Manual Move</h3>
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            placeholder="From"
            value={fromPoint}
            onChange={(e) => setFromPoint(e.target.value)}
            className="flex-1 py-2 px-2 border border-gray-300 rounded text-sm"
          />
          <span>→</span>
          <input
            type="number"
            placeholder="To"
            value={toPoint}
            onChange={(e) => setToPoint(e.target.value)}
            className="flex-1 py-2 px-2 border border-gray-300 rounded text-sm"
          />
          <button className="py-2.5 px-5 border-none rounded bg-green-500 text-white text-sm font-bold cursor-pointer transition-all hover:bg-[#45a049]" onClick={handleManualMove}>
            Move
          </button>
        </div>
        {gameState.board.bar_white > 0 || gameState.board.bar_black > 0 ? (
          <div className="flex gap-1.5 mt-1.5">
            <input
              type="number"
              placeholder="Enter to point"
              className="flex-1 py-2 px-2 border border-gray-300 rounded text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEnterMove((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="py-1.25 px-2.5 text-xs py-2.5 px-5 border-none rounded bg-green-500 text-white text-sm font-bold cursor-pointer transition-all hover:bg-[#45a049]"
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
          <div className="flex gap-1.5 mt-1.5">
            <input
              type="number"
              placeholder="Bear off from"
              className="flex-1 py-2 px-2 border border-gray-300 rounded text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleBearOff((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="py-1.25 px-2.5 text-xs py-2.5 px-5 border-none rounded bg-green-500 text-white text-sm font-bold cursor-pointer transition-all hover:bg-[#45a049]"
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
