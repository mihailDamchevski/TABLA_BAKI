import React from 'react';
import type { BoardState, LegalMove } from '../api';
import './Board.css';

interface BoardProps {
  board: BoardState;
  onPointClick?: (pointNumber: number) => void;
  selectedPoint?: number | null;
  validMoves?: LegalMove[];
}

const Board: React.FC<BoardProps> = ({ board, onPointClick, selectedPoint, validMoves = [] }) => {
  const renderPoint = (pointNumber: number, isTop: boolean) => {
    const point = board.points.find(p => p.number === pointNumber);
    if (!point) return null;

    const whitePieces = point.white_pieces;
    const blackPieces = point.black_pieces;
    const isSelected = selectedPoint === pointNumber;
    
    // Check if this point is a valid destination
    const isValidDestination = validMoves.some(
      (m) => m.to_point === pointNumber && m.from_point === selectedPoint
    );

    return (
      <div
        key={pointNumber}
        className={`board-point ${isTop ? 'top' : 'bottom'} ${isSelected ? 'selected' : ''} ${isValidDestination ? 'valid-move' : ''}`}
        onClick={() => onPointClick?.(pointNumber)}
      >
        <div className="point-number">{pointNumber}</div>
        <div className={`point-pieces ${isTop ? 'top-pieces' : 'bottom-pieces'}`}>
          {whitePieces > 0 && (
            <div className="pieces-stack white-stack">
              {Array.from({ length: Math.min(whitePieces, 15) }).map((_, idx) => (
                <div key={idx} className="piece white">
                  {idx === Math.min(whitePieces, 15) - 1 && whitePieces > 15 && (
                    <span className="piece-count">{whitePieces}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {blackPieces > 0 && (
            <div className="pieces-stack black-stack">
              {Array.from({ length: Math.min(blackPieces, 15) }).map((_, idx) => (
                <div key={idx} className="piece black">
                  {idx === Math.min(blackPieces, 15) - 1 && blackPieces > 15 && (
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
      <div className="board-info">
        <div className="bar-info">
          <div>Bar - White: {board.bar_white}, Black: {board.bar_black}</div>
          <div>Borne Off - White: {board.borne_off_white}, Black: {board.borne_off_black}</div>
        </div>
      </div>
      
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
          <div className="board-bar-vertical">
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

