// app/components/UnlockCard.tsx
'use client';

import { motion } from 'framer-motion';
import type { UnlockItem } from '../lib/unlocks';

interface Props {
  item: UnlockItem;
  thumbnail: string | null;   // unused — kept for API compat
  accentColor: string;
  active: boolean;            // camera is focused on this item
  onClick: () => void;
}

const TYPE_LABELS: Record<UnlockItem['type'], string> = {
  district: 'DISTRICT',
  building: 'BUILDING',
  floor:    'FLOOR ↑',
};

/** Sharp inline SVG isometric illustration — cluster of buildings, always crisp */
function IsoThumb({ accentColor }: { accentColor: string }) {
  const hex = accentColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const c = (a: number) => `rgba(${r},${g},${b},${a})`;

  const buildings = [
    { ox: 45, oy: 55, h: 28 },
    { ox: 75, oy: 48, h: 35 },
    { ox: 60, oy: 62, h: 18 },
    { ox: 90, oy: 58, h: 22 },
  ];

  return (
    <svg viewBox="0 0 150 90" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="150" height="90" fill="#080e1c" />
      <ellipse cx="75" cy="68" rx="55" ry="14" fill={c(0.08)} />
      {buildings.map(({ ox, oy, h }, i) => {
        const w = 18;
        const d = 9;
        return (
          <g key={i}>
            <polygon points={`${ox+w},${oy} ${ox+w},${oy+h} ${ox+w-d},${oy+h+d/2} ${ox+w-d},${oy+d/2}`} fill={c(0.25)} />
            <polygon points={`${ox-w},${oy} ${ox-w},${oy+h} ${ox-w+d},${oy+h+d/2} ${ox-w+d},${oy+d/2}`} fill={c(0.45)} />
            <polygon points={`${ox},${oy-d/2} ${ox+w},${oy+d/2} ${ox},${oy+d*1.5} ${ox-w},${oy+d/2}`} fill={c(0.85)} />
          </g>
        );
      })}
    </svg>
  );
}

export function UnlockCard({ item, accentColor, active, onClick }: Props) {
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
      {/* Thumbnail area — 150×90px inline SVG illustration */}
      <div style={{ width: 150, height: 90, position: 'relative' }}>
        <IsoThumb accentColor={accentColor} />
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
