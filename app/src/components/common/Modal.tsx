// Reusable Modal component

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] animate-[fadeIn_0.2s_ease-out] ${className}`} onClick={onClose}>
      <div className={`bg-white rounded-xl p-6 max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.2)] animate-[slideUp_0.3s_ease-out] ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="mb-4">
            <h2 className="m-0 text-2xl font-bold">{title}</h2>
          </div>
        )}
        <div className="text-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
