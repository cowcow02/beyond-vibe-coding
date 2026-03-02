'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEVEL_LABELS } from '../data/city';
import TypewriterText from './TypewriterText';

type Phase = 'idle' | 'title' | 'reveal' | 'settle' | 'narrative' | 'explore';

interface Props {
  levelIndex: number;
  active: boolean;
  onPhaseChange: (phase: Phase) => void;
  onExplore: () => void;
  accentColor?: string;
}

export default function LevelScene({
  levelIndex,
  active,
  onPhaseChange,
  onExplore,
  accentColor = '#60a5fa',
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const labelData = LEVEL_LABELS[levelIndex];

  function clearAllTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (holdTimeoutRef.current !== null) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }

  function transitionTo(next: Phase) {
    setPhase(next);
    onPhaseChange(next);
  }

  // Main phase sequence: triggered when active becomes true
  useEffect(() => {
    if (!active) {
      clearAllTimeouts();
      setTypingDone(false);
      transitionTo('idle');
      return;
    }

    // active just became true — start sequence from idle
    transitionTo('title');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // When typing completes inside the title phase, hold 1.75s then advance
  useEffect(() => {
    if (phase !== 'title' || !typingDone) return;

    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null;
      transitionTo('reveal');

      const t1 = setTimeout(() => {
        transitionTo('settle');

        const t2 = setTimeout(() => {
          transitionTo('narrative');
        }, 700);
        timeoutsRef.current.push(t2);
      }, 2000);
      timeoutsRef.current.push(t1);
    }, 1750);

    return () => {
      if (holdTimeoutRef.current !== null) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingDone, phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTitle = phase === 'title';
  const showNarrative = phase === 'narrative';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Title overlay */}
      <AnimatePresence>
        {showTitle && (
          <motion.div
            key="title-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(2,6,23,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Badge */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accentColor,
                background: `${accentColor}22`,
                border: `1px solid ${accentColor}55`,
                borderRadius: '4px',
                padding: '4px 12px',
              }}
            >
              L{levelIndex}
            </span>

            {/* Tagline via TypewriterText */}
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                color: '#ffffff',
                textAlign: 'center',
                maxWidth: '700px',
                lineHeight: 1.3,
                padding: '0 1.5rem',
              }}
            >
              <TypewriterText
                text={labelData?.tagline ?? ''}
                charDelay={38}
                onComplete={() => setTypingDone(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narrative overlay */}
      <AnimatePresence>
        {showNarrative && (
          <motion.div
            key="narrative-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'auto',
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(2,6,23,0.7) 45%, rgba(2,6,23,0.85) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '3.5rem',
            }}
          >
            <div
              style={{
                maxWidth: '680px',
                width: '100%',
                padding: '0 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'center',
              }}
            >
              {/* Small level label */}
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: accentColor,
                }}
              >
                L{levelIndex} · {labelData?.title}
              </span>

              {/* Narrative text */}
              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.125rem',
                  color: '#ffffff',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {labelData?.narrative}
              </p>

              {/* Scroll hint with pulsing animation */}
              <PulsingHint />

              {/* Explore button */}
              <button
                onClick={() => {
                  transitionTo('explore');
                  onExplore();
                }}
                style={{
                  pointerEvents: 'auto',
                  marginTop: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: accentColor,
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}44`,
                  borderRadius: 4,
                  padding: '6px 16px',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                [ Explore this level ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PulsingHint() {
  return (
    <>
      <style>{`
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .scroll-hint-pulse {
          animation: pulse-opacity 2s ease-in-out infinite;
        }
      `}</style>
      <span
        className="scroll-hint-pulse"
        style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: '#94a3b8',
          letterSpacing: '0.08em',
          marginTop: '0.5rem',
        }}
      >
        scroll to continue ↓
      </span>
    </>
  );
}
