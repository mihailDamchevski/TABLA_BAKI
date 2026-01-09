import React from 'react';
import type { VariantRules } from '../types/variant';

interface VariantRulesModalProps {
  isOpen: boolean;
  variant: string;
  rules: VariantRules | null;
  onClose: () => void;
}

const VariantRulesModal: React.FC<VariantRulesModalProps> = ({ isOpen, variant, rules, onClose }) => {
  if (!isOpen) return null;

  const variantName = variant.charAt(0).toUpperCase() + variant.slice(1).replace(/-/g, ' ');

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[10000] animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-w-[600px] w-[90%] max-h-[85vh] flex flex-col animate-[slideUp_0.3s_ease-out] border-2 border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center py-6 px-7 border-b border-white/10">
          <h2 className="m-0 text-2xl font-bold bg-gradient-to-br from-white to-[#a8d8ff] bg-clip-text text-transparent">📚 {variantName} Rules</h2>
          <button className="bg-white/10 border-none text-white text-[32px] w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-all leading-none p-0 hover:bg-white/20 hover:rotate-90" onClick={onClose}>×</button>
        </div>
        
        <div className="py-7 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
          {rules ? (
            <>
              {rules.description && (
                <div className="mb-7 last:mb-0">
                  <h3 className="m-0 mb-3 text-lg font-semibold text-white flex items-center gap-2">About</h3>
                  <p className="m-0 mb-3 text-white/80 leading-relaxed">{rules.description}</p>
                </div>
              )}

              {rules.movement && (
                <div className="mb-7 last:mb-0">
                  <h3 className="m-0 mb-3 text-lg font-semibold text-white flex items-center gap-2">🎲 Movement</h3>
                  {rules.movement.description && <p className="m-0 mb-3 text-white/80 leading-relaxed">{rules.movement.description}</p>}
                  <ul className="mt-3 pl-6 text-white/90">
                    {rules.movement.direction && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Direction:</strong>{' '}
                        {rules.movement.direction.white === rules.movement.direction.black
                          ? 'Both players move in the same direction (clockwise)'
                          : rules.movement.direction.white === -1 && rules.movement.direction.black === 1
                          ? 'White moves from 24 to 1, Black moves from 1 to 24 (opposite directions)'
                          : 'Players move in opposite directions'}
                      </li>
                    )}
                    {rules.movement.doubles_uses && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Doubles:</strong> When doubles are rolled (e.g., 2-2), the player gets {rules.movement.doubles_uses} moves of that value instead of 2
                      </li>
                    )}
                    {rules.movement.combined_moves && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Combined Moves:</strong>{' '}
                        {rules.movement.combined_moves.normal ? 'Players can use the sum of both dice in a single normal move' : 'Cannot combine dice for normal moves'}
                        {rules.movement.combined_moves.enter && ', can combine dice when entering from bar'}
                        {rules.movement.combined_moves.bear_off && ', can combine dice when bearing off'}
                        {!rules.movement.combined_moves.normal && !rules.movement.combined_moves.enter && !rules.movement.combined_moves.bear_off && ' Not allowed'}
                        {rules.movement.combined_moves.description && (
                          <span className="text-white/70 italic block mt-1"> — {rules.movement.combined_moves.description}</span>
                        )}
                      </li>
                    )}
                    {rules.movement.must_use_all_dice && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Must use all dice</strong> if possible before turn ends
                      </li>
                    )}
                    {rules.board?.initial_setup && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Initial Setup:</strong> Checkers start on specific points as configured
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {rules.hitting && (
                <div className="mb-7 last:mb-0">
                  <h3 className="m-0 mb-3 text-lg font-semibold text-white flex items-center gap-2">⚔️ Hitting & Pinning</h3>
                  {rules.hitting.description && <p className="m-0 mb-3 text-white/80 leading-relaxed">{rules.hitting.description}</p>}
                  <ul className="mt-3 pl-6 text-white/90">
                    {rules.hitting.can_hit ? (
                      <>
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">Hitting allowed:</strong> Landing on an opponent's single checker (blot) sends it to the bar
                        </li>
                        {rules.hitting.send_to_bar && (
                          <li className="mb-2 leading-normal">
                            Hit checkers must re-enter from the bar before making other moves
                          </li>
                        )}
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">Blocked points:</strong> Cannot land on points with 2 or more opponent checkers
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">No hitting:</strong> Cannot send opponent checkers to the bar
                        </li>
                        {rules.hitting.pin_instead && (
                          <li className="mb-2 leading-normal">
                            <strong className="text-white font-semibold">Pinning:</strong> Landing on an opponent's single checker pins it (prevents movement until unpinned)
                          </li>
                        )}
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">Blocked points:</strong> Cannot land on points with 2 or more opponent checkers
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {rules.bearing_off && (
                <div className="mb-7 last:mb-0">
                  <h3 className="m-0 mb-3 text-lg font-semibold text-white flex items-center gap-2">🏁 Bearing Off</h3>
                  {rules.bearing_off.description && <p className="m-0 mb-3 text-white/80 leading-relaxed">{rules.bearing_off.description}</p>}
                  <ul className="mt-3 pl-6 text-white/90">
                    {rules.bearing_off.enabled ? (
                      <>
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">Bearing off enabled:</strong> Players can remove checkers from the board once all are in the home board
                        </li>
                        {rules.bearing_off.all_in_outer_board && (
                          <li className="mb-2 leading-normal">
                            <strong className="text-white font-semibold">Requirement:</strong> All pieces must be in home board (points 1-6 for white, 19-24 for black) before bearing off
                          </li>
                        )}
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">Rules:</strong> Use exact die value, or bear off from highest occupied point if overshooting
                        </li>
                        <li className="mb-2 leading-normal">
                          <strong className="text-white font-semibold">Goal:</strong> First player to bear off all 15 checkers wins
                        </li>
                      </>
                    ) : (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Bearing off disabled:</strong> This variant does not allow bearing off
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {rules.forced_moves && (
                <div className="mb-7 last:mb-0">
                  <h3 className="m-0 mb-3 text-lg font-semibold text-white flex items-center gap-2">⚡ Forced Moves & Turn Rules</h3>
                  {rules.forced_moves.description && <p className="m-0 mb-3 text-white/80 leading-relaxed">{rules.forced_moves.description}</p>}
                  <ul className="mt-3 pl-6 text-white/90">
                    {rules.forced_moves.must_use_all_dice && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Must use all dice:</strong> If a legal move exists for any die, you must use it
                      </li>
                    )}
                    {rules.forced_moves.must_use_higher_if_only_one && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Higher die priority:</strong> If only one die can be used, must use the higher value
                      </li>
                    )}
                    <li className="mb-2 leading-normal">
                      <strong className="text-white font-semibold">Bar entry:</strong> If you have checkers on the bar, you must enter them before making other moves
                    </li>
                    <li className="mb-2 leading-normal">
                      <strong className="text-white font-semibold">No legal moves:</strong> If no legal moves exist after rolling, turn passes to opponent
                    </li>
                  </ul>
                </div>
              )}

              {rules.board && (
                <div className="mb-7 last:mb-0">
                  <h3 className="m-0 mb-3 text-lg font-semibold text-white flex items-center gap-2">📐 Board Setup</h3>
                  <ul className="mt-3 pl-6 text-white/90">
                    <li className="mb-2 leading-normal">
                      <strong className="text-white font-semibold">Points:</strong> {rules.board.points} points on the board
                    </li>
                    {rules.board.initial_setup && (
                      <li className="mb-2 leading-normal">
                        <strong className="text-white font-semibold">Starting positions:</strong> Checkers begin on specific points as configured for this variant
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-white/60">
              <p>Loading rules...</p>
            </div>
          )}
        </div>

        <div className="py-5 px-7 border-t border-white/10 flex justify-end">
          <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] border-none text-white py-3 px-8 rounded-[10px] text-base font-semibold cursor-pointer transition-all shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(102,126,234,0.6)] active:translate-y-0" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantRulesModal;
