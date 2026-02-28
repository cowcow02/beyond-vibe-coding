// app/components/SkyDome.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 8 clouds, each made of 4 merged spheres
const CLOUDS = [
  { x: -60, y: 70, z: -80, scale: 1.2 },
  { x:  20, y: 80, z: -100, scale: 0.9 },
  { x:  80, y: 75, z: -50, scale: 1.0 },
  { x: -30, y: 85, z:  30, scale: 1.3 },
  { x:  60, y: 72, z:  70, scale: 0.8 },
  { x: -90, y: 78, z:  60, scale: 1.1 },
  { x:  10, y: 90, z: 100, scale: 0.95 },
  { x: -50, y: 68, z: -20, scale: 1.4 },
];

// Cloud blob offsets within each cloud
const BLOB_OFFSETS = [
  [0, 0, 0], [2.5, 0.8, 0], [-2.0, 0.5, 0.5], [0.5, 1.2, -1.0],
];

export function SkyDome() {
  const cloudRefs = useRef<(THREE.Group | null)[]>([]);
  const speeds = useRef(CLOUDS.map(() => 0.02 + Math.random() * 0.04));

  useFrame((_, delta) => {
    cloudRefs.current.forEach((ref, i) => {
      if (!ref) return;
      ref.position.x += speeds.current[i] * delta * 10;
      if (ref.position.x > 120) ref.position.x = -120;
    });
  });

  return (
    <>
      {/* Sky sphere — inside-facing gradient */}
      <mesh>
        <sphereGeometry args={[280, 32, 16]} />
        <meshBasicMaterial color="#5ba3d9" side={THREE.BackSide} />
      </mesh>

      {/* Horizon brightening — second smaller sphere */}
      <mesh>
        <sphereGeometry args={[270, 32, 8, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
        <meshBasicMaterial color="#a8d4f0" side={THREE.BackSide} transparent opacity={0.6} />
      </mesh>

      {/* Clouds */}
      {CLOUDS.map((cloud, ci) => (
        <group
          key={ci}
          ref={el => { cloudRefs.current[ci] = el; }}
          position={[cloud.x, cloud.y, cloud.z]}
          scale={cloud.scale}
        >
          {BLOB_OFFSETS.map((off, bi) => (
            <mesh key={bi} position={off as [number, number, number]}>
              <sphereGeometry args={[3.5, 8, 6]} />
              <meshBasicMaterial color="#f0f6ff" transparent opacity={0.82} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
