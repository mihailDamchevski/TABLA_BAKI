import React from 'react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[10000] animate-[fadeIn_0.2s_ease-out]" onClick={onCancel}>
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-[16px] mid:rounded-[18px] desktop:rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-w-[90%] mid:max-w-[400px] desktop:max-w-[450px] big:max-w-[520px] w-full flex flex-col animate-[slideUp_0.3s_ease-out] border-2 border-[rgba(255,107,107,0.3)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center items-center py-4 px-5 mid:py-5 mid:px-6 desktop:py-6 desktop:px-7 border-b border-white/10">
          <h2 className="m-0 text-lg mid:text-xl desktop:text-2xl big:text-3xl font-bold bg-gradient-to-br from-[#ff6b6b] to-[#ff8c8c] bg-clip-text text-transparent">🚪 Exit to Menu?</h2>
        </div>
        
        <div className="py-5 px-5 mid:py-6 mid:px-6 desktop:py-7 desktop:px-7 text-center">
          <p className="m-0 mb-3 mid:mb-4 text-white/90 leading-relaxed text-sm mid:text-base desktop:text-base big:text-lg">Are you sure you want to exit the current game and return to the menu?</p>
          <p className="text-[rgba(255,107,107,0.9)] font-semibold text-xs mid:text-sm desktop:text-sm big:text-base m-0">⚠️ Your current game progress will be lost.</p>
        </div>

        <div className="py-3 px-5 mid:py-4 mid:px-6 desktop:py-5 desktop:px-7 border-t border-white/10 flex justify-center gap-2 mid:gap-3">
          <button className="border-none py-2 px-5 mid:py-2.5 mid:px-6 desktop:py-3 desktop:px-8 big:py-3.5 big:px-10 rounded-[10px] text-xs mid:text-sm desktop:text-base big:text-lg font-semibold cursor-pointer transition-all min-w-[90px] mid:min-w-[100px] desktop:min-w-[120px] bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] active:translate-y-0" onClick={onCancel}>
            Cancel
          </button>
          <button className="border-none py-2 px-5 mid:py-2.5 mid:px-6 desktop:py-3 desktop:px-8 big:py-3.5 big:px-10 rounded-[10px] text-xs mid:text-sm desktop:text-base big:text-lg font-semibold cursor-pointer transition-all min-w-[90px] mid:min-w-[100px] desktop:min-w-[120px] bg-gradient-to-br from-[#ff6b6b] to-[#ff5252] text-white shadow-[0_4px_15px_rgba(255,107,107,0.4)] hover:bg-gradient-to-br hover:from-[#ff5252] hover:to-[#ff4444] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,107,107,0.6)] active:translate-y-0" onClick={onConfirm}>
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
