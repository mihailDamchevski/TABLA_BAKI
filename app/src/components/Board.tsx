import React, { useEffect, useRef, useState } from 'react';
import type { BoardState, LegalMove } from '../types/game';

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
        className={`absolute w-[50px] h-[50px] rounded-full z-[10000] pointer-events-none ${animatingMove.color === 'white' ? 'bg-gradient-to-br from-white via-[#F5F5F5] to-[#E8E8E8] border-[3px] border-[#D0D0D0] shadow-[0_4px_8px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)]' : 'bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] border-[3px] border-[#2a2a2a] shadow-[0_4px_8px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5)]'}`}
        style={{
          left: 'var(--from-x)',
          top: 'var(--from-y)',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
          animation: 'checker-slide 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
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
      <div className={`w-[60px] min-w-[60px] flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-b from-[#5C3A21] via-[#654321] to-[#5C3A21] border-l-[3px] border-r-[3px] border-[#3D2416] shadow-[inset_2px_0_6px_rgba(0,0,0,0.4),inset_-2px_0_6px_rgba(0,0,0,0.4)] relative z-0 ${side === 'left' ? 'border-r-[4px] rounded-l-xl' : 'border-l-[4px] rounded-r-xl'}`}>
        <div className="text-[10px] font-extrabold text-white/70 drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)] tracking-[1.5px] mb-2 font-['Righteous','Bebas_Neue',cursive] [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180">{color === 'white' ? 'WHITE' : 'BLACK'}</div>
        <div className="flex-1 flex flex-col items-center justify-start gap-[3px] w-full p-1 relative min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-sm">
          {Array.from({ length: Math.min(count, 15) }).map((_, idx) => (
            <div 
              key={idx} 
              className={`w-9 h-9 rounded-full flex-shrink-0 border-[2.5px] shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_3px_rgba(255,255,255,0.2)] relative ${color === 'white' ? 'bg-gradient-to-br from-white via-[#F5F5F5] to-[#E8E8E8] border-[#D0D0D0]' : 'bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] border-[#2a2a2a]'} ${isAnimating && idx >= prevCount ? 'animate-[checker-drop-in_0.4s_ease-out]' : ''}`}
              style={{ 
                '--index': idx,
                animationDelay: isAnimating && idx >= prevCount ? `${(idx - prevCount) * 0.1}s` : '0s'
              } as React.CSSProperties}
            />
          ))}
          {count > 15 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[rgba(255,215,0,0.9)] text-black text-[10px] font-extrabold py-0.5 px-1.5 rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] z-10">{count}</div>
          )}
        </div>
      </div>
    );
  };

  const renderPoint = (pointNumber: number, isTop: boolean) => {
    // During animation, use previousBoard for both from and to points to prevent showing new state
    const isAnimatingFrom = animatingMove && animatingMove.from === pointNumber;
    const isAnimatingTo = animatingMove && animatingMove.to === pointNumber;
    const usePreviousBoard = previousBoard && (isAnimatingFrom || isAnimatingTo);
    const sourceBoard = usePreviousBoard ? previousBoard : board;
    const point = sourceBoard.points.find(p => p.number === pointNumber);
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

    const pointClasses = `flex-1 flex flex-col cursor-pointer transition-all relative min-w-[40px] overflow-visible z-10 ${isTop ? 'flex-col-reverse' : ''}`;
    const triangleClasses = `absolute inset-0 ${isTop ? '[clip-path:polygon(50%_100%,0%_0%,100%_0%)]' : '[clip-path:polygon(50%_0%,0%_100%,100%_100%)]'} border-l-2 border-r-2 border-b border-[rgba(139,69,19,0.4)] z-[1] pointer-events-none transition-all ${
      isSelected 
        ? 'bg-gradient-to-br from-[#FFD700] via-[#FFC125] to-[#FF8C00] border-[3px] border-[#FF8C00] shadow-[0_0_20px_rgba(255,215,0,0.7),0_0_40px_rgba(255,140,0,0.4),inset_0_2px_6px_rgba(255,255,255,0.5),inset_0_-2px_6px_rgba(0,0,0,0.2)] animate-[selected-pulse_2s_ease-in-out_infinite]'
        : isValidDestination
        ? isCombinedMove
          ? 'bg-gradient-to-br from-[#64B5F6] via-[#42A5F5] to-[#1565C0] border-[3px] border-[#1565C0] shadow-[0_0_20px_rgba(33,150,243,0.7),0_0_40px_rgba(21,101,192,0.4),inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)] animate-[pulse-valid-combined_1.5s_ease-in-out_infinite]'
          : 'bg-gradient-to-br from-[#66BB6A] via-[#4CAF50] to-[#2E7D32] border-[3px] border-[#2E7D32] shadow-[0_0_20px_rgba(76,175,80,0.7),0_0_40px_rgba(46,125,50,0.4),inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)] animate-[pulse-valid_1.5s_ease-in-out_infinite]'
        : 'bg-gradient-to-br from-[#F5DEB3] via-[#E6D3A3] to-[#B8A082] hover:brightness-110 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.2),0_2px_8px_rgba(255,200,100,0.3)] hover:-translate-y-0.5'
    }`;

    return (
      <div
        key={pointNumber}
        data-point={pointNumber}
        className={pointClasses}
        onClick={() => onPointClick?.(pointNumber)}
      >
        <div className={triangleClasses}></div>
        <div className={`absolute left-1/2 -translate-x-1/2 text-[17px] font-extrabold font-['Righteous','Bebas_Neue',cursive] text-white drop-shadow-[2px_2px_4px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.8)] z-[15] tracking-[1.5px] bg-gradient-to-b from-white/20 to-white/5 py-0.5 px-1.5 rounded backdrop-blur-sm ${isTop ? 'top-1' : 'bottom-1'}`}>{pointNumber}</div>
        <div className={`flex-1 flex flex-col items-center p-1 gap-0.5 w-full z-[1000] relative translate-z-0 overflow-visible ${isTop ? 'justify-start pt-0' : 'justify-end pb-0 mb-0'}`}>
          {whitePieces > 0 && (
            <div className="flex flex-col items-center relative w-full gap-0.5 z-[1001] translate-z-0">
              {Array.from({ length: Math.min(whitePieces, MAX_VISIBLE_PIECES) }).map((_, idx) => {
                const shouldHide = isAnimatingFrom && idx === Math.min(whitePieces, MAX_VISIBLE_PIECES) - 1;
                return (
                  <div 
                    key={idx} 
                    className="w-[50px] h-[50px] rounded-full flex items-center justify-center relative flex-shrink-0 z-[1002] translate-z-0 transition-all hover:scale-105 bg-gradient-to-br from-white via-[#F5F5F5] to-[#E8E8E8] border-[3px] border-[#D0D0D0] shadow-[0_4px_8px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] before:content-[''] before:absolute before:top-[20%] before:left-[20%] before:w-[30%] before:h-[30%] before:rounded-full before:bg-white/60 before:blur-sm"
                    style={{ opacity: shouldHide ? 0 : 1 }}
                  >
                    {idx === Math.min(whitePieces, MAX_VISIBLE_PIECES) - 1 && whitePieces > MAX_VISIBLE_PIECES && (
                      <span className="absolute text-[10px] font-bold text-black drop-shadow-[1px_1px_2px_rgba(255,255,255,0.8)] z-[103]">{whitePieces}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {blackPieces > 0 && (
            <div className="flex flex-col items-center relative w-full gap-0.5 z-[1001] translate-z-0">
              {Array.from({ length: Math.min(blackPieces, MAX_VISIBLE_PIECES) }).map((_, idx) => {
                const shouldHide = isAnimatingFrom && idx === Math.min(blackPieces, MAX_VISIBLE_PIECES) - 1;
                return (
                  <div 
                    key={idx} 
                    className="w-[50px] h-[50px] rounded-full flex items-center justify-center relative flex-shrink-0 z-[1002] translate-z-0 transition-all hover:scale-105 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] border-[3px] border-[#2a2a2a] shadow-[0_4px_8px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5)] before:content-[''] before:absolute before:top-[20%] before:left-[20%] before:w-[30%] before:h-[30%] before:rounded-full before:bg-white/10 before:blur-sm"
                    style={{ opacity: shouldHide ? 0 : 1 }}
                  >
                    {idx === Math.min(blackPieces, MAX_VISIBLE_PIECES) - 1 && blackPieces > MAX_VISIBLE_PIECES && (
                      <span className="absolute text-[10px] font-bold text-white drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)] z-[103]">{blackPieces}</span>
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
    <div className="flex flex-col items-center p-2.5 w-full h-full justify-start overflow-hidden z-[1] relative">
      <div className="flex flex-col bg-[linear-gradient(135deg,#6B4423_0%,#8B5A3C_25%,#A67C52_50%,#8B5A3C_75%,#6B4423_100%),radial-gradient(circle_at_20%_50%,rgba(139,90,60,0.3)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,rgba(107,68,35,0.3)_0%,transparent_50%)] bg-[length:100%_100%,100%_100%,100%_100%] border-[6px] border-[#4A2C1A] border-l-[12px] border-r-[12px] border-[#3D2416] rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.1),inset_0_-2px_8px_rgba(0,0,0,0.3)] w-full h-full max-h-full flex-1 min-h-0 mx-auto z-0 relative before:content-[''] before:absolute before:inset-0 before:bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] before:rounded-2xl before:pointer-events-none before:z-[1]" ref={boardRef}>
        {renderMovingChecker()}
        <div className="flex flex-row h-full w-full gap-0 items-stretch relative z-[2]">
          {renderBorneOffArea('white', 'left')}
          <div className="flex flex-row h-full gap-0.5 z-0 relative flex-1">
          {/* Left side */}
          <div className="flex-1 flex flex-col gap-0.5 min-w-0 z-0 relative">
            {/* Top row (points 13-18, left to right) */}
            <div className="flex h-full gap-0.5 flex-1 relative min-h-0 z-0">
              {Array.from({ length: 6 }, (_, i) => 13 + i).map(num => renderPoint(num, true))}
            </div>
            
            {/* Bottom row (points 12-7, left to right) */}
            <div className="flex h-full gap-0.5 flex-1 relative min-h-0 z-0">
              {Array.from({ length: 6 }, (_, i) => 12 - i).map(num => renderPoint(num, false))}
            </div>
          </div>
          
          {/* Vertical bar in the middle */}
          <div
            className={`w-20 min-w-20 bg-gradient-to-b from-[#5C3A21] via-[#654321] to-[#5C3A21] border-l-[4px] border-r-[4px] border-[#3D2416] flex-shrink-0 shadow-[inset_3px_0_8px_rgba(0,0,0,0.4),inset_-3px_0_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-center justify-center z-0 relative cursor-pointer select-none transition-all ${
              selectedPoint === 0 
                ? 'outline-[4px] outline-[rgba(255,215,0,0.9)] outline-offset-[-4px] shadow-[inset_3px_0_8px_rgba(0,0,0,0.4),inset_-3px_0_8px_rgba(0,0,0,0.4),0_0_25px_rgba(255,215,0,0.6),0_0_50px_rgba(255,140,0,0.3)] animate-[bar-selected-pulse_2s_ease-in-out_infinite]'
                : (currentPlayer === 'white' && board.bar_white > 0) || (currentPlayer === 'black' && board.bar_black > 0)
                ? 'cursor-pointer hover:bg-gradient-to-b hover:from-[#6B4423] hover:via-[#754A2B] hover:to-[#6B4423] hover:shadow-[inset_3px_0_8px_rgba(0,0,0,0.4),inset_-3px_0_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.15),0_0_15px_rgba(255,200,100,0.3)] hover:scale-[1.02]'
                : 'cursor-default opacity-50 pointer-events-none'
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
            <div className="flex flex-col items-center gap-2.5 p-2.5 w-full">
              <div className="font-extrabold text-white/90 text-[13px] drop-shadow-[1px_1px_3px_rgba(0,0,0,0.8),0_0_6px_rgba(0,0,0,0.5)] tracking-[2px] font-['Righteous','Bebas_Neue',cursive]">Bar</div>
              <div className="flex flex-col gap-2.5 items-center w-full">
                {board.bar_white > 0 && <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs border-[2.5px] z-[100] relative transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)] hover:scale-110 bg-gradient-to-br from-white via-[#F5F5F5] to-[#E8E8E8] text-black border-[#D0D0D0] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_-1px_3px_rgba(0,0,0,0.1)]">{board.bar_white}</div>}
                {board.bar_black > 0 && <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs border-[2.5px] z-[100] relative transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)] hover:scale-110 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] text-white border-[#2a2a2a] shadow-[0_3px_6px_rgba(0,0,0,0.5),inset_0_1px_3px_rgba(255,255,255,0.15),inset_0_-1px_3px_rgba(0,0,0,0.5)]">{board.bar_black}</div>}
              </div>
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex-1 flex flex-col gap-0.5 min-w-0 z-0 relative">
            {/* Top row (points 19-24, left to right) */}
            <div className="flex h-full gap-0.5 flex-1 relative min-h-0 z-0">
              {Array.from({ length: 6 }, (_, i) => 19 + i).map(num => renderPoint(num, true))}
            </div>
            
            {/* Bottom row (points 6-1, left to right, rightmost is 1) */}
            <div className="flex h-full gap-0.5 flex-1 relative min-h-0 z-0">
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
