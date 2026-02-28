// app/components/CityPark.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BlockLayout } from '../lib/cityLayoutGenerator';

interface FlowerDef {
  x: number; z: number;
  color: string;
  freq: number;
  phase: number;
}

interface FountainArc {
  angle: number;
  phaseOffset: number;
}

// Flower palettes cycled per block index (x/z are offsets from park center)
const FLOWER_PALETTES: FlowerDef[][] = [
  [
    { x: -0.5, z:  0.3, color: '#ff6b8a', freq: 2.1, phase: 0.0 },
    { x:  0.3, z: -0.4, color: '#ffb347', freq: 1.7, phase: 1.2 },
    { x: -0.2, z: -0.6, color: '#7ec8e3', freq: 2.5, phase: 2.4 },
    { x:  0.6, z:  0.2, color: '#b8f5a0', freq: 1.9, phase: 0.8 },
    { x: -0.6, z:  0.6, color: '#ffd700', freq: 2.3, phase: 3.1 },
  ],
  [
    { x: -0.4, z:  0.2, color: '#34d399', freq: 1.8, phase: 0.5 },
    { x:  0.4, z: -0.3, color: '#6ee7b7', freq: 2.2, phase: 1.8 },
    { x: -0.2, z: -0.5, color: '#a7f3d0', freq: 2.0, phase: 3.0 },
  ],
  [
    { x: -0.4, z:  0.4, color: '#38bdf8', freq: 2.2, phase: 0.6 },
    { x:  0.4, z: -0.3, color: '#7dd3fc', freq: 1.7, phase: 1.9 },
    { x: -0.3, z: -0.5, color: '#bae6fd', freq: 2.0, phase: 3.2 },
  ],
  [
    { x: -0.5, z:  0.3, color: '#a78bfa', freq: 2.4, phase: 0.3 },
    { x:  0.3, z: -0.5, color: '#c4b5fd', freq: 1.6, phase: 1.5 },
    { x:  0.5, z:  0.5, color: '#ddd6fe', freq: 2.0, phase: 2.7 },
    { x: -0.3, z: -0.2, color: '#7c3aed', freq: 1.9, phase: 0.9 },
  ],
  [
    { x: -0.4, z:  0.3, color: '#fb923c', freq: 2.0, phase: 0.7 },
    { x:  0.4, z: -0.4, color: '#fed7aa', freq: 1.8, phase: 2.0 },
  ],
  [
    { x: -0.5, z:  0.3, color: '#fbbf24', freq: 2.3, phase: 0.2 },
    { x:  0.4, z: -0.4, color: '#fde68a', freq: 1.8, phase: 1.4 },
  ],
  [
    { x: -0.5, z:  0.3, color: '#f472b6', freq: 2.1, phase: 1.1 },
    { x:  0.3, z: -0.4, color: '#fbcfe8', freq: 1.9, phase: 2.3 },
    { x:  0.5, z:  0.4, color: '#fce7f3', freq: 2.3, phase: 0.4 },
  ],
  [
    { x: -0.5, z:  0.4, color: '#e879f9', freq: 2.0, phase: 0.8 },
    { x:  0.4, z: -0.4, color: '#f0abfc', freq: 1.7, phase: 2.1 },
    { x: -0.2, z: -0.6, color: '#fae8ff', freq: 2.4, phase: 3.4 },
    { x:  0.6, z:  0.3, color: '#d946ef', freq: 1.9, phase: 1.0 },
  ],
  [
    { x: -0.5, z:  0.3, color: '#fbbf24', freq: 2.3, phase: 0.2 },
    { x:  0.4, z: -0.4, color: '#fde68a', freq: 1.8, phase: 1.4 },
    { x: -0.2, z: -0.5, color: '#fef3c7', freq: 2.1, phase: 2.6 },
  ],
];

// Tree configs cycled per block index (x/z are offsets from park center)
const TREE_SETS: { x: number; z: number; scale: number }[][] = [
  [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.9, z: -0.2, scale: 0.6 }],
  [{ x: 0.7, z: 0.7, scale: 0.65 }],
  [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.8, z: -0.3, scale: 0.6 }],
  [{ x: 0.8, z: -0.8, scale: 0.7 }, { x: -0.8, z: 0.8, scale: 0.6 }],
  [{ x: 0.8, z: 0.8, scale: 0.65 }],
  [{ x: 0.7, z: 0.7, scale: 0.65 }],
  [{ x: 0.8, z: -0.8, scale: 0.7 }],
  [{ x: 0.9, z: 0.9, scale: 0.75 }, { x: -0.9, z: 0.2, scale: 0.65 }],
  [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.8, z: -0.3, scale: 0.6 }],
];

// Fountain arc definitions (6 arcs per fountain)
const ARC_DEFS: FountainArc[] = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * Math.PI * 2,
  phaseOffset: i / 6,
}));

interface Props {
  blocks: BlockLayout[];
}

