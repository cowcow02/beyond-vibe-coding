// app/components/RoadSystem.tsx
'use client';

import * as THREE from 'three';

// ── Road segment definitions ──────────────────────────────────────────────
// All coordinates in raw world space (inside CityWorld group offset).
// Used by CityTraffic.tsx for car paths.
export interface RoadSegment {
  id: string;
  x1: number; z1: number;
  x2: number; z2: number;
  axis: 'x' | 'z';
}

export const ROAD_SEGMENTS: RoadSegment[] = [
  // N-S roads (run along Z axis)
  { id: 'ns-16', x1: 16, z1: 4,  x2: 16, z2: 36, axis: 'z' },
  { id: 'ns-30', x1: 30, z1: 4,  x2: 30, z2: 36, axis: 'z' },
  // E-W roads (run along X axis)
  { id: 'ew-14', x1: 4,  z1: 14, x2: 44, z2: 14, axis: 'x' },
  { id: 'ew-26', x1: 4,  z1: 26, x2: 44, z2: 26, axis: 'x' },
];

// Intersections for crosswalks
const INTERSECTIONS = [
  { x: 16, z: 14 }, { x: 30, z: 14 },
  { x: 16, z: 26 }, { x: 30, z: 26 },
];

const ASPHALT  = '#1e2d3d';
const SIDEWALK = '#2d3f50';
const DASH_COL = '#c8a020';
const CROSS_COL = '#dde4ec';

export function RoadSystem() {
  return (
    <group>
      {/* ── N-S road planes at x=16 and x=30 ── */}
      {[16, 30].map(rx => (
        <group key={`ns-${rx}`}>
          {/* Road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rx, 0.01, 20]}>
            <planeGeometry args={[2.8, 32]} />
            <meshLambertMaterial color={ASPHALT} />
          </mesh>
          {/* Sidewalk left */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rx - 1.7, 0.015, 20]}>
            <planeGeometry args={[0.5, 32]} />
            <meshLambertMaterial color={SIDEWALK} />
          </mesh>
          {/* Sidewalk right */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rx + 1.7, 0.015, 20]}>
            <planeGeometry args={[0.5, 32]} />
            <meshLambertMaterial color={SIDEWALK} />
          </mesh>
          {/* Center lane dashes — skip at intersections */}
          {Array.from({ length: 14 }, (_, i) => {
            const z = 4 + 0.9 + i * 2.3;
            // skip if near intersection (z=14 or z=26)
            if (Math.abs(z - 14) < 1.5 || Math.abs(z - 26) < 1.5) return null;
            return (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[rx, 0.02, z]}>
                <planeGeometry args={[0.07, 0.85]} />
                <meshBasicMaterial color={DASH_COL} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* ── E-W road planes at z=14 and z=26 ── */}
      {[14, 26].map(rz => (
        <group key={`ew-${rz}`}>
          {/* Road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, 0.01, rz]}>
            <planeGeometry args={[40, 2.8]} />
            <meshLambertMaterial color={ASPHALT} />
          </mesh>
          {/* Sidewalk top */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, 0.015, rz - 1.7]}>
            <planeGeometry args={[40, 0.5]} />
            <meshLambertMaterial color={SIDEWALK} />
          </mesh>
          {/* Sidewalk bottom */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, 0.015, rz + 1.7]}>
            <planeGeometry args={[40, 0.5]} />
            <meshLambertMaterial color={SIDEWALK} />
          </mesh>
          {/* Center lane dashes — skip at intersections */}
          {Array.from({ length: 18 }, (_, i) => {
            const x = 4 + 0.9 + i * 2.3;
            if (Math.abs(x - 16) < 1.5 || Math.abs(x - 30) < 1.5) return null;
            return (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, rz]}>
                <planeGeometry args={[0.85, 0.07]} />
                <meshBasicMaterial color={DASH_COL} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* ── Crosswalk stripes at each intersection ── */}
      {INTERSECTIONS.map(({ x, z }) => (
        <group key={`cross-${x}-${z}`}>
          {/* 5 stripes in each direction */}
          {Array.from({ length: 5 }, (_, i) => {
            const offset = -1.0 + i * 0.5;
            return (
              <group key={i}>
                {/* Crosses the N-S road (stripes run along X) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + offset, 0.025, z - 1.8]}>
                  <planeGeometry args={[0.32, 0.7]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + offset, 0.025, z + 1.8]}>
                  <planeGeometry args={[0.32, 0.7]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the E-W road (stripes run along Z) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x - 1.8, 0.025, z + offset]}>
                  <planeGeometry args={[0.7, 0.32]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + 1.8, 0.025, z + offset]}>
                  <planeGeometry args={[0.7, 0.32]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
