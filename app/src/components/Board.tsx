import React from 'react';
import type { BoardState, LegalMove } from '../api';
import './Board.css';

interface BoardProps {
  board: BoardState;
  onPointClick?: (pointNumber: number) => void;
  selectedPoint?: number | null;
  validMoves?: LegalMove[];
  currentPlayer?: string | null;
}

const Board: React.FC<BoardProps> = ({ board, onPointClick, selectedPoint, validMoves = [], currentPlayer }) => {
  const MAX_VISIBLE_PIECES = 5;

  const renderPoint = (pointNumber: number, isTop: boolean) => {
    const point = board.points.find(p => p.number === pointNumber);
    if (!point) return null;

    const whitePieces = point.white_pieces;
    const blackPieces = point.black_pieces;
    const isSelected = selectedPoint === pointNumber;
    
    // Check if this point is a valid destination
    const validMove = validMoves.find((m) => {
      if (selectedPoint === 0) {
        return m.move_type === 'enter' && m.to_point === pointNumber;
      }
      return m.to_point === pointNumber && m.from_point === selectedPoint;
    });
    const isValidDestination = !!validMove;
    
    // Check if this is a combined move (uses sum of both dice)
    const isCombinedMove = isValidDestination &&
      board.dice &&
      validMove &&
      validMove.move_type === 'normal' &&
      validMove.die_value === board.dice[0] + board.dice[1] &&
      board.dice[0] !== board.dice[1]; // Not doubles

    return (
      <div
        key={pointNumber}
        className={`board-point ${isTop ? 'top' : 'bottom'} ${isSelected ? 'selected' : ''} ${isValidDestination ? (isCombinedMove ? 'valid-move-combined' : 'valid-move') : ''}`}
        onClick={() => onPointClick?.(pointNumber)}
      >
        <div className="point-number">{pointNumber}</div>
        <div className={`point-pieces ${isTop ? 'top-pieces' : 'bottom-pieces'}`}>
          {whitePieces > 0 && (
            <div className="pieces-stack white-stack">
              {Array.from({ length: Math.min(whitePieces, MAX_VISIBLE_PIECES) }).map((_, idx) => (
                <div key={idx} className="piece white">
                  {idx === Math.min(whitePieces, MAX_VISIBLE_PIECES) - 1 && whitePieces > MAX_VISIBLE_PIECES && (
                    <span className="piece-count">{whitePieces}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {blackPieces > 0 && (
            <div className="pieces-stack black-stack">
              {Array.from({ length: Math.min(blackPieces, MAX_VISIBLE_PIECES) }).map((_, idx) => (
                <div key={idx} className="piece black">
                  {idx === Math.min(blackPieces, MAX_VISIBLE_PIECES) - 1 && blackPieces > MAX_VISIBLE_PIECES && (
                    <span className="piece-count">{blackPieces}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="board-container">
      <div className="board">
        <div className="board-main">
          {/* Left side */}
          <div className="board-side left-side">
            {/* Top row (points 13-18, left to right) */}
            <div className="board-row top-row">
              {Array.from({ length: 6 }, (_, i) => 13 + i).map(num => renderPoint(num, true))}
            </div>
            
            {/* Bottom row (points 12-7, left to right) */}
            <div className="board-row bottom-row">
              {Array.from({ length: 6 }, (_, i) => 12 - i).map(num => renderPoint(num, false))}
            </div>
          </div>
          
          {/* Vertical bar in the middle */}
          <div
            className={`board-bar-vertical ${selectedPoint === 0 ? 'selected' : ''} ${
              (currentPlayer === 'white' && board.bar_white > 0) || 
              (currentPlayer === 'black' && board.bar_black > 0) 
                ? 'clickable' : 'not-clickable'
            }`}
            onClick={() => {
              const hasBarCheckers = 
                (currentPlayer === 'white' && board.bar_white > 0) ||
                (currentPlayer === 'black' && board.bar_black > 0);
              if (hasBarCheckers) {
                onPointClick?.(0);
              }
            }}
            role="button"
            tabIndex={
              (currentPlayer === 'white' && board.bar_white > 0) || 
              (currentPlayer === 'black' && board.bar_black > 0) 
                ? 0 : -1
            }
            onKeyDown={(e) => {
              const hasBarCheckers = 
                (currentPlayer === 'white' && board.bar_white > 0) ||
                (currentPlayer === 'black' && board.bar_black > 0);
              if (hasBarCheckers && (e.key === 'Enter' || e.key === ' ')) {
                onPointClick?.(0);
              }
            }}
          >
            <div className="bar-section-vertical">
              <div className="bar-label">Bar</div>
              <div className="bar-pieces-vertical">
                {board.bar_white > 0 && <div className="bar-piece white">{board.bar_white}</div>}
                {board.bar_black > 0 && <div className="bar-piece black">{board.bar_black}</div>}
              </div>
            </div>
          </div>
          
          {/* Right side */}
          <div className="board-side right-side">
            {/* Top row (points 19-24, left to right) */}
            <div className="board-row top-row">
              {Array.from({ length: 6 }, (_, i) => 19 + i).map(num => renderPoint(num, true))}
            </div>
            
            {/* Bottom row (points 6-1, left to right, rightmost is 1) */}
            <div className="board-row bottom-row">
              {Array.from({ length: 6 }, (_, i) => 6 - i).map(num => renderPoint(num, false))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;

