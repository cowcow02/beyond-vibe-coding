// app/components/RoadSystem.tsx
'use client';

import * as THREE from 'three';
import type { RoadNode, GeneratedSegment } from '../lib/cityLayoutGenerator';

export type { RoadNode, GeneratedSegment };

// RoadSegment is kept for CityTraffic compatibility (it mirrors GeneratedSegment).
export type RoadSegment = GeneratedSegment;

interface Props {
  nodes: RoadNode[];
  segments: GeneratedSegment[];
  activeLevel: number;
}

const ASPHALT   = '#1e2d3d';
const SIDEWALK  = '#2d3f50';
const DASH_COL  = '#c8a020';
const CROSS_COL = '#dde4ec';

const ROAD_W     = 2.5;
const ROAD_HALF  = ROAD_W / 2;        // 1.25
const SIDEWALK_W = 0.4;
const SW_GAP     = ROAD_HALF + SIDEWALK_W / 2;  // 1.45 — center of sidewalk strip
const TRIM       = ROAD_HALF;  // trim sidewalk back this far at junctions

const EPS = 0.01;

// ── Pre-computed corner shapes (4 orientations, created once) ─────────────────
// Each shape fills the outer sidewalk corner at an L-junction or T-junction edge.
// sx/sz ∈ {-1, +1}: sign of the outer corner direction from the node.
//   sx=-1 sz=-1 → NW outer corner  sx=+1 sz=-1 → NE outer corner
//   sx=-1 sz=+1 → SW outer corner  sx=+1 sz=+1 → SE outer corner

function makeCornerShape(sx: number, sz: number): THREE.Shape {
  // sx/sz are in SHAPE space.  rotation={[-π/2,0,0]} maps shape_Y → -world_Z,
  // so sz_shape = -sz_world.  Caller must pass corrected values.
  const R      = ROAD_HALF;
  const outerR = ROAD_HALF + SIDEWALK_W;

  // Shape in XY plane (rotated -π/2 around X to lie flat in XZ).
  // Annular sector: rounded OUTER arc + rounded INNER arc.
  const shape = new THREE.Shape();
  shape.moveTo(sx * outerR, 0);

  // Rounded outer arc: (sx*outerR, 0) → (0, sz*outerR)
  const outerStart = sx < 0 ? Math.PI : 0;
  const outerEnd   = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
  const outerCW    = sx * sz < 0;
  shape.absarc(0, 0, outerR, outerStart, outerEnd, outerCW);

  // Step in to inner arc start
  shape.lineTo(0, sz * R);

  // Rounded inner arc: (0, sz*R) → (sx*R, 0)
  const innerStart = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
  const innerEnd   = sx < 0 ? Math.PI : 0;
  const innerCW    = sx * sz > 0;
  shape.absarc(0, 0, R, innerStart, innerEnd, innerCW);

  shape.closePath(); // line from (sx*R, 0) back to (sx*outerR, 0)
  return shape;
}

// World direction → shape sz is NEGATED (shape_Y = -world_Z after rotation).
// world NW (-X,-Z): shape(-1,+1)   world NE (+X,-Z): shape(+1,+1)
// world SW (-X,+Z): shape(-1,-1)   world SE (+X,+Z): shape(+1,-1)
const CORNER_SHAPES = {
  NW: makeCornerShape(-1, +1),
  NE: makeCornerShape(+1, +1),
  SW: makeCornerShape(-1, -1),
  SE: makeCornerShape(+1, -1),
} as const;

// ── Sidewalk gap-filler helpers ────────────────────────────────────────────────

