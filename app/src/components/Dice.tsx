import React, { useState, useEffect } from 'react';
import './Dice.css';

interface DiceProps {
  dice: [number, number] | null;
  onRoll: () => void;
  disabled?: boolean;
}

const Dice: React.FC<DiceProps> = ({ dice, onRoll, disabled = false }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValues, setDisplayValues] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (dice) {
      setIsRolling(true);
      setDisplayValues(null);
      
      // Shake animation duration
      const shakeDuration = 1000;
      
      // Show random numbers during shake
      const interval = setInterval(() => {
        setDisplayValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
      }, 100);
      
      // After shake, show actual dice values
      setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
        setDisplayValues(dice);
      }, shakeDuration);
    } else {
      setDisplayValues(null);
      setIsRolling(false);
    }
  }, [dice]);

  const handleClick = () => {
    if (!disabled && !isRolling) {
      onRoll();
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

