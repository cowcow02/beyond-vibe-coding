'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { type District } from '../data/city';
import { TILE_SIZE, districtCenter } from '../lib/cityLayout';

interface Props {
  district: District;
  groundColor: string;
  accentColor: string;
  level: number;
  worldBounds?: { x: number; z: number; width: number; depth: number };
  onDistrictClick?: () => void;
  isFocused?: boolean;
  isOtherFocused?: boolean;
  showLabel?: boolean;
}

export function DistrictGround({ district, groundColor, accentColor, level, worldBounds, onDistrictClick, isFocused, isOtherFocused, showLabel = true }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(district.appearsAtLevel <= level ? 1 : 0);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    const wasVisible = district.appearsAtLevel <= prevLevelRef.current;
    const isVisible  = district.appearsAtLevel <= level;
    if (!wasVisible && isVisible) {
      opacityRef.current = 0; // start invisible, fade in via useFrame
    }
    prevLevelRef.current = level;
  }, [level, district.appearsAtLevel]);

  useFrame((_, delta) => {
    const isVisible = district.appearsAtLevel <= level;
    const target = isVisible ? 1 : 0;
    const current = opacityRef.current;
    if (Math.abs(target - current) < 0.001) return;
    opacityRef.current = current + (target - current) * Math.min(1, delta * 4);

    if (!groupRef.current) return;
    groupRef.current.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshLambertMaterial;
        if (mat) mat.opacity = opacityRef.current;
      }
    });
  });

  let cx: number, cz: number, width: number, depth: number;
  if (worldBounds) {
    cx = worldBounds.x + worldBounds.width / 2;
    cz = worldBounds.z + worldBounds.depth / 2;
    width = worldBounds.width;
    depth = worldBounds.depth;
  } else {
    [cx, cz] = districtCenter(
      district.originCol, district.originRow,
      district.cols, district.rows,
    );
    width = district.cols * TILE_SIZE;
    depth = district.rows * TILE_SIZE;
  }

  return (
    <group ref={groupRef} position={[cx, 0, cz]}>
      {/* Ground slab — stop propagation when focused so base-ground click-back doesn't fire */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => { if (isFocused) e.stopPropagation(); }}
      >
        <planeGeometry args={[width, depth]} />
        <meshLambertMaterial color={groundColor} transparent opacity={opacityRef.current} />
      </mesh>
      {/* Accent border (slightly larger, rendered just below) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[width + 0.3, depth + 0.3]} />
        <meshLambertMaterial color={accentColor} transparent opacity={opacityRef.current * 0.35} />
      </mesh>
      {/* District label — visible when unlocked */}
      {showLabel && district.appearsAtLevel <= level && (
        <Html
          center
          position={[0, 0.6, 0]}
          style={{ pointerEvents: onDistrictClick ? 'auto' : 'none' }}
        >
          <div
            onClick={onDistrictClick}
            style={{
              cursor: onDistrictClick ? 'pointer' : 'default',
              opacity: isOtherFocused ? 0.35 : 1,
              transform: isFocused ? 'scale(1.12)' : 'scale(1)',
              transition: 'opacity 0.3s, transform 0.3s',
              textAlign: 'center',
              userSelect: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <div style={{
              background: 'rgba(2,6,23,0.72)',
              border: `1px solid ${accentColor}55`,
              borderRadius: '5px',
              padding: '4px 10px 3px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1px',
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span style={{ color: accentColor, fontSize: '8px' }}>●</span>
                {district.name.toUpperCase()}
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                color: 'rgba(180,210,255,0.75)',
                whiteSpace: 'nowrap',
              }}>
                {district.buildings.length} buildings
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
