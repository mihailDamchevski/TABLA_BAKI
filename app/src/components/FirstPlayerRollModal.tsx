import React, { useState, useEffect, useCallback } from 'react';
import './FirstPlayerRollModal.css';

interface FirstPlayerRollModalProps {
  isOpen: boolean;
  onComplete: (firstPlayer: 'white' | 'black') => void;
}

const FirstPlayerRollModal: React.FC<FirstPlayerRollModalProps> = ({ isOpen, onComplete }) => {
  const [whiteDie, setWhiteDie] = useState<number | null>(null);
  const [blackDie, setBlackDie] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollDie = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  const startRoll = useCallback(() => {
    setIsRolling(true);
    setWhiteDie(rollDie());
    setBlackDie(rollDie());

    // Animate rolling for 2 seconds
    const rollInterval = setInterval(() => {
      setWhiteDie(rollDie());
      setBlackDie(rollDie());
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      
      // Final roll
      const finalWhite = rollDie();
      const finalBlack = rollDie();
      
      setWhiteDie(finalWhite);
      setBlackDie(finalBlack);
      setIsRolling(false);

      // Determine winner after a short delay
      setTimeout(() => {
        let winner: 'white' | 'black';
        
        if (finalWhite > finalBlack) {
          winner = 'white';
        } else if (finalBlack > finalWhite) {
          winner = 'black';
        } else {
          // Tie - roll again
          setTimeout(() => {
            startRoll();
          }, 1000);
          return;
        }
        
        onComplete(winner);
      }, 500);
    }, 2000);
  }, [onComplete]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setWhiteDie(null);
      setBlackDie(null);
      setIsRolling(false);
      // Start rolling after a brief delay
      const timer = setTimeout(() => {
        startRoll();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset when modal closes
      setWhiteDie(null);
      setBlackDie(null);
      setIsRolling(false);
    }
  }, [isOpen, startRoll]);

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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="first-player-roll-modal">
        <h2>Determining First Player</h2>
        <p className="modal-subtitle">Rolling dice...</p>
        
        <div className="dice-roll-container">
          <div className="player-roll">
            <div className="player-label">White</div>
            <div className={`die-large ${isRolling ? 'rolling' : ''}`}>
              <div className="die-face">
                {whiteDie !== null ? (
                  <div className={`dots dots-${whiteDie}`}>
                    {renderDots(whiteDie)}
                  </div>
                ) : (
                  <div className="die-placeholder">?</div>
                )}
              </div>
            </div>
            {whiteDie !== null && !isRolling && (
              <div className="die-value">{whiteDie}</div>
            )}
          </div>
          
          <div className="vs-divider">VS</div>
          
          <div className="player-roll">
            <div className="player-label">Black</div>
            <div className={`die-large ${isRolling ? 'rolling' : ''}`}>
              <div className="die-face">
                {blackDie !== null ? (
                  <div className={`dots dots-${blackDie}`}>
                    {renderDots(blackDie)}
                  </div>
                ) : (
                  <div className="die-placeholder">?</div>
                )}
              </div>
            </div>
            {blackDie !== null && !isRolling && (
              <div className="die-value">{blackDie}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstPlayerRollModal;