export function CityPark({ blocks }: Props) {
  // One ref per flower across all parks
  const flowerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const fountainRefs = useRef<(THREE.Mesh | null)[]>([]);

  let flowerIdx = 0;
  let fountainIdx = 0;
  // Pre-compute indices for useFrame
  const flowerMeta = useRef<{ baseY: number; freq: number; phase: number }[]>([]);
  const fountainMeta = useRef<{ cx: number; cz: number; arcAngle: number; arcPhase: number }[]>([]);

  // Populate metadata on first render
  if (flowerMeta.current.length === 0) {
    blocks.forEach((block, bi) => {
      const cx = block.parkX + block.parkWidth / 2;
      const cz = block.parkZ + block.parkDepth / 2;
      const flowers = FLOWER_PALETTES[bi % FLOWER_PALETTES.length];
      flowers.forEach(f => {
        flowerMeta.current.push({ baseY: 0.16, freq: f.freq, phase: f.phase });
      });
      if (bi % 2 === 0) {
        ARC_DEFS.forEach(arc => {
          fountainMeta.current.push({
            cx,
            cz,
            arcAngle: arc.angle,
            arcPhase: arc.phaseOffset,
          });
        });
      }
    });
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    flowerRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const m = flowerMeta.current[i];
      if (!m) return;
      ref.position.y = m.baseY + Math.sin(t * m.freq + m.phase) * 0.07;
    });

    fountainRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const m = fountainMeta.current[i];
      if (!m) return;
      const tp = ((t * 0.9 + m.arcPhase) % 1);
      const arc = Math.sin(tp * Math.PI);
      ref.position.set(
        m.cx + Math.sin(m.arcAngle) * 0.38 * arc,
        0.18 + arc * 0.55,
        m.cz + Math.cos(m.arcAngle) * 0.38 * arc,
      );
    });
  });

  flowerIdx = 0;
  fountainIdx = 0;

  return (
    <group>
      {blocks.map((block, bi) => {
        const cx = block.parkX + block.parkWidth / 2;
        const cz = block.parkZ + block.parkDepth / 2;
        const hasFountain = bi % 2 === 0;
        const flowers = FLOWER_PALETTES[bi % FLOWER_PALETTES.length];
        const trees = TREE_SETS[bi % TREE_SETS.length];

        return (
          <group key={bi}>
            {/* Garden base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, cz]}>
              <planeGeometry args={[3.0, 3.0]} />
              <meshLambertMaterial color="#253a20" />
            </mesh>
            {/* Border */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, cz]}>
              <planeGeometry args={[3.3, 3.3]} />
              <meshLambertMaterial color="#1a2e16" />
            </mesh>

            {/* Flowers */}
            {flowers.map((f, fi) => {
              const thisFlowerIdx = flowerIdx++;
              return (
                <group key={fi} position={[cx + f.x, 0, cz + f.z]}>
                  {/* Stem */}
                  <mesh position={[0, 0.08, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.14, 4]} />
                    <meshLambertMaterial color="#3a6030" />
                  </mesh>
                  {/* Bloom */}
                  <mesh
                    ref={el => { flowerRefs.current[thisFlowerIdx] = el; }}
                    position={[0, 0.16, 0]}
                  >
                    <sphereGeometry args={[0.1, 6, 6]} />
                    <meshLambertMaterial color={f.color} />
                  </mesh>
                </group>
              );
            })}

            {/* Trees */}
            {trees.map((tr, ti) => (
              <group key={ti} position={[cx + tr.x, 0, cz + tr.z]} scale={tr.scale}>
                <mesh position={[0, 0.22, 0]}>
                  <cylinderGeometry args={[0.08, 0.1, 0.42, 6]} />
                  <meshLambertMaterial color="#5c3a1a" />
                </mesh>
                <mesh position={[0, 0.8, 0]}>
                  <coneGeometry args={[0.52, 1.2, 8]} />
                  <meshLambertMaterial color="#1e5c1e" />
                </mesh>
                <mesh position={[0, 1.3, 0]}>
                  <coneGeometry args={[0.36, 0.9, 8]} />
                  <meshLambertMaterial color="#226622" />
                </mesh>
              </group>
            ))}

            {/* Fountain */}
            {hasFountain && (
              <group position={[cx, 0, cz]}>
                {/* Base ring */}
                <mesh position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.52, 0.52, 0.12, 16]} />
                  <meshLambertMaterial color="#7a8898" />
                </mesh>
                {/* Water pool */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.125, 0]}>
                  <circleGeometry args={[0.44, 16]} />
                  <meshStandardMaterial color="#2060a0" transparent opacity={0.65} />
                </mesh>
                {/* Center spout */}
                <mesh position={[0, 0.22, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
                  <meshLambertMaterial color="#8090a0" />
                </mesh>
                {/* Water arc spheres */}
                {ARC_DEFS.map((arc, ai) => {
                  const thisFountainIdx = fountainIdx++;
                  const initT = ai / 6;
                  const initArc = Math.sin(initT * Math.PI);
                  return (
                    <mesh
                      key={ai}
                      ref={el => { fountainRefs.current[thisFountainIdx] = el; }}
                      position={[
                        Math.sin(arc.angle) * 0.38 * initArc,
                        0.18 + initArc * 0.55,
                        Math.cos(arc.angle) * 0.38 * initArc,
                      ]}
                    >
                      <sphereGeometry args={[0.06, 5, 5]} />
                      <meshStandardMaterial color="#80c8ff" transparent opacity={0.8} />
                    </mesh>
                  );
                })}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
