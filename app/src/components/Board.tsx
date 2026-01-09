import React, { useEffect, useRef, useState } from 'react';
import type { BoardState, LegalMove } from '../api';
import './Board.css';

interface BoardProps {
  board: BoardState;
  onPointClick?: (pointNumber: number) => void;
  selectedPoint?: number | null;
  validMoves?: LegalMove[];
  currentPlayer?: string | null;
  previousBoard?: BoardState | null;
  lastMove?: { from_point: number; to_point: number; move_type: string } | null;
}

const Board: React.FC<BoardProps> = ({ 
  board, 
  onPointClick, 
  selectedPoint, 
  validMoves = [], 
  currentPlayer,
  previousBoard,
  lastMove
}) => {
  const MAX_VISIBLE_PIECES = 5;
  const boardRef = useRef<HTMLDivElement>(null);
  const movingCheckerRef = useRef<HTMLDivElement>(null);
  const [animatingMove, setAnimatingMove] = useState<{
    from: number;
    to: number;
    color: 'white' | 'black';
  } | null>(null);

  useEffect(() => {
    if (lastMove && previousBoard && boardRef.current) {
      const fromPoint = previousBoard.points.find(p => p.number === lastMove.from_point);
      const toPoint = board.points.find(p => p.number === lastMove.to_point);
      
      if (fromPoint && toPoint) {
        const color = fromPoint.white_pieces > 0 ? 'white' : 'black';
        setAnimatingMove({
          from: lastMove.from_point,
          to: lastMove.to_point,
          color
        });

        const timer = setTimeout(() => {
          setAnimatingMove(null);
        }, 800);

        return () => clearTimeout(timer);
      }
    }
  }, [lastMove, previousBoard]);

  const renderMovingChecker = () => {
    if (!animatingMove || !boardRef.current) return null;
    
    const fromPointEl = boardRef.current.querySelector(`[data-point="${animatingMove.from}"]`);
    const toPointEl = boardRef.current.querySelector(`[data-point="${animatingMove.to}"]`);
    
    if (!fromPointEl || !toPointEl) return null;
    
    const fromRect = fromPointEl.getBoundingClientRect();
    const toRect = toPointEl.getBoundingClientRect();
    const boardRect = boardRef.current.getBoundingClientRect();
    
    const fromX = fromRect.left + fromRect.width / 2 - boardRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - boardRect.top;
    
    const isTopTriangle = toPointEl.classList.contains('top');
    const toX = toRect.left + toRect.width / 2 - boardRect.left;
    
    let toY: number;
    if (isTopTriangle) {
      toY = toRect.top + toRect.height * 0.15 - boardRect.top;
    } else {
      toY = toRect.top + toRect.height * 0.85 - boardRect.top;
    }
    
    return (
      <div 
        ref={movingCheckerRef}
        className={`moving-checker ${animatingMove.color}`}
        style={{
          '--from-x': `${fromX}px`,
          '--from-y': `${fromY}px`,
          '--to-x': `${toX}px`,
          '--to-y': `${toY}px`,
        } as React.CSSProperties}
      />
    );
  };

  const renderBorneOffArea = (color: 'white' | 'black', side: 'left' | 'right') => {
    const count = color === 'white' ? board.borne_off_white : board.borne_off_black;
    const prevCount = previousBoard 
      ? (color === 'white' ? previousBoard.borne_off_white : previousBoard.borne_off_black)
      : 0;
    const isAnimating = count > prevCount;
    
    return (
      <div className={`borne-off-area ${color}-borne-off ${side}-side`}>
        <div className="borne-off-label">{color === 'white' ? 'WHITE' : 'BLACK'}</div>
        <div className="borne-off-slot">
          {Array.from({ length: Math.min(count, 15) }).map((_, idx) => (
            <div 
              key={idx} 
              className={`borne-off-piece ${color} ${isAnimating && idx >= prevCount ? 'animate-in' : ''}`}
              style={{ 
                '--index': idx,
                animationDelay: isAnimating && idx >= prevCount ? `${(idx - prevCount) * 0.1}s` : '0s'
              } as React.CSSProperties}
            />
          ))}
          {count > 15 && (
            <div className="borne-off-count-badge">{count}</div>
          )}
        </div>
      </div>
    );
  };

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

    const isAnimatingFrom = animatingMove && animatingMove.from === pointNumber;
    const isAnimatingTo = animatingMove && animatingMove.to === pointNumber;

    return (
      <div
        key={pointNumber}
        data-point={pointNumber}
        className={`board-point ${isTop ? 'top' : 'bottom'} ${isSelected ? 'selected' : ''} ${isValidDestination ? (isCombinedMove ? 'valid-move-combined' : 'valid-move') : ''}`}
        onClick={() => onPointClick?.(pointNumber)}
      >
        <div className="point-number">{pointNumber}</div>
        <div className={`point-pieces ${isTop ? 'top-pieces' : 'bottom-pieces'}`}>
          {whitePieces > 0 && (
            <div className="pieces-stack white-stack">
              {Array.from({ length: Math.min(whitePieces, MAX_VISIBLE_PIECES) }).map((_, idx) => {
                const shouldHide = isAnimatingFrom && idx === Math.min(whitePieces, MAX_VISIBLE_PIECES) - 1;
                return (
                  <div 
                    key={idx} 
                    className="piece white"
                    style={{ opacity: shouldHide ? 0 : 1 }}
                  >
                    {idx === Math.min(whitePieces, MAX_VISIBLE_PIECES) - 1 && whitePieces > MAX_VISIBLE_PIECES && (
                      <span className="piece-count">{whitePieces}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {blackPieces > 0 && (
            <div className="pieces-stack black-stack">
              {Array.from({ length: Math.min(blackPieces, MAX_VISIBLE_PIECES) }).map((_, idx) => {
                const shouldHide = isAnimatingFrom && idx === Math.min(blackPieces, MAX_VISIBLE_PIECES) - 1;
                return (
                  <div 
                    key={idx} 
                    className="piece black"
                    style={{ opacity: shouldHide ? 0 : 1 }}
                  >
                    {idx === Math.min(blackPieces, MAX_VISIBLE_PIECES) - 1 && blackPieces > MAX_VISIBLE_PIECES && (
                      <span className="piece-count">{blackPieces}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="board-container">
      <div className="board" ref={boardRef}>
        {renderMovingChecker()}
        <div className="board-wrapper">
          {renderBorneOffArea('white', 'left')}
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
          {renderBorneOffArea('black', 'right')}
        </div>
      </div>
    </div>
  );
};

export default Board;

