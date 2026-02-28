// app/components/BuildingLabel.tsx
'use client';

import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ZOOM_SHOW = 20;   // labels fade in above this zoom
const ZOOM_FULL = 26;   // fully opaque above this zoom

interface Props {
  name: string;
  position: [number, number, number];
  accentColor: string;
}

export function BuildingLabel({ name, position, accentColor }: Props) {
  const [opacity, setOpacity] = useState(0);
  const lastOpacity = useRef(0);

  useFrame(({ camera }) => {
    const zoom = (camera as THREE.OrthographicCamera).zoom;
    const target = zoom < ZOOM_SHOW ? 0 : Math.min(1, (zoom - ZOOM_SHOW) / (ZOOM_FULL - ZOOM_SHOW));
    // Only trigger React state update when value meaningfully changes
    if (Math.abs(target - lastOpacity.current) > 0.02) {
      lastOpacity.current = target;
      setOpacity(target);
    }
  });

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
        opacity,
        transition: 'opacity 0.15s',
      }}
    >
      {name}
    </Html>
  );
}
