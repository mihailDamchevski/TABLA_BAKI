import React, { useEffect, useRef, useState } from 'react';

interface DiceProps {
  dice: [number, number] | null;
  onRoll: () => void | Promise<void>;
  disabled?: boolean;
  currentPlayer?: 'white' | 'black' | null;
}

const Dice: React.FC<DiceProps> = ({ dice, onRoll, disabled = false, currentPlayer = null }) => {
  const isWhiteTurn = currentPlayer === 'white';
  const [isRolling, setIsRolling] = useState(false);
  const [displayValues, setDisplayValues] = useState<[number, number] | null>(null);
  const rollRequestedRef = useRef(false);
  const minRollEndAtRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const previousDiceRef = useRef<[number, number] | null>(null);

  // Use derived state when not rolling - compute from props directly
  const effectiveDisplayValues = isRolling ? displayValues : dice;

  // Handle dice prop changes only when we're expecting them (during roll)
  useEffect(() => {
    // Only sync when we're rolling and dice prop actually changed
    if (isRolling && rollRequestedRef.current && dice && dice !== previousDiceRef.current) {
      const remaining = Math.max(0, minRollEndAtRef.current - Date.now());
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        timeoutRef.current = null;
        rollRequestedRef.current = false;
        setIsRolling(false);
        setDisplayValues(null); // Clear animation state, will use prop directly
      }, remaining);
    }
    
    // Track previous dice value
    previousDiceRef.current = dice;
  }, [dice, isRolling]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (!disabled && !isRolling) {
      rollRequestedRef.current = true;
      minRollEndAtRef.current = Date.now() + 1000;
      setIsRolling(true);

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setDisplayValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
      }, 100);

      // Fallback: if the roll request fails (or dice never arrives), stop shaking after the minimum duration.
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (!rollRequestedRef.current) return;
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        timeoutRef.current = null;
        rollRequestedRef.current = false;
        setIsRolling(false);
        setDisplayValues(null); // Clear animation state
      }, Math.max(0, minRollEndAtRef.current - Date.now()) + 50);

      try {
        await onRoll();
      } catch {
        // The fallback timeout above will clean up the animation.
      }
    }
  };

  const renderDots = (value: number) => {
    const dots = [];
    const patterns: { [key: number]: number[] } = {
      1: [4], // center
      2: [0, 8], // top-left, bottom-right
      3: [0, 4, 8], // top-left, center, bottom-right
      4: [0, 2, 6, 8], // corners
      5: [0, 2, 4, 6, 8], // corners + center
      6: [0, 2, 3, 5, 6, 8], // two columns of three
    };
    
    const positions = patterns[value] || [];
    // Light dots for dark background, dark dots for light background
    const dotColor = isWhiteTurn ? 'bg-[#5c4a37]' : 'bg-white';
    const dotShadow = isWhiteTurn 
      ? 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]' 
      : 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_0_2px_rgba(255,255,255,0.3)]';
    
    for (let i = 0; i < 9; i++) {
      dots.push(
        <span 
          key={i} 
          className={`w-3 h-3 rounded-full transition-colors duration-700 ease-in-out ${positions.includes(i) ? `${dotColor} ${dotShadow}` : 'bg-transparent'}`}
        ></span>
      );
    }
    return dots;
  };

  const die1Value = effectiveDisplayValues ? effectiveDisplayValues[0] : null;
  const die2Value = effectiveDisplayValues ? effectiveDisplayValues[1] : null;

  const diceBg = isWhiteTurn ? 'bg-[#f0e6d8]' : 'bg-[#1a2a1a]';
  const diceBorder = isWhiteTurn ? 'border-[#d4c4b0]' : 'border-[#0a1a0a]';
  const diceShadow = isWhiteTurn 
    ? 'shadow-[0_4px_8px_rgba(0,0,0,0.2)]' 
    : 'shadow-[0_4px_8px_rgba(0,0,0,0.5)]';
  const diceHoverShadow = isWhiteTurn
    ? 'hover:shadow-[0_6px_12px_rgba(0,0,0,0.3)]'
    : 'hover:shadow-[0_6px_12px_rgba(0,0,0,0.6)]';
  const questionMarkColor = isWhiteTurn ? 'text-[#8B4513]' : 'text-gray-400';
  const textColor = isWhiteTurn ? 'text-[#5c4a37]' : 'text-white';

  return (
    <div className="flex flex-col items-center gap-5 p-5">
      <div 
        className={`w-[100px] h-[100px] ${diceBg} border-[3px] ${diceBorder} rounded-xl flex items-center justify-center cursor-pointer transition-[background-color,border-color,box-shadow] duration-700 ease-in-out ${diceShadow} relative ${isRolling ? 'animate-[shake_0.1s_infinite] cursor-wait' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${!disabled && !isRolling ? `hover:scale-110 ${diceHoverShadow}` : ''}`}
        onClick={handleClick}
      >
        <div className="w-full h-full flex items-center justify-center relative">
          {die1Value !== null ? (
            <div className="grid grid-cols-3 grid-rows-3 w-20 h-20 gap-1 p-2">
              {renderDots(die1Value)}
            </div>
          ) : (
            <div className={`text-5xl ${questionMarkColor} font-bold transition-colors duration-700 ease-in-out`}>?</div>
          )}
        </div>
      </div>
      
      <div 
        className={`w-[100px] h-[100px] ${diceBg} border-[3px] ${diceBorder} rounded-xl flex items-center justify-center cursor-pointer transition-[background-color,border-color,box-shadow] duration-700 ease-in-out ${diceShadow} relative ${isRolling ? 'animate-[shake_0.1s_infinite] cursor-wait' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${!disabled && !isRolling ? `hover:scale-110 ${diceHoverShadow}` : ''}`}
        onClick={handleClick}
      >
        <div className="w-full h-full flex items-center justify-center relative">
          {die2Value !== null ? (
            <div className="grid grid-cols-3 grid-rows-3 w-20 h-20 gap-1 p-2">
              {renderDots(die2Value)}
            </div>
          ) : (
            <div className={`text-5xl ${questionMarkColor} font-bold transition-colors duration-700 ease-in-out`}>?</div>
          )}
        </div>
      </div>
      
      {!dice && !disabled && (
        <div className={`${textColor} text-lg font-bold mt-2.5 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors duration-700 ease-in-out`}>Click dice to roll</div>
      )}
    </div>
  );
};

export default Dice;
