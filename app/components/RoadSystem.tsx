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
  { id: 'ns-24', x1: 24, z1: 2,  x2: 24, z2: 44, axis: 'z' },
  { id: 'ns-40', x1: 40, z1: 2,  x2: 40, z2: 28, axis: 'z' },
  { id: 'ns-32', x1: 32, z1: 30, x2: 32, z2: 44, axis: 'z' },
  { id: 'ew-16', x1: 4,  z1: 16, x2: 52, z2: 16, axis: 'x' },
  { id: 'ew-30', x1: 4,  z1: 30, x2: 44, z2: 30, axis: 'x' },
];

// Intersections for crosswalks
const INTERSECTIONS = [
  { x: 24, z: 16 },
  { x: 40, z: 16 },
  { x: 24, z: 30 },
  { x: 32, z: 30 },
];

const ASPHALT   = '#1e2d3d';
const SIDEWALK  = '#2d3f50';
const DASH_COL  = '#c8a020';
const CROSS_COL = '#dde4ec';

const ROAD_W = 2.5;
const SIDEWALK_W = 0.4;

// N-S roads: each entry defines the road centerline x and z extent
interface NSRoad {
  id: string;
  x: number;
  z1: number;
  z2: number;
  intersectionZs: number[];
}

const NS_ROADS: NSRoad[] = [
  { id: 'ns-24', x: 24, z1: 2,  z2: 44, intersectionZs: [16, 30] },
  { id: 'ns-40', x: 40, z1: 2,  z2: 28, intersectionZs: [16] },
  { id: 'ns-32', x: 32, z1: 30, z2: 44, intersectionZs: [30] },
];

// E-W roads: each entry defines the road centerline z and x extent
interface EWRoad {
  id: string;
  z: number;
  x1: number;
  x2: number;
  intersectionXs: number[];
}

const EW_ROADS: EWRoad[] = [
  { id: 'ew-16', z: 16, x1: 4,  x2: 52, intersectionXs: [24, 40] },
  { id: 'ew-30', z: 30, x1: 4,  x2: 44, intersectionXs: [24, 32] },
];

export function RoadSystem() {
  return (
    <group>
      {/* ── N-S roads ── */}
      {NS_ROADS.map(({ id, x, z1, z2, intersectionZs }) => {
        const length = z2 - z1;
        const centerZ = (z1 + z2) / 2;
        const dashCount = Math.floor(length / 2);

        return (
          <group key={id}>
            {/* Road surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, centerZ]}>
              <planeGeometry args={[ROAD_W, length]} />
              <meshLambertMaterial color={ASPHALT} />
            </mesh>
            {/* Sidewalk left (negative X side) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x - ROAD_W / 2 - SIDEWALK_W / 2, 0.015, centerZ]}>
              <planeGeometry args={[SIDEWALK_W, length]} />
              <meshLambertMaterial color={SIDEWALK} />
            </mesh>
            {/* Sidewalk right (positive X side) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + ROAD_W / 2 + SIDEWALK_W / 2, 0.015, centerZ]}>
              <planeGeometry args={[SIDEWALK_W, length]} />
              <meshLambertMaterial color={SIDEWALK} />
            </mesh>
            {/* Center lane dashes — skip near intersections */}
            {Array.from({ length: dashCount }, (_, i) => {
              const z = z1 + 1.0 + i * 2.0;
              const nearIntersection = intersectionZs.some(iz => Math.abs(z - iz) < 1.5);
              if (nearIntersection) return null;
              return (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
                  <planeGeometry args={[0.07, 0.85]} />
                  <meshBasicMaterial color={DASH_COL} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* ── E-W roads ── */}
      {EW_ROADS.map(({ id, z, x1, x2, intersectionXs }) => {
        const length = x2 - x1;
        const centerX = (x1 + x2) / 2;
        const dashCount = Math.floor(length / 2);

        return (
          <group key={id}>
            {/* Road surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.01, z]}>
              <planeGeometry args={[length, ROAD_W]} />
              <meshLambertMaterial color={ASPHALT} />
            </mesh>
            {/* Sidewalk top (negative Z side) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.015, z - ROAD_W / 2 - SIDEWALK_W / 2]}>
              <planeGeometry args={[length, SIDEWALK_W]} />
              <meshLambertMaterial color={SIDEWALK} />
            </mesh>
            {/* Sidewalk bottom (positive Z side) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.015, z + ROAD_W / 2 + SIDEWALK_W / 2]}>
              <planeGeometry args={[length, SIDEWALK_W]} />
              <meshLambertMaterial color={SIDEWALK} />
            </mesh>
            {/* Center lane dashes — skip near intersections */}
            {Array.from({ length: dashCount }, (_, i) => {
              const x = x1 + 1.0 + i * 2.0;
              const nearIntersection = intersectionXs.some(ix => Math.abs(x - ix) < 1.5);
              if (nearIntersection) return null;
              return (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
                  <planeGeometry args={[0.85, 0.07]} />
                  <meshBasicMaterial color={DASH_COL} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* ── Crosswalk stripes at each intersection ── */}
      {INTERSECTIONS.map(({ x, z }) => (
        <group key={`cross-${x}-${z}`}>
          {Array.from({ length: 5 }, (_, i) => {
            const offset = -1.0 + i * 0.5;
            return (
              <group key={i}>
                {/* Crosses the N-S road — stripes on the northern side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + offset, 0.025, z - 1.8]}>
                  <planeGeometry args={[0.32, 0.7]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the N-S road — stripes on the southern side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + offset, 0.025, z + 1.8]}>
                  <planeGeometry args={[0.32, 0.7]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the E-W road — stripes on the western side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x - 1.8, 0.025, z + offset]}>
                  <planeGeometry args={[0.7, 0.32]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the E-W road — stripes on the eastern side */}
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