/** Break a 1-D range into sub-segments that skip ±TRIM around each junction coord. */
function sidewalkChunks(
  rangeMin: number,
  rangeMax: number,
  trimCoords: number[],
): Array<{ center: number; length: number }> {
  const sorted = trimCoords
    .filter(c => c >= rangeMin - EPS && c <= rangeMax + EPS)
    .sort((a, b) => a - b);

  const chunks: Array<{ center: number; length: number }> = [];
  let cursor = rangeMin;

  for (const ic of sorted) {
    const end = ic - TRIM;
    if (end > cursor + 0.05) chunks.push({ center: (cursor + end) / 2, length: end - cursor });
    cursor = ic + TRIM;
  }
  if (cursor < rangeMax - 0.05) chunks.push({ center: (cursor + rangeMax) / 2, length: rangeMax - cursor });
  return chunks;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RoadSystem({ nodes, segments, activeLevel }: Props) {
  const activeSegs = segments.filter(s => s.level <= activeLevel);

  // ── Gather active nodes ────────────────────────────────────────────────────
  const activeNodeIds = new Set<string>();
  for (const seg of activeSegs) {
    for (const n of nodes) {
      if (
        (Math.abs(n.x - seg.x1) < EPS && Math.abs(n.z - seg.z1) < EPS) ||
        (Math.abs(n.x - seg.x2) < EPS && Math.abs(n.z - seg.z2) < EPS)
      ) activeNodeIds.add(n.id);
    }
  }
  const activeNodes = nodes.filter(n => activeNodeIds.has(n.id));

  // ── Per-node degree + directional connectivity ─────────────────────────────
  const nodeDegree = new Map<string, number>();
  type Dirs = { north: boolean; south: boolean; west: boolean; east: boolean };
  const nodeDirs   = new Map<string, Dirs>();

  for (const node of activeNodes) {
    const connected = activeSegs.filter(
      s =>
        (Math.abs(s.x1 - node.x) < EPS && Math.abs(s.z1 - node.z) < EPS) ||
        (Math.abs(s.x2 - node.x) < EPS && Math.abs(s.z2 - node.z) < EPS),
    );
    nodeDegree.set(node.id, connected.length);

    const dirs: Dirs = { north: false, south: false, west: false, east: false };
    for (const s of connected) {
      if (s.axis === 'z') {
        const otherZ = Math.abs(s.z1 - node.z) < EPS ? s.z2 : s.z1;
        if (otherZ < node.z) dirs.north = true; else dirs.south = true;
      } else {
        const otherX = Math.abs(s.x1 - node.x) < EPS ? s.x2 : s.x1;
        if (otherX < node.x) dirs.west = true; else dirs.east = true;
      }
    }
    nodeDirs.set(node.id, dirs);
  }

  const intersectionNodes = activeNodes.filter(n => (nodeDegree.get(n.id) ?? 0) >= 3);
  const leafNodes          = activeNodes.filter(n => (nodeDegree.get(n.id) ?? 0) === 1);
  // Junction nodes that might need corner / bridge pieces
  const junctionNodes      = activeNodes.filter(n => (nodeDegree.get(n.id) ?? 0) >= 2);

  const zAxisSegs = activeSegs.filter(s => s.axis === 'z');
  const xAxisSegs = activeSegs.filter(s => s.axis === 'x');

  return (
    <group>
      {/* ── N-S roads (z-axis) ────────────────────────────────────────────── */}
      {zAxisSegs.map(seg => {
        const { id, x1: x, z1, z2 } = seg;
        const zMin    = Math.min(z1, z2);
        const zMax    = Math.max(z1, z2);
        const length  = zMax - zMin;
        const centerZ = (zMin + zMax) / 2;
        const dashCount = Math.floor(length / 2);

        const junctionZs = activeNodes
          .filter(n => Math.abs(n.x - x) < EPS && n.z >= zMin - EPS && n.z <= zMax + EPS
                    && (nodeDegree.get(n.id) ?? 0) >= 2)
          .map(n => n.z);

        const intZs = intersectionNodes
          .filter(n => Math.abs(n.x - x) < EPS && n.z > zMin + EPS && n.z < zMax - EPS)
          .map(n => n.z);

        const swChunks = sidewalkChunks(zMin, zMax, junctionZs);

        return (
          <group key={id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, centerZ]}>
              <planeGeometry args={[ROAD_W, length]} />
              <meshLambertMaterial color={ASPHALT} />
            </mesh>
            {swChunks.map((c, ci) => (
              <group key={ci}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x - SW_GAP, 0.015, c.center]}>
                  <planeGeometry args={[SIDEWALK_W, c.length]} />
                  <meshLambertMaterial color={SIDEWALK} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + SW_GAP, 0.015, c.center]}>
                  <planeGeometry args={[SIDEWALK_W, c.length]} />
                  <meshLambertMaterial color={SIDEWALK} />
                </mesh>
              </group>
            ))}
            {Array.from({ length: dashCount }, (_, i) => {
              const z = zMin + 1.0 + i * 2.0;
              if (intZs.some(iz => Math.abs(z - iz) < 1.5)) return null;
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

      {/* ── E-W roads (x-axis) ────────────────────────────────────────────── */}
      {xAxisSegs.map(seg => {
        const { id, x1, x2, z1: z } = seg;
        const xMin    = Math.min(x1, x2);
        const xMax    = Math.max(x1, x2);
        const length  = xMax - xMin;
        const centerX = (xMin + xMax) / 2;
        const dashCount = Math.floor(length / 2);

        const junctionXs = activeNodes
          .filter(n => Math.abs(n.z - z) < EPS && n.x >= xMin - EPS && n.x <= xMax + EPS
                    && (nodeDegree.get(n.id) ?? 0) >= 2)
          .map(n => n.x);

        const intXs = intersectionNodes
          .filter(n => Math.abs(n.z - z) < EPS && n.x > xMin + EPS && n.x < xMax - EPS)
          .map(n => n.x);

        const swChunks = sidewalkChunks(xMin, xMax, junctionXs);

        return (
          <group key={id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.01, z]}>
              <planeGeometry args={[length, ROAD_W]} />
              <meshLambertMaterial color={ASPHALT} />
            </mesh>
            {swChunks.map((c, ci) => (
              <group key={ci}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.center, 0.015, z - SW_GAP]}>
                  <planeGeometry args={[c.length, SIDEWALK_W]} />
                  <meshLambertMaterial color={SIDEWALK} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.center, 0.015, z + SW_GAP]}>
                  <planeGeometry args={[c.length, SIDEWALK_W]} />
                  <meshLambertMaterial color={SIDEWALK} />
                </mesh>
              </group>
            ))}
            {Array.from({ length: dashCount }, (_, i) => {
              const x = xMin + 1.0 + i * 2.0;
              if (intXs.some(ix => Math.abs(x - ix) < 1.5)) return null;
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

      {/* ── Junction asphalt fill at every active node ────────────────────── */}
      {activeNodes.map(node => (
        <mesh
          key={`jfill-${node.id}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[node.x, 0.01, node.z]}
        >
          <planeGeometry args={[ROAD_W, ROAD_W]} />
          <meshLambertMaterial color={ASPHALT} />
        </mesh>
      ))}

      {/* ── Rounded termini at leaf nodes (dead-end road caps) ────────────── */}
      {leafNodes.map(node => (
        <group key={`cap-${node.id}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.014, node.z]}>
            <circleGeometry args={[ROAD_HALF + SIDEWALK_W, 24]} />
            <meshLambertMaterial color={SIDEWALK} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.016, node.z]}>
            <circleGeometry args={[ROAD_HALF, 24]} />
            <meshLambertMaterial color={ASPHALT} />
          </mesh>
        </group>
      ))}

      {/* ── Sidewalk corner + bridge pieces at junction nodes ─────────────── */}
      {junctionNodes.map(node => {
        const dirs = nodeDirs.get(node.id)!;
        const hasNS = dirs.north || dirs.south;
        const hasEW = dirs.east  || dirs.west;

        return (
          <group key={`sw-junc-${node.id}`}>

            {/*
              Rounded corner pieces — one per "outer diagonal" where both adjacent
              road directions are absent BUT the crossing sidewalk strips exist.

              Corner NW (sx=-1, sz=-1): outer when roads are S + E (no N, no W)
              Corner NE (sx=+1, sz=-1): outer when roads are S + W (no N, no E)
              Corner SW (sx=-1, sz=+1): outer when roads are N + E (no S, no W)
              Corner SE (sx=+1, sz=+1): outer when roads are N + W (no S, no E)
            */}
            {dirs.south && dirs.east && !dirs.north && !dirs.west && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.015, node.z]}>
                <shapeGeometry args={[CORNER_SHAPES.NW, 10]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}
            {dirs.south && dirs.west && !dirs.north && !dirs.east && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.015, node.z]}>
                <shapeGeometry args={[CORNER_SHAPES.NE, 10]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}
            {dirs.north && dirs.east && !dirs.south && !dirs.west && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.015, node.z]}>
                <shapeGeometry args={[CORNER_SHAPES.SW, 10]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}
            {dirs.north && dirs.west && !dirs.south && !dirs.east && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.015, node.z]}>
                <shapeGeometry args={[CORNER_SHAPES.SE, 10]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}

            {/*
              Bridge strips — fill the sidewalk gap on open sides of T-junctions.

              Open West (no W road, but N-S road exists):
                bridge the left N-S sidewalk gap at x - SW_GAP across the junction width.
              Open East (no E road, but N-S road exists):
                bridge the right N-S sidewalk gap at x + SW_GAP.
              Open North (no N road, but E-W road exists):
                bridge the top E-W sidewalk gap at z - SW_GAP.
              Open South (no S road, but E-W road exists):
                bridge the bottom E-W sidewalk gap at z + SW_GAP.
            */}
            {!dirs.west && hasNS && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x - SW_GAP, 0.015, node.z]}>
                <planeGeometry args={[SIDEWALK_W, ROAD_W]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}
            {!dirs.east && hasNS && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + SW_GAP, 0.015, node.z]}>
                <planeGeometry args={[SIDEWALK_W, ROAD_W]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}
            {!dirs.north && hasEW && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.015, node.z - SW_GAP]}>
                <planeGeometry args={[ROAD_W, SIDEWALK_W]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}
            {!dirs.south && hasEW && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x, 0.015, node.z + SW_GAP]}>
                <planeGeometry args={[ROAD_W, SIDEWALK_W]} />
                <meshLambertMaterial color={SIDEWALK} />
              </mesh>
            )}

          </group>
        );
      })}

      {/* ── Crosswalk stripes — only where a connecting road exists ──────── */}
      {intersectionNodes.map(node => {
        const dirs = nodeDirs.get(node.id)!;
        return (
          <group key={`cross-${node.id}`}>
            {Array.from({ length: 5 }, (_, i) => {
              const offset = -1.0 + i * 0.5;
              return (
                <group key={i}>
                  {dirs.north && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + offset, 0.025, node.z - 1.8]}>
                      <planeGeometry args={[0.32, 0.7]} />
                      <meshBasicMaterial color={CROSS_COL} />
                    </mesh>
                  )}
                  {dirs.south && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + offset, 0.025, node.z + 1.8]}>
                      <planeGeometry args={[0.32, 0.7]} />
                      <meshBasicMaterial color={CROSS_COL} />
                    </mesh>
                  )}
                  {dirs.west && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x - 1.8, 0.025, node.z + offset]}>
                      <planeGeometry args={[0.7, 0.32]} />
                      <meshBasicMaterial color={CROSS_COL} />
                    </mesh>
                  )}
                  {dirs.east && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[node.x + 1.8, 0.025, node.z + offset]}>
                      <planeGeometry args={[0.7, 0.32]} />
                      <meshBasicMaterial color={CROSS_COL} />
                    </mesh>
                  )}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
