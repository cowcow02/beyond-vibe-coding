// app/lib/cityLayoutGenerator.ts
import type { District } from '../data/city';
import { TILE_SIZE } from './cityLayout';

// ─── Public types ─────────────────────────────────────────────────────────────

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
  level: number;  // road appears when currentLevel >= this
}

export type RoadEdge = 'north' | 'south' | 'east' | 'west';

export interface BuildingSlot {
  buildingId: string;
  x: number;   // world center X
  z: number;   // world center Z
  facing: RoadEdge;
}

export interface BlockLayout {
  districtId: string;
  // Block interior bounds (world units, excluding road half-width)
  x: number; z: number;
  width: number; depth: number;
  roadEdges: RoadEdge[];
  buildingSlots: BuildingSlot[];
  // Interior green space for CityPark
  parkX: number; parkZ: number;
  parkWidth: number; parkDepth: number;
}

export interface GeneratedLayout {
  nodes: RoadNode[];
  segments: GeneratedSegment[];
  blocks: BlockLayout[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROAD_W   = 2.5;
const ROAD_HALF = ROAD_W / 2;
const COLS     = 4;   // 4×4 intersection grid → 3×3 blocks = 9 districts
const ROWS     = 4;
const CELL_W   = 18;  // base world units between columns
const CELL_D   = 16;  // base world units between rows
const JX       = 3;   // horizontal jitter
const JZ       = 2.5; // vertical jitter
const PERIMETER = TILE_SIZE * 1.0; // building strip depth

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

function makePRNG(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateLayout(districts: District[]): GeneratedLayout {
  const rng = makePRNG(Date.now() % 2147483647);

  // ── Intersection grid ──────────────────────────────────────────────────────
  // gx[c] and gz[r] hold the world-space position of each intersection column/row.
  // Small random jitter makes each layout unique.
  const gx = Array.from({ length: COLS }, (_, c) =>
    Math.round((c - (COLS - 1) / 2) * CELL_W + (rng() * 2 - 1) * JX)
  );
  const gz = Array.from({ length: ROWS }, (_, r) =>
    Math.round((r - (ROWS - 1) / 2) * CELL_D + (rng() * 2 - 1) * JZ)
  );

  const grid: RoadNode[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      id: `n_${r}_${c}`,
      x: gx[c],
      z: gz[r],
    }))
  );
  const nodes: RoadNode[] = grid.flat();

  // ── Road segments ──────────────────────────────────────────────────────────
  const segments: GeneratedSegment[] = [];

