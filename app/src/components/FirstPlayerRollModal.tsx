import React, { useState, useEffect, useCallback, useRef } from 'react';

interface FirstPlayerRollModalProps {
  isOpen: boolean;
  onComplete: (firstPlayer: 'white' | 'black') => void;
}

const FirstPlayerRollModal: React.FC<FirstPlayerRollModalProps> = ({ isOpen, onComplete }) => {
  const [whiteDie, setWhiteDie] = useState<number | null>(null);
  const [blackDie, setBlackDie] = useState<number | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownProgress, setCountdownProgress] = useState(100);
  const [revealedWinner, setRevealedWinner] = useState<'white' | 'black' | null>(null);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rollDie = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  const clearTimers = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const startRoll = useCallback(function startRoll() {
    clearTimers();
    setIsCountdownActive(false);
    setCountdownProgress(100);
    setRevealedWinner(null);

    // Decide winner immediately (kept hidden during reveal countdown).
    let finalWhite = rollDie();
    let finalBlack = rollDie();
    while (finalWhite === finalBlack) {
      finalWhite = rollDie();
      finalBlack = rollDie();
    }
    const winner: 'white' | 'black' = finalWhite > finalBlack ? 'white' : 'black';

    // Tension phase: shaking + rapidly changing dice for the full countdown.
    rollIntervalRef.current = setInterval(() => {
      setWhiteDie(rollDie());
      setBlackDie(rollDie());
    }, 100);
    setIsCountdownActive(true);
    setCountdownProgress(100);

    const countdownDurationMs = 2000;
    const tickMs = 50;
    const countdownStart = Date.now();

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - countdownStart;
      const remainingRatio = Math.max(0, 1 - elapsed / countdownDurationMs);
      setCountdownProgress(Math.round(remainingRatio * 100));

      if (elapsed >= countdownDurationMs) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }

        setIsCountdownActive(false);
        setWhiteDie(finalWhite);
        setBlackDie(finalBlack);
        setRevealedWinner(winner);

        // Brief "tadaaa" reveal before proceeding.
        revealTimeoutRef.current = setTimeout(() => {
          onComplete(winner);
        }, 1000);
      }
    }, tickMs);
  }, [clearTimers, onComplete]);

  useEffect(() => {
    if (isOpen) {
      // Start rolling after a brief delay
      const timer = setTimeout(() => {
        startRoll();
      }, 100);
      return () => {
        clearTimeout(timer);
        clearTimers();
      };
    } else {
      // Reset when modal closes
      clearTimers();
    }
  }, [clearTimers, isOpen, startRoll]);

  const renderDots = (value: number, dotClassName: string) => {
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
          className={`w-[18px] h-[18px] rounded-full transition-opacity absolute ${dotClassName} ${positions.includes(i) ? 'opacity-100' : 'opacity-0'}`}
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

  const circleRadius = 48;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset =
    circleCircumference - (countdownProgress / 100) * circleCircumference;
  const shouldShakeDice = isCountdownActive;
  const isRevealPhase = !!revealedWinner && !isCountdownActive;
  const whiteWinner = revealedWinner === 'white';
  const blackWinner = revealedWinner === 'black';

  const dieBoxClass =
    "w-[120px] h-[120px] shrink-0 rounded-[15px] flex items-center justify-center relative overflow-hidden transition-transform duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-[20px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center min-w-[500px] max-w-[600px] animate-[modalSlideIn_0.3s_ease-out] overflow-x-clip overflow-y-visible">
        <h2 className="text-white m-0 mb-2.5 text-[32px] font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">Determining First Player</h2>
        <p className="text-[#ecf0f1] m-0 mb-7.5 text-lg">
          {isCountdownActive
            ? "Who goes first? Tension build-up..."
            : revealedWinner
              ? `Tadaaa! Winner is ${revealedWinner.toUpperCase()}`
              : "Preparing reveal..."}
        </p>

        {/* Dice arena: winner scales up + centers; loser shrinks + slides off toward edge */}
        <div
          className={`relative mx-auto my-7.5 w-full min-h-[260px] ${
            isRevealPhase
              ? "overflow-visible"
              : "flex flex-row flex-wrap items-center justify-center gap-8 md:gap-10"
          }`}
        >
          {/* White column */}
          <div
            className={`flex flex-col items-center gap-3 will-change-transform ${
              !isRevealPhase
                ? "relative z-10"
                : whiteWinner
                  ? "absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 scale-[1.38] drop-shadow-[0_0_40px_rgba(255,215,0,0.55)]"
                  : "absolute left-0 top-1/2 z-0 -translate-y-1/2 -translate-x-[28%] scale-[0.38] opacity-[0.22] blur-[2px] pointer-events-none"
            }`}
          >
            <div className="text-2xl font-bold text-white uppercase font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
              White
            </div>
            <div
              className={`${dieBoxClass} bg-white shadow-[0_8px_16px_rgba(0,0,0,0.3)] ${
                shouldShakeDice ? "animate-[shake_0.1s_infinite]" : ""
              } ${
                isRevealPhase && whiteWinner
                  ? "ring-4 ring-amber-300/90 shadow-[0_0_45px_rgba(255,215,0,0.75)]"
                  : ""
              }`}
            >
              <div className="w-full h-full flex items-center justify-center relative">
                {whiteDie !== null ? (
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 p-3 w-full h-full absolute top-0 left-0">
                    {renderDots(whiteDie, "bg-black")}
                  </div>
                ) : (
                  <div className="text-5xl text-[#95a5a6] font-bold flex items-center justify-center w-full h-full absolute top-0 left-0">
                    ?
                  </div>
                )}
              </div>
            </div>
            {whiteDie !== null && !isCountdownActive && (
              <div className="text-[28px] font-bold text-white font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
                {whiteDie}
              </div>
            )}
            {isRevealPhase && whiteWinner && (
              <div className="px-5 py-1.5 rounded-full bg-amber-300 text-black font-black text-sm tracking-[1px] uppercase animate-[scaleIn_0.45s_ease-out]">
                Winner
              </div>
            )}
          </div>

          {/* VS — hidden during reveal so winner can own the center */}
          <div
            className={`flex flex-col items-center justify-center px-2 transition-all duration-500 ease-out ${
              isRevealPhase
                ? "pointer-events-none w-0 overflow-hidden opacity-0 scale-0 p-0"
                : "relative z-10 opacity-100"
            }`}
          >
            <div className="text-[32px] font-bold text-[#f39c12] font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)] whitespace-nowrap">
              VS
            </div>
          </div>

          {/* Black column */}
          <div
            className={`flex flex-col items-center gap-3 will-change-transform ${
              !isRevealPhase
                ? "relative z-10"
                : blackWinner
                  ? "absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 scale-[1.38] drop-shadow-[0_0_40px_rgba(255,215,0,0.55)]"
                  : "absolute right-0 top-1/2 z-0 -translate-y-1/2 translate-x-[28%] scale-[0.38] opacity-[0.22] blur-[2px] pointer-events-none"
            }`}
          >
            <div className="text-2xl font-bold text-white uppercase font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
              Black
            </div>
            <div
              className={`${dieBoxClass} bg-gradient-to-br from-[#1f1f1f] via-black to-[#0a0a0a] border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.45)] ${
                shouldShakeDice ? "animate-[shake_0.1s_infinite]" : ""
              } ${
                isRevealPhase && blackWinner
                  ? "ring-4 ring-amber-300/90 shadow-[0_0_45px_rgba(255,215,0,0.75)]"
                  : ""
              }`}
            >
              <div className="w-full h-full flex items-center justify-center relative">
                {blackDie !== null ? (
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 p-3 w-full h-full absolute top-0 left-0">
                    {renderDots(blackDie, "bg-white")}
                  </div>
                ) : (
                  <div className="text-5xl text-white/70 font-bold flex items-center justify-center w-full h-full absolute top-0 left-0">
                    ?
                  </div>
                )}
              </div>
            </div>
            {blackDie !== null && !isCountdownActive && (
              <div className="text-[28px] font-bold text-white font-['Righteous','Bebas_Neue',cursive] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
                {blackDie}
              </div>
            )}
            {isRevealPhase && blackWinner && (
              <div className="px-5 py-1.5 rounded-full bg-amber-300 text-black font-black text-sm tracking-[1px] uppercase animate-[scaleIn_0.45s_ease-out]">
                Winner
              </div>
            )}
          </div>
        </div>

        {isCountdownActive && (
          <div className="mt-2.5 flex flex-col items-center gap-2.5">
            <div className="relative w-[120px] h-[120px]">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 120 120"
                role="img"
                aria-label={`Round starts in ${countdownProgress} percent`}
              >
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  stroke="#f39c12"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={progressOffset}
                  className="transition-[stroke-dashoffset] duration-75 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl font-['Righteous','Bebas_Neue',cursive]">
                {countdownProgress}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirstPlayerRollModal;
