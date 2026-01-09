import React, { useEffect } from 'react';

interface FirstPlayerResultModalProps {
  isOpen: boolean;
  firstPlayer: 'white' | 'black';
  onClose: () => void;
}

const FirstPlayerResultModal: React.FC<FirstPlayerResultModalProps> = ({ 
  isOpen, 
  firstPlayer, 
  onClose 
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const playerColor = firstPlayer === 'white' ? '#ffffff' : '#000000';
  const playerName = firstPlayer === 'white' ? 'WHITE' : 'BLACK';
  const bgColor = firstPlayer === 'white' 
    ? 'linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%)' 
    : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
  const textColor = firstPlayer === 'white' ? '#000000' : '#ffffff';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-sm">
      <div 
        className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-[20px] py-[50px] px-[60px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center min-w-[400px] max-w-[500px] animate-[modalSlideIn_0.3s_ease-out]"
        style={{ background: bgColor }}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="text-[64px] animate-[bounce_0.6s_ease-in-out]">🎲</div>
          <h2 className="m-0 text-[36px] font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)]" style={{ color: textColor }}>First Player</h2>
          <div 
            className="py-4 px-10 rounded-[50px] text-[32px] font-bold font-['Righteous','Bebas_Neue',cursive] uppercase shadow-[0_6px_20px_rgba(0,0,0,0.3)] animate-[scaleIn_0.5s_ease-out]"
            style={{ 
              backgroundColor: playerColor,
              color: firstPlayer === 'white' ? '#000000' : '#ffffff'
            }}
          >
            {playerName}
          </div>
          <p className="text-xl m-0 font-medium" style={{ color: textColor }}>
            {playerName} goes first!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstPlayerResultModal;
