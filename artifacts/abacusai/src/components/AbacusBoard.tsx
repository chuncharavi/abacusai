import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export type AbacusTheme = 'kids' | 'teen' | 'adult' | 'dark';
export type AbacusMode = 'display' | 'interactive' | 'flash';

interface AbacusBoardProps {
  mode?: AbacusMode;
  value?: number;
  onValueChange?: (value: number) => void;
  theme?: AbacusTheme;
  className?: string;
}

const THEMES = {
  kids: {
    frame: '#ff7f50',
    beam: '#ff7f50',
    rod: '#d1d5db',
    bead: '#f59e0b',
    beadActive: '#d97706',
    background: '#fffbeb'
  },
  teen: {
    frame: '#14b8a6',
    beam: '#14b8a6',
    rod: '#9ca3af',
    bead: '#6366f1',
    beadActive: '#4f46e5',
    background: '#f8fafc'
  },
  adult: {
    frame: '#d4af37',
    beam: '#d4af37',
    rod: '#475569',
    bead: '#64748b',
    beadActive: '#334155',
    background: '#f1f5f9'
  },
  dark: {
    frame: '#374151',
    beam: '#374151',
    rod: '#4b5563',
    bead: '#39ff14',
    beadActive: '#32cd32',
    background: '#111827'
  }
};

const ROD_COUNT = 9;

function numberToBeadState(val: number): { heaven: boolean; earth: number }[] {
  const strVal = Math.floor(Math.max(0, val)).toString().padStart(ROD_COUNT, '0');
  return strVal.split('').map(digit => {
    const d = parseInt(digit, 10);
    return { heaven: d >= 5, earth: d % 5 };
  });
}

function beadStateToNumber(state: { heaven: boolean; earth: number }[]): number {
  return parseInt(
    state.map(rod => (rod.heaven ? 5 : 0) + rod.earth).join(''),
    10
  );
}

export function AbacusBoard({
  mode = 'interactive',
  value = 0,
  onValueChange,
  theme = 'kids',
  className = ''
}: AbacusBoardProps) {
  const currentTheme = THEMES[theme];
  const [beads, setBeads] = useState(() => numberToBeadState(value));
  const [isVisible, setIsVisible] = useState(mode !== 'flash');

  useEffect(() => {
    if (mode === 'display' || mode === 'flash') {
      setBeads(numberToBeadState(value));
    }
  }, [value, mode]);

  useEffect(() => {
    if (mode === 'flash') {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [value, mode]);

  const handleHeavenClick = useCallback((rodIndex: number) => {
    if (mode !== 'interactive') return;
    setBeads(prev => {
      const newBeads = [...prev];
      newBeads[rodIndex] = { ...newBeads[rodIndex], heaven: !newBeads[rodIndex].heaven };
      const newValue = beadStateToNumber(newBeads);
      if (onValueChange) onValueChange(newValue);
      return newBeads;
    });
  }, [mode, onValueChange]);

  const handleEarthClick = useCallback((rodIndex: number, beadIndex: number) => {
    if (mode !== 'interactive') return;
    setBeads(prev => {
      const newBeads = [...prev];
      const currentEarth = newBeads[rodIndex].earth;
      const targetValue = beadIndex + 1;
      if (currentEarth >= targetValue) {
        newBeads[rodIndex] = { ...newBeads[rodIndex], earth: beadIndex };
      } else {
        newBeads[rodIndex] = { ...newBeads[rodIndex], earth: targetValue };
      }
      const newValue = beadStateToNumber(newBeads);
      if (onValueChange) onValueChange(newValue);
      return newBeads;
    });
  }, [mode, onValueChange]);

  if (!isVisible && mode === 'flash') {
    return (
      <div
        className={`w-full aspect-[2/1] rounded-2xl flex items-center justify-center ${className}`}
        style={{ backgroundColor: currentTheme.background, border: `8px solid ${currentTheme.frame}` }}
      >
        <p className="text-xl font-bold opacity-50" style={{ color: currentTheme.frame }}>Recall the number!</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-4xl mx-auto overflow-hidden p-2 sm:p-4 rounded-3xl ${className}`}
      style={{ backgroundColor: currentTheme.background }}
    >
      <svg viewBox="0 0 1000 500" className="w-full h-auto drop-shadow-xl" data-testid="abacus-board">
        {/* Frame */}
        <rect x="10" y="10" width="980" height="480" rx="15" fill="none" stroke={currentTheme.frame} strokeWidth="20" />

        {/* Beam */}
        <rect x="20" y="150" width="960" height="15" fill={currentTheme.beam} />

        {/* Rods and Beads */}
        {beads.map((rod, rIndex) => {
          const x = 100 + rIndex * 100;

          // Heaven bead: inactive=top (y=30), active=near beam (y=90)
          const heavenY = rod.heaven ? 90 : 30;

          return (
            <g key={`rod-${rIndex}`}>
              {/* Rod line */}
              <line x1={x} y1="20" x2={x} y2="480" stroke={currentTheme.rod} strokeWidth="6" />

              {/* Heaven Bead — use motion.g so CSS transform moves the hit-area too */}
              <motion.g
                animate={{ y: heavenY }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => handleHeavenClick(rIndex)}
                style={{ cursor: mode === 'interactive' ? 'pointer' : 'default' }}
              >
                <rect
                  x={x - 35}
                  y={0}
                  width="70"
                  height="40"
                  rx="20"
                  fill={rod.heaven ? currentTheme.beadActive : currentTheme.bead}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="2"
                />
                <rect
                  x={x - 20}
                  y={5}
                  width="40"
                  height="10"
                  rx="5"
                  fill="rgba(255,255,255,0.3)"
                />
              </motion.g>

              {/* Earth Beads */}
              {[3, 2, 1, 0].map((bIndex) => {
                const isActive = rod.earth > bIndex;
                // inactive: stacked at bottom; active: pushed up near beam
                const inactiveY = 430 - (3 - bIndex) * 45;
                const activeY = 180 + (3 - bIndex) * 45;
                const targetY = isActive ? activeY : inactiveY;

                return (
                  <motion.g
                    key={`bead-${rIndex}-${bIndex}`}
                    animate={{ y: targetY }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={() => handleEarthClick(rIndex, bIndex)}
                    style={{ cursor: mode === 'interactive' ? 'pointer' : 'default' }}
                  >
                    <rect
                      x={x - 35}
                      y={0}
                      width="70"
                      height="40"
                      rx="20"
                      fill={isActive ? currentTheme.beadActive : currentTheme.bead}
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="2"
                    />
                    <rect
                      x={x - 20}
                      y={5}
                      width="40"
                      height="10"
                      rx="5"
                      fill="rgba(255,255,255,0.3)"
                    />
                  </motion.g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
