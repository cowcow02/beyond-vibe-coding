// app/components/UnlockCarousel.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnlockItem } from '../lib/unlocks';
import { UnlockCard } from './UnlockCard';
import { LEVEL_LABELS } from '../data/city';

interface Props {
  level: number;
  items: UnlockItem[];
  accentColor: string;
  activeItemId: string | null;
  onItemClick: (item: UnlockItem) => void;
  bottomOffset?: number;             // shift up (e.g. to sit above a fixed slider)
  nextLabel?: string;                // if set, shows a "Next →" button in the header
  onNext?: () => void;
}

export function UnlockCarousel({
  level, items, accentColor, activeItemId, onItemClick, bottomOffset = 0,
  nextLabel, onNext,
}: Props) {
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const labelData = LEVEL_LABELS[level];

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(2,6,23,0.88)',
        borderTop: `1px solid ${accentColor}44`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: accentColor,
          flex: 1,
        }}>
          L{level} · {labelData?.title?.toUpperCase()} · {items.length} unlocked
        </span>
        {nextLabel && onNext && (
          <button
            onClick={onNext}
            style={{
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}55`,
              borderRadius: 4,
              cursor: 'pointer',
              color: accentColor,
              fontFamily: 'monospace',
              fontSize: 11,
              padding: '3px 10px',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            {nextLabel}
          </button>
        )}
        <button
          onClick={() => setMinimized(m => !m)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontFamily: 'monospace',
            fontSize: 14,
            padding: '2px 4px',
            lineHeight: 1,
          }}
        >
          {minimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Card row */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={scrollRef}
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                padding: '12px 16px 14px',
                scrollbarWidth: 'none',
              }}
            >
              {items.map(item => (
                <UnlockCard
                  key={item.id}
                  item={item}
                  accentColor={accentColor}
                  active={activeItemId === item.id}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
