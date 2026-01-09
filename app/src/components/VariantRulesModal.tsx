import React from 'react';
import './VariantRulesModal.css';

interface VariantRulesModalProps {
  isOpen: boolean;
  variant: string;
  rules: VariantRules | null;
  onClose: () => void;
}

export interface VariantRules {
  variant: string;
  description: string;
  board?: {
    points: number;
    initial_setup?: Record<string, Record<string, number>>;
  };
  movement?: {
    direction?: Record<string, number>;
    must_use_all_dice?: boolean;
    doubles_uses?: number;
    combined_moves?: {
      normal?: boolean;
      enter?: boolean;
      bear_off?: boolean;
      description?: string;
    };
    description?: string;
  };
  hitting?: {
    can_hit?: boolean;
    send_to_bar?: boolean;
    pin_instead?: boolean;
    description?: string;
  };
  bearing_off?: {
    enabled?: boolean;
    all_in_outer_board?: boolean;
    description?: string;
  };
  forced_moves?: {
    must_use_all_dice?: boolean;
    must_use_higher_if_only_one?: boolean;
    description?: string;
  };
}

const VariantRulesModal: React.FC<VariantRulesModalProps> = ({ isOpen, variant, rules, onClose }) => {
  if (!isOpen) return null;

  const variantName = variant.charAt(0).toUpperCase() + variant.slice(1).replace(/-/g, ' ');

  return (
    <div className="variant-rules-modal-backdrop" onClick={onClose}>
      <div className="variant-rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="variant-rules-modal-header">
          <h2>📚 {variantName} Rules</h2>
          <button className="variant-rules-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="variant-rules-modal-content">
          {rules ? (
            <>
              {rules.description && (
                <div className="variant-rules-section">
                  <h3>About</h3>
                  <p>{rules.description}</p>
                </div>
              )}

              {rules.movement && (
                <div className="variant-rules-section">
                  <h3>🎲 Movement</h3>
                  {rules.movement.description && <p>{rules.movement.description}</p>}
                  <ul>
                    {rules.movement.direction && (
                      <li>
                        <strong>Direction:</strong>{' '}
                        {rules.movement.direction.white === rules.movement.direction.black
                          ? 'Both players move in the same direction (clockwise)'
                          : rules.movement.direction.white === -1 && rules.movement.direction.black === 1
                          ? 'White moves from 24 to 1, Black moves from 1 to 24 (opposite directions)'
                          : 'Players move in opposite directions'}
                      </li>
                    )}
                    {rules.movement.doubles_uses && (
                      <li>
                        <strong>Doubles:</strong> When doubles are rolled (e.g., 2-2), the player gets {rules.movement.doubles_uses} moves of that value instead of 2
                      </li>
                    )}
                    {rules.movement.combined_moves && (
                      <li>
                        <strong>Combined Moves:</strong>{' '}
                        {rules.movement.combined_moves.normal ? 'Players can use the sum of both dice in a single normal move' : 'Cannot combine dice for normal moves'}
                        {rules.movement.combined_moves.enter && ', can combine dice when entering from bar'}
                        {rules.movement.combined_moves.bear_off && ', can combine dice when bearing off'}
                        {!rules.movement.combined_moves.normal && !rules.movement.combined_moves.enter && !rules.movement.combined_moves.bear_off && ' Not allowed'}
                        {rules.movement.combined_moves.description && (
                          <span className="rule-detail"> — {rules.movement.combined_moves.description}</span>
                        )}
                      </li>
                    )}
                    {rules.movement.must_use_all_dice && (
                      <li>
                        <strong>Must use all dice</strong> if possible before turn ends
                      </li>
                    )}
                    {rules.board?.initial_setup && (
                      <li>
                        <strong>Initial Setup:</strong> Checkers start on specific points as configured
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {rules.hitting && (
                <div className="variant-rules-section">
                  <h3>⚔️ Hitting & Pinning</h3>
                  {rules.hitting.description && <p>{rules.hitting.description}</p>}
                  <ul>
                    {rules.hitting.can_hit ? (
                      <>
                        <li>
                          <strong>Hitting allowed:</strong> Landing on an opponent's single checker (blot) sends it to the bar
                        </li>
                        {rules.hitting.send_to_bar && (
                          <li>
                            Hit checkers must re-enter from the bar before making other moves
                          </li>
                        )}
                        <li>
                          <strong>Blocked points:</strong> Cannot land on points with 2 or more opponent checkers
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <strong>No hitting:</strong> Cannot send opponent checkers to the bar
                        </li>
                        {rules.hitting.pin_instead && (
                          <li>
                            <strong>Pinning:</strong> Landing on an opponent's single checker pins it (prevents movement until unpinned)
                          </li>
                        )}
                        <li>
                          <strong>Blocked points:</strong> Cannot land on points with 2 or more opponent checkers
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {rules.bearing_off && (
                <div className="variant-rules-section">
                  <h3>🏁 Bearing Off</h3>
                  {rules.bearing_off.description && <p>{rules.bearing_off.description}</p>}
                  <ul>
                    {rules.bearing_off.enabled ? (
                      <>
                        <li>
                          <strong>Bearing off enabled:</strong> Players can remove checkers from the board once all are in the home board
                        </li>
                        {rules.bearing_off.all_in_outer_board && (
                          <li>
                            <strong>Requirement:</strong> All pieces must be in home board (points 1-6 for white, 19-24 for black) before bearing off
                          </li>
                        )}
                        <li>
                          <strong>Rules:</strong> Use exact die value, or bear off from highest occupied point if overshooting
                        </li>
                        <li>
                          <strong>Goal:</strong> First player to bear off all 15 checkers wins
                        </li>
                      </>
                    ) : (
                      <li>
                        <strong>Bearing off disabled:</strong> This variant does not allow bearing off
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {rules.forced_moves && (
                <div className="variant-rules-section">
                  <h3>⚡ Forced Moves & Turn Rules</h3>
                  {rules.forced_moves.description && <p>{rules.forced_moves.description}</p>}
                  <ul>
                    {rules.forced_moves.must_use_all_dice && (
                      <li>
                        <strong>Must use all dice:</strong> If a legal move exists for any die, you must use it
                      </li>
                    )}
                    {rules.forced_moves.must_use_higher_if_only_one && (
                      <li>
                        <strong>Higher die priority:</strong> If only one die can be used, must use the higher value
                      </li>
                    )}
                    <li>
                      <strong>Bar entry:</strong> If you have checkers on the bar, you must enter them before making other moves
                    </li>
                    <li>
                      <strong>No legal moves:</strong> If no legal moves exist after rolling, turn passes to opponent
                    </li>
                  </ul>
                </div>
              )}

              {rules.board && (
                <div className="variant-rules-section">
                  <h3>📐 Board Setup</h3>
                  <ul>
                    <li>
                      <strong>Points:</strong> {rules.board.points} points on the board
                    </li>
                    {rules.board.initial_setup && (
                      <li>
                        <strong>Starting positions:</strong> Checkers begin on specific points as configured for this variant
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="variant-rules-loading">
              <p>Loading rules...</p>
            </div>
          )}
        </div>

        <div className="variant-rules-modal-footer">
          <button className="variant-rules-modal-button" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantRulesModal;
