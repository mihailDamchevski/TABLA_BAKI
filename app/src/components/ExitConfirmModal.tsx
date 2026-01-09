import React from 'react';
import './ExitConfirmModal.css';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="exit-confirm-modal-backdrop" onClick={onCancel}>
      <div className="exit-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="exit-confirm-modal-header">
          <h2>🚪 Exit to Menu?</h2>
        </div>
        
        <div className="exit-confirm-modal-content">
          <p>Are you sure you want to exit the current game and return to the menu?</p>
          <p className="exit-confirm-warning">⚠️ Your current game progress will be lost.</p>
        </div>

        <div className="exit-confirm-modal-footer">
          <button className="exit-confirm-button exit-confirm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="exit-confirm-button exit-confirm-confirm" onClick={onConfirm}>
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
