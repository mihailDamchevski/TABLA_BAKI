import React from 'react';
import type { BoardState } from '../api';
import './Board.css';

interface BoardProps {
  board: BoardState;
  onPointClick?: (pointNumber: number) => void;
  selectedPoint?: number | null;
}

const Board: React.FC<BoardProps> = ({ board, onPointClick, selectedPoint }) => {
  const renderPoint = (pointNumber: number, isTop: boolean) => {
    const point = board.points.find(p => p.number === pointNumber);
    if (!point) return null;

    const whitePieces = point.white_pieces;
    const blackPieces = point.black_pieces;
    const isSelected = selectedPoint === pointNumber;

    return (
      <div
        key={pointNumber}
        className={`board-point ${isTop ? 'top' : 'bottom'} ${isSelected ? 'selected' : ''}`}
        onClick={() => onPointClick?.(pointNumber)}
      >
        <div className="point-number">{pointNumber}</div>
        <div className="point-pieces">
          {whitePieces > 0 && (
            <div className="pieces white" style={{ height: `${Math.min(whitePieces * 20, 100)}px` }}>
              {whitePieces}
            </div>
          )}
          {blackPieces > 0 && (
            <div className="pieces black" style={{ height: `${Math.min(blackPieces * 20, 100)}px` }}>
              {blackPieces}
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
        {/* Top row (points 13-24) */}
        <div className="board-row top-row">
          {Array.from({ length: 12 }, (_, i) => 24 - i).map(num => renderPoint(num, true))}
        </div>
        
        {/* Middle bar */}
        <div className="board-bar">
          <div className="bar-section">
            <div className="bar-label">Bar</div>
            <div className="bar-pieces">
              {board.bar_white > 0 && <div className="bar-piece white">{board.bar_white}</div>}
              {board.bar_black > 0 && <div className="bar-piece black">{board.bar_black}</div>}
          </div>
          </div>
        </div>
        
        {/* Bottom row (points 1-12) */}
        <div className="board-row bottom-row">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(num => renderPoint(num, false))}
        </div>
      </div>
    </div>
  );
};

export default Board;

