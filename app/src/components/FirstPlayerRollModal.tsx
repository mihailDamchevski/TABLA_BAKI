import React, { useState, useEffect, useCallback } from 'react';

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
          className={`w-[18px] h-[18px] rounded-full bg-black transition-opacity absolute ${positions.includes(i) ? 'opacity-100' : 'opacity-0'}`}
          style={{
            gridColumn: `${(i % 3) + 1}`,
            gridRow: `${Math.floor(i / 3) + 1}`
          }}
        ></span>
      );
    }
    return dots;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-[20px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center min-w-[500px] max-w-[600px] animate-[modalSlideIn_0.3s_ease-out]">
        <h2 className="text-white m-0 mb-2.5 text-[32px] font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">Determining First Player</h2>
        <p className="text-[#ecf0f1] m-0 mb-7.5 text-lg">Rolling dice...</p>
        
        <div className="flex items-center justify-center gap-10 my-7.5">
          <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-bold text-white uppercase font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">White</div>
            <div className={`w-[120px] h-[120px] bg-white rounded-[15px] flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.3)] cursor-pointer transition-transform relative ${isRolling ? 'animate-[shake_0.1s_infinite]' : ''}`}>
              <div className="w-full h-full flex items-center justify-center relative">
                {whiteDie !== null ? (
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 p-3 w-full h-full absolute top-0 left-0">
                    {renderDots(whiteDie)}
                  </div>
                ) : (
                  <div className="text-5xl text-[#95a5a6] font-bold flex items-center justify-center w-full h-full absolute top-0 left-0">?</div>
                )}
              </div>
            </div>
            {whiteDie !== null && !isRolling && (
              <div className="text-[28px] font-bold text-white font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">{whiteDie}</div>
            )}
          </div>
          
          <div className="text-[32px] font-bold text-[#f39c12] font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">VS</div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-bold text-white uppercase font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">Black</div>
            <div className={`w-[120px] h-[120px] bg-white rounded-[15px] flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.3)] cursor-pointer transition-transform relative ${isRolling ? 'animate-[shake_0.1s_infinite]' : ''}`}>
              <div className="w-full h-full flex items-center justify-center relative">
                {blackDie !== null ? (
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 p-3 w-full h-full absolute top-0 left-0">
                    {renderDots(blackDie)}
                  </div>
                ) : (
                  <div className="text-5xl text-[#95a5a6] font-bold flex items-center justify-center w-full h-full absolute top-0 left-0">?</div>
                )}
              </div>
            </div>
            {blackDie !== null && !isRolling && (
              <div className="text-[28px] font-bold text-white font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">{blackDie}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstPlayerRollModal;
