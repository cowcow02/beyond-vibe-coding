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
  thumbnails: Map<string, string>;   // itemId → data URL
  accentColor: string;
  activeItemId: string | null;
  onItemClick: (item: UnlockItem) => void;
  bottomOffset?: number;             // shift up (e.g. to sit above a fixed slider)
}

export function UnlockCarousel({
  level, items, thumbnails, accentColor, activeItemId, onItemClick, bottomOffset = 0,
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
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: accentColor,
        }}>
          L{level} · {labelData?.title?.toUpperCase()} · {items.length} things unlocked
        </span>
        <button
          onClick={() => setMinimized(m => !m)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontFamily: 'monospace',
            fontSize: 12,
            padding: '2px 6px',
          }}
        >
          {minimized ? '↑ show' : '↓ hide'}
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
                  thumbnail={thumbnails.get(item.id) ?? null}
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
