import React, { useEffect } from 'react';
import './FirstPlayerResultModal.css';

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
    <div className="modal-backdrop">
      <div 
        className="first-player-result-modal"
        style={{ background: bgColor }}
      >
        <div className="result-content">
          <div className="result-icon">🎲</div>
          <h2 style={{ color: textColor }}>First Player</h2>
          <div 
            className="player-badge"
            style={{ 
              backgroundColor: playerColor,
              color: firstPlayer === 'white' ? '#000000' : '#ffffff'
            }}
          >
            {playerName}
          </div>
          <p className="result-message" style={{ color: textColor }}>
            {playerName} goes first!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstPlayerResultModal;