  // hEdge[r][c] = true if horizontal road exists between grid[r][c] and grid[r][c+1]
  const hEdge: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS - 1).fill(false));
  // vEdge[r][c] = true if vertical road exists between grid[r][c] and grid[r+1][c]
  const vEdge: boolean[][] = Array.from({ length: ROWS - 1 }, () => Array(COLS).fill(false));

  // Horizontal roads — always present (form the main east-west arteries)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      hEdge[r][c] = true;
      segments.push({
        id: `h_${r}_${c}`,
        x1: gx[c], z1: gz[r],
        x2: gx[c + 1], z2: gz[r],
        axis: 'x',
        level: segLevel(r, c, ROWS, COLS),
      });
    }
  }

  // Vertical roads — 80% chance each, but always connect the 2 inner columns
  // of the 2 inner rows to guarantee the central blocks are fully enclosed.
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      const isInnerCore = r >= 1 && r <= 1 && c >= 1 && c <= 2;
      if (isInnerCore || rng() < 0.82) {
        vEdge[r][c] = true;
        segments.push({
          id: `v_${r}_${c}`,
          x1: gx[c], z1: gz[r],
          x2: gx[c], z2: gz[r + 1],
          axis: 'z',
          level: segLevel(r, c, ROWS, COLS),
        });
      }
    }
  }

  // ── Blocks ─────────────────────────────────────────────────────────────────
  // Each cell (r, c) in the 3×3 block grid may become a district block.
  interface RawBlock {
    r: number; c: number;
    x: number; z: number;
    width: number; depth: number;
    roadEdges: RoadEdge[];
    distFromCenter: number;
  }

  const rawBlocks: RawBlock[] = [];
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const roadEdges: RoadEdge[] = [];
      if (hEdge[r][c])     roadEdges.push('north');
      if (hEdge[r + 1][c]) roadEdges.push('south');
      if (vEdge[r][c])     roadEdges.push('west');
      if (vEdge[r][c + 1]) roadEdges.push('east');

      // Interior starts just inside road half-width on road-facing sides
      const bx = gx[c]     + ROAD_HALF + 0.2;
      const bz = gz[r]     + ROAD_HALF + 0.2;
      const bw = gx[c + 1] - gx[c]     - ROAD_W - 0.4;
      const bd = gz[r + 1] - gz[r]     - ROAD_W - 0.4;

      // Distance from center cell (1,1)
      const dr = r - 1, dc = c - 1;
      rawBlocks.push({
        r, c,
        x: bx, z: bz,
        width: Math.max(bw, 4),
        depth: Math.max(bd, 4),
        roadEdges,
        distFromCenter: Math.sqrt(dr * dr + dc * dc),
      });
    }
  }

  // Sort blocks innermost-first; sort districts by appearsAtLevel; zip them.
  rawBlocks.sort((a, b) => a.distFromCenter - b.distFromCenter);
  const sortedDistricts = [...districts].sort((a, b) => a.appearsAtLevel - b.appearsAtLevel);

  const blocks: BlockLayout[] = rawBlocks.slice(0, sortedDistricts.length).map((rb, i) => {
    const district = sortedDistricts[i];

    const parkX     = rb.x + PERIMETER;
    const parkZ     = rb.z + PERIMETER;
    const parkWidth  = Math.max(rb.width  - PERIMETER * 2, 1);
    const parkDepth  = Math.max(rb.depth  - PERIMETER * 2, 1);

    const buildingSlots = placeBuildings(district, rb.x, rb.z, rb.width, rb.depth, rb.roadEdges, rng);

    return {
      districtId: district.id,
      x: rb.x, z: rb.z,
      width: rb.width, depth: rb.depth,
      roadEdges: rb.roadEdges,
      buildingSlots,
      parkX, parkZ, parkWidth, parkDepth,
    };
  });

  return { nodes, segments, blocks };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Determine at what city level a road segment should become visible.
// Roads closer to the grid center appear at lower levels.
function segLevel(r: number, c: number, ROWS: number, COLS: number): number {
  const centerR = (ROWS - 1) / 2;
  const centerC = (COLS - 1) / 2;
  const dist = Math.max(Math.abs(r - centerR), Math.abs(c - centerC));
  if (dist < 0.8) return 0;
  if (dist < 1.3) return 1;
  if (dist < 1.8) return 2;
  return 3;
}

// Place buildings along road-facing perimeter edges of the block.
// Buildings fill edges in order: north → south → east → west.
// Remaining buildings go on non-road edges as needed.
function placeBuildings(
  district: District,
  bx: number, bz: number,
  bw: number, bd: number,
  roadEdges: RoadEdge[],
  rng: () => number,
): BuildingSlot[] {
  const slots: BuildingSlot[] = [];
  const buildings = [...district.buildings];
  const SLOT_SPACING = TILE_SIZE * 1.3;
  const EDGE_INSET   = TILE_SIZE * 0.6; // how far from road edge building sits
  let bi = 0;

  function edge(
    facing: RoadEdge,
    edgeLen: number,
    startX: number, startZ: number,
    horizontal: boolean,
  ) {
    if (bi >= buildings.length) return;
    const count = Math.min(
      Math.max(1, Math.floor(edgeLen / SLOT_SPACING)),
      buildings.length - bi,
    );
    const spacing = edgeLen / (count + 1);
    for (let i = 0; i < count && bi < buildings.length; i++) {
      slots.push({
        buildingId: buildings[bi++].id,
        x: horizontal ? startX + spacing * (i + 1) : startX,
        z: horizontal ? startZ : startZ + spacing * (i + 1),
        facing,
      });
    }
  }

  // Prioritise road-facing edges, then fill remaining buildings on non-road edges
  const priority: RoadEdge[] = ['north', 'south', 'east', 'west'];
  for (const f of priority) {
    if (!roadEdges.includes(f)) continue;
    if (f === 'north') edge('north', bw, bx, bz + EDGE_INSET,        true);
    if (f === 'south') edge('south', bw, bx, bz + bd - EDGE_INSET,   true);
    if (f === 'west')  edge('west',  bd, bx + EDGE_INSET,        bz, false);
    if (f === 'east')  edge('east',  bd, bx + bw - EDGE_INSET,   bz, false);
  }
  return slots;
}
