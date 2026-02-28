// app/components/CityPark.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

interface ParkDef {
  cx: number; cz: number;  // center of garden patch
  flowers: FlowerDef[];
  trees: { x: number; z: number; scale: number }[];
  fountain: { x: number; z: number } | null;
}

// Garden patch centers — placed INSIDE each district interior, away from roads
const PARKS: ParkDef[] = [
  // Frontend interior courtyard (district x:6-22, z:4-14 → center ~14,9)
  {
    cx: 14, cz: 8,
    flowers: [
      { x: -0.5, z:  0.3, color: '#ff6b8a', freq: 2.1, phase: 0.0 },
      { x:  0.3, z: -0.4, color: '#ffb347', freq: 1.7, phase: 1.2 },
      { x: -0.2, z: -0.6, color: '#7ec8e3', freq: 2.5, phase: 2.4 },
      { x:  0.6, z:  0.2, color: '#b8f5a0', freq: 1.9, phase: 0.8 },
      { x: -0.6, z:  0.6, color: '#ffd700', freq: 2.3, phase: 3.1 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.9, z: -0.2, scale: 0.6 }],
    fountain: { x: 0, z: 0 },
  },
  // Backend interior (district x:26-38, z:4-14 → center ~32,9)
  {
    cx: 31, cz: 9,
    flowers: [
      { x: -0.4, z: 0.2,  color: '#34d399', freq: 1.8, phase: 0.5 },
      { x:  0.4, z: -0.3, color: '#6ee7b7', freq: 2.2, phase: 1.8 },
      { x: -0.2, z: -0.5, color: '#a7f3d0', freq: 2.0, phase: 3.0 },
    ],
    trees: [{ x: 0.7, z: 0.7, scale: 0.65 }],
    fountain: null,
  },
  // SystemDesign interior (district x:42-52, z:2-14 → center ~47,8)
  {
    cx: 47, cz: 8,
    flowers: [
      { x: -0.4, z: 0.4,  color: '#38bdf8', freq: 2.2, phase: 0.6 },
      { x:  0.4, z: -0.3, color: '#7dd3fc', freq: 1.7, phase: 1.9 },
      { x: -0.3, z: -0.5, color: '#bae6fd', freq: 2.0, phase: 3.2 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.8, z: -0.3, scale: 0.6 }],
    fountain: { x: 0, z: 0 },
  },
  // Databases interior (district x:4-18, z:18-28 → center ~11,23)
  {
    cx: 10, cz: 23,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#a78bfa', freq: 2.4, phase: 0.3 },
      { x:  0.3, z: -0.5, color: '#c4b5fd', freq: 1.6, phase: 1.5 },
      { x:  0.5, z:  0.5, color: '#ddd6fe', freq: 2.0, phase: 2.7 },
      { x: -0.3, z: -0.2, color: '#7c3aed', freq: 1.9, phase: 0.9 },
    ],
    trees: [{ x: 0.8, z: -0.8, scale: 0.7 }, { x: -0.8, z: 0.8, scale: 0.6 }],
    fountain: null,
  },
  // DevOps interior (district x:26-38, z:18-28 → center ~32,23)
  {
    cx: 31, cz: 23,
    flowers: [
      { x: -0.4, z: 0.3,  color: '#fb923c', freq: 2.0, phase: 0.7 },
      { x:  0.4, z: -0.4, color: '#fed7aa', freq: 1.8, phase: 2.0 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.65 }],
    fountain: { x: 0, z: 0 },
  },
  // Performance interior (district x:42-52, z:18-26 → center ~47,22)
  {
    cx: 47, cz: 22,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#fbbf24', freq: 2.3, phase: 0.2 },
      { x:  0.4, z: -0.4, color: '#fde68a', freq: 1.8, phase: 1.4 },
    ],
    trees: [{ x: 0.7, z: 0.7, scale: 0.65 }],
    fountain: null,
  },
  // Testing interior (district x:4-16, z:32-40 → center ~10,36)
  {
    cx: 9, cz: 36,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#f472b6', freq: 2.1, phase: 1.1 },
      { x:  0.3, z: -0.4, color: '#fbcfe8', freq: 1.9, phase: 2.3 },
      { x:  0.5, z:  0.4, color: '#fce7f3', freq: 2.3, phase: 0.4 },
    ],
    trees: [{ x: 0.8, z: -0.8, scale: 0.7 }],
    fountain: null,
  },
  // Security interior (district x:20-30, z:30-40 → center ~25,35)
  {
    cx: 25, cz: 35,
    flowers: [
      { x: -0.5, z: 0.4,  color: '#e879f9', freq: 2.0, phase: 0.8 },
      { x:  0.4, z: -0.4, color: '#f0abfc', freq: 1.7, phase: 2.1 },
      { x: -0.2, z: -0.6, color: '#fae8ff', freq: 2.4, phase: 3.4 },
      { x:  0.6, z:  0.3, color: '#d946ef', freq: 1.9, phase: 1.0 },
    ],
    trees: [{ x: 0.9, z: 0.9, scale: 0.75 }, { x: -0.9, z: 0.2, scale: 0.65 }],
    fountain: { x: 0, z: 0 },
  },
  // Leadership interior (district x:34-48, z:36-44 → center ~41,40)
  {
    cx: 41, cz: 40,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#fbbf24', freq: 2.3, phase: 0.2 },
      { x:  0.4, z: -0.4, color: '#fde68a', freq: 1.8, phase: 1.4 },
      { x: -0.2, z: -0.5, color: '#fef3c7', freq: 2.1, phase: 2.6 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.8, z: -0.3, scale: 0.6 }],
    fountain: null,
  },
];

// Fountain arc definitions (6 arcs per fountain)
const ARC_DEFS: FountainArc[] = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * Math.PI * 2,
  phaseOffset: i / 6,
}));

export function CityPark() {
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
    PARKS.forEach(park => {
      park.flowers.forEach(f => {
        flowerMeta.current.push({ baseY: 0.16, freq: f.freq, phase: f.phase });
      });
      if (park.fountain) {
        ARC_DEFS.forEach(arc => {
          fountainMeta.current.push({
            cx: park.cx + park.fountain!.x,
            cz: park.cz + park.fountain!.z,
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
      {PARKS.map((park, pi) => (
        <group key={pi}>
          {/* Garden base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[park.cx, 0.02, park.cz]}>
            <planeGeometry args={[3.0, 3.0]} />
            <meshLambertMaterial color="#253a20" />
          </mesh>
          {/* Border */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[park.cx, 0.01, park.cz]}>
            <planeGeometry args={[3.3, 3.3]} />
            <meshLambertMaterial color="#1a2e16" />
          </mesh>

          {/* Flowers */}
          {park.flowers.map((f, fi) => {
            const thisFlowerIdx = flowerIdx++;
            return (
              <group key={fi} position={[park.cx + f.x, 0, park.cz + f.z]}>
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
          {park.trees.map((tr, ti) => (
            <group key={ti} position={[park.cx + tr.x, 0, park.cz + tr.z]} scale={tr.scale}>
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
          {park.fountain && (
            <group position={[park.cx + park.fountain.x, 0, park.cz + park.fountain.z]}>
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
      ))}
    </group>
  );
}
