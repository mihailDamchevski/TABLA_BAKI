import React, { useEffect, useRef, useState } from 'react';
import './Dice.css';

interface DiceProps {
  dice: [number, number] | null;
  onRoll: () => void | Promise<void>;
  disabled?: boolean;
}

const Dice: React.FC<DiceProps> = ({ dice, onRoll, disabled = false }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValues, setDisplayValues] = useState<[number, number] | null>(null);
  const rollRequestedRef = useRef(false);
  const minRollEndAtRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Keep the UI in sync with dice updates WITHOUT automatically triggering animations.
    if (!isRolling) {
      setDisplayValues(dice ?? null);
      return;
    }

    // If a user initiated a roll and dice arrived, finish the rolling animation.
    if (rollRequestedRef.current && dice) {
      const remaining = Math.max(0, minRollEndAtRef.current - Date.now());
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        timeoutRef.current = null;
        rollRequestedRef.current = false;
        setIsRolling(false);
        setDisplayValues(dice);
      }, remaining);
    }
  }, [dice, isRolling]);

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
        setDisplayValues(dice ?? null);
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
    for (let i = 0; i < 9; i++) {
      dots.push(
        <span 
          key={i} 
          className={`dot ${positions.includes(i) ? 'visible' : ''}`}
        ></span>
      );
    }
    return dots;
  };

  const die1Value = displayValues ? displayValues[0] : null;
  const die2Value = displayValues ? displayValues[1] : null;

  return (
    <div className="dice-container">
      <div 
        className={`die ${isRolling ? 'rolling' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
      >
        <div className="die-face">
          {die1Value !== null ? (
            <div className={`dots dots-${die1Value}`}>
              {renderDots(die1Value)}
            </div>
          ) : (
            <div className="die-placeholder">?</div>
          )}
        </div>
      </div>
      
      <div 
        className={`die ${isRolling ? 'rolling' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
      >
        <div className="die-face">
          {die2Value !== null ? (
            <div className={`dots dots-${die2Value}`}>
              {renderDots(die2Value)}
            </div>
          ) : (
            <div className="die-placeholder">?</div>
          )}
        </div>
      </div>
      
      {!dice && !disabled && (
        <div className="dice-prompt">Click dice to roll</div>
      )}
    </div>
  );
};

export default Dice;

