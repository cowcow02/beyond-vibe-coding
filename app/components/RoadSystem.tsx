// app/components/RoadSystem.tsx
'use client';

// Types imported from the layout generator.
// If cityLayoutGenerator.ts doesn't exist yet (parallel task),
// we define them inline so TypeScript compiles cleanly.
// Once Task 1 is committed these can be replaced with:
//   import type { RoadNode, GeneratedSegment } from '../lib/cityLayoutGenerator';
export interface RoadNode {
  id: string;
  x: number;
  z: number;
}

export interface GeneratedSegment {
  id: string;
  x1: number; z1: number;
  x2: number; z2: number;
  axis: 'x' | 'z';
  level: number;
}

// RoadSegment is kept for CityTraffic compatibility (it mirrors GeneratedSegment).
export interface RoadSegment {
  id: string;
  x1: number; z1: number;
  x2: number; z2: number;
  axis: 'x' | 'z';
  level: number;
}

interface Props {
  nodes: RoadNode[];
  segments: GeneratedSegment[];
  activeLevel: number;
}

const ASPHALT  = '#1e2d3d';
const SIDEWALK = '#2d3f50';
const DASH_COL = '#c8a020';
const CROSS_COL = '#dde4ec';

const ROAD_W     = 2.5;
const SIDEWALK_W = 0.4;

export function RoadSystem({ nodes, segments, activeLevel }: Props) {
  // ── Filter to only segments visible at this level ──────────────────────────
  const activeSegs = segments.filter(s => s.level <= activeLevel);

  // ── Determine which nodes are active (touched by at least one active seg) ──
  const activeNodeIds = new Set(
    activeSegs.flatMap(s =>
      nodes
        .filter(n => (n.x === s.x1 && n.z === s.z1) || (n.x === s.x2 && n.z === s.z2))
        .map(n => n.id)
    )
  );
  const activeNodes = nodes.filter(n => activeNodeIds.has(n.id));

  // ── Determine intersection nodes (≥ 3 active segments connect) ─────────────
  const nodeDegree = new Map<string, number>();
  for (const node of activeNodes) {
    const degree = activeSegs.filter(
      s => (s.x1 === node.x && s.z1 === node.z) || (s.x2 === node.x && s.z2 === node.z)
    ).length;
    nodeDegree.set(node.id, degree);
  }
  const intersectionNodes = activeNodes.filter(n => (nodeDegree.get(n.id) ?? 0) >= 3);

  // ── Split active segments by axis for geometry rendering ──────────────────
  const zAxisSegs = activeSegs.filter(s => s.axis === 'z'); // N-S roads
  const xAxisSegs = activeSegs.filter(s => s.axis === 'x'); // E-W roads

  return (
    <group>
      {/* ── N-S roads (axis === 'z') ── */}
      {zAxisSegs.map(seg => {
        const { id, x1: x, z1, z2 } = seg;
        const length = Math.abs(z2 - z1);
        const zMin = Math.min(z1, z2);
        const centerZ = (z1 + z2) / 2;
        const dashCount = Math.floor(length / 2);

        // Collect intersection Z values along this segment's X
        const intersectionZs = intersectionNodes
          .filter(n => n.x === x && n.z > zMin && n.z < zMin + length)
          .map(n => n.z);

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
              const z = zMin + 1.0 + i * 2.0;
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

      {/* ── E-W roads (axis === 'x') ── */}
      {xAxisSegs.map(seg => {
        const { id, x1, x2, z1: z } = seg;
        const length = Math.abs(x2 - x1);
        const xMin = Math.min(x1, x2);
        const centerX = (x1 + x2) / 2;
        const dashCount = Math.floor(length / 2);

        // Collect intersection X values along this segment's Z
        const intersectionXs = intersectionNodes
          .filter(n => n.z === z && n.x > xMin && n.x < xMin + length)
          .map(n => n.x);

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
              const x = xMin + 1.0 + i * 2.0;
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

      {/* ── Corner fill patch at every active node ── */}
      {activeNodes.map(node => (
        <mesh
          key={`corner-${node.id}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[node.x, 0.001, node.z]}
        >
          <planeGeometry args={[ROAD_W, ROAD_W]} />
          <meshLambertMaterial color={ASPHALT} />
        </mesh>
      ))}

      {/* ── Crosswalk stripes at intersection nodes (≥ 3 segments) ── */}
      {intersectionNodes.map(node => (
        <group key={`cross-${node.id}`}>
          {Array.from({ length: 5 }, (_, i) => {
            const offset = -1.0 + i * 0.5;
            return (
              <group key={i}>
                {/* Crosses the N-S road — stripes on the northern side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + offset, 0.025, node.z - 1.8]}>
                  <planeGeometry args={[0.32, 0.7]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the N-S road — stripes on the southern side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + offset, 0.025, node.z + 1.8]}>
                  <planeGeometry args={[0.32, 0.7]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the E-W road — stripes on the western side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x - 1.8, 0.025, node.z + offset]}>
                  <planeGeometry args={[0.7, 0.32]} />
                  <meshBasicMaterial color={CROSS_COL} />
                </mesh>
                {/* Crosses the E-W road — stripes on the eastern side */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + 1.8, 0.025, node.z + offset]}>
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
