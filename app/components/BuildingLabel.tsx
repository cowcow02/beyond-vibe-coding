// app/components/BuildingLabel.tsx
'use client';

import { Html } from '@react-three/drei';

interface Props {
  name: string;
  position: [number, number, number];
  accentColor: string;
}

export function BuildingLabel({ name, position, accentColor }: Props) {
  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#e2e8f0',
        textShadow: '0 0 4px #0f172a, 0 0 8px #0f172a',
        letterSpacing: '0.05em',
      }}
    >
      {name}
    </Html>
  );
}
