// app/components/UnlockCard.tsx
'use client';

import { motion } from 'framer-motion';
import type { UnlockItem } from '../lib/unlocks';

interface Props {
  item: UnlockItem;
  thumbnail: string | null;   // data URL or null while capturing
  accentColor: string;
  active: boolean;            // camera is focused on this item
  onClick: () => void;
}

const TYPE_LABELS: Record<UnlockItem['type'], string> = {
  district: 'DISTRICT',
  building: 'BUILDING',
  floor:    'FLOOR ↑',
};

export function UnlockCard({ item, thumbnail, accentColor, active, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      style={{
        flexShrink: 0,
        width: 150,
        background: 'rgba(15,23,42,0.85)',
        border: `1px solid ${active ? accentColor : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Thumbnail area — 150×90px */}
      <div style={{ width: 150, height: 90, position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
        {thumbnail ? (
          <motion.img
            src={thumbnail}
            alt={item.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          /* Shimmer placeholder */
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }} />
        )}
      </div>

      {/* Text area */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Type badge */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: item.type === 'district' ? accentColor : item.type === 'building' ? 'rgba(255,255,255,0.6)' : '#94a3b8',
        }}>
          {TYPE_LABELS[item.type]}
        </span>
        {/* Name */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.3,
        }}>
          {item.name}
        </span>
        {/* Subtitle — 2-line clamp */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: '#64748b',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.subtitle}
        </span>
      </div>
    </motion.button>
  );
}
