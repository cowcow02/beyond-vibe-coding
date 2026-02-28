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

const ROAD_W    = 2.5;
const ROAD_HALF = ROAD_W / 2;
const COLS      = 4;    // 4×4 intersection grid → 3×3 blocks = 9 districts
const ROWS      = 4;
const JX        = 2;    // horizontal jitter (smaller now — blocks are sized to content)
const JZ        = 1.5;  // vertical jitter
const PERIMETER = TILE_SIZE * 1.0;  // building strip depth
const SLOT_SPACING = TILE_SIZE * 1.3; // space between building slots on an edge
const EDGE_INSET   = TILE_SIZE * 0.6; // how far from road edge building sits
const MIN_PARK  = 3;    // minimum interior park dimension

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

// ─── Block size from building count ───────────────────────────────────────────
// Buildings are placed on road-facing perimeter edges; we need at least
// ceil(N/2) slots per main edge so all buildings fit on 2 edges minimum.
// Block width = slots * spacing + side margins. No wasted empty space.

function blockWidthForN(n: number): number {
  const slotsPerEdge = Math.ceil(n / 2);
  return Math.max(slotsPerEdge * SLOT_SPACING + 2 * EDGE_INSET + 2.5, MIN_PARK + 2 * PERIMETER + 1);
}

function blockDepthForN(n: number): number {
  return blockWidthForN(n) * 0.88; // slightly rectangular
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateLayout(districts: District[]): GeneratedLayout {
  const rng = makePRNG(Date.now() % 2147483647);

  // ── Step 0: Assign districts to grid cells by level (center = low, edge = high) ──
  const sortedDistricts = [...districts].sort((a, b) => a.appearsAtLevel - b.appearsAtLevel);

  // All 9 block cells sorted innermost-first (same order as rawBlocks below)
  const blockCellOrder: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    blockCellOrder.push({ r, c });
  }
  blockCellOrder.sort((a, b) => {
    const da = Math.sqrt((a.r - 1) ** 2 + (a.c - 1) ** 2);
    const db = Math.sqrt((b.r - 1) ** 2 + (b.c - 1) ** 2);
    return da - db || a.r - b.r || a.c - b.c;
  });

  // cellDistrict[r][c] = which district occupies that block cell
  const cellDistrict: (District | undefined)[][] = Array.from({ length: 3 }, () => Array(3).fill(undefined));
  blockCellOrder.forEach(({ r, c }, i) => {
    cellDistrict[r][c] = sortedDistricts[i];
  });

  // ── Step 1: Compute grid spacing from building counts ─────────────────────
  // Column c block width = max of the 3 districts in that column
  const colW = [0, 1, 2].map(c =>
    Math.max(...[0, 1, 2].map(r => blockWidthForN(cellDistrict[r][c]?.buildings.length ?? 2)))
  );
  // Row r block depth = max of the 3 districts in that row
  const rowD = [0, 1, 2].map(r =>
    Math.max(...[0, 1, 2].map(c => blockDepthForN(cellDistrict[r][c]?.buildings.length ?? 2)))
  );

  // ── Step 2: Compute intersection positions from block sizes ───────────────
  // Layout: [road0] [block_col0] [road1] [block_col1] [road2] [block_col2] [road3]
  // gx[c] = center of N-S road to the left of block column c.
  // The whole layout is centered at x=0.
  const gxBase: number[] = [
    -(colW[0] + ROAD_W + colW[1] + ROAD_W + colW[2]) / 2,
  ];
  for (let c = 1; c < COLS; c++) gxBase.push(gxBase[c - 1] + colW[c - 1] + ROAD_W);

  const gzBase: number[] = [
    -(rowD[0] + ROAD_W + rowD[1] + ROAD_W + rowD[2]) / 2,
  ];
  for (let r = 1; r < ROWS; r++) gzBase.push(gzBase[r - 1] + rowD[r - 1] + ROAD_W);

  // Add small jitter for organic feel
  const gx = gxBase.map(v => Math.round(v + (rng() * 2 - 1) * JX));
  const gz = gzBase.map(v => Math.round(v + (rng() * 2 - 1) * JZ));

  // ── Step 3: Build intersection nodes ─────────────────────────────────────
  const grid: RoadNode[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      id: `n_${r}_${c}`,
      x: gx[c],
      z: gz[r],
    }))
  );
  const nodes: RoadNode[] = grid.flat();

  // ── Step 4: Road segments ─────────────────────────────────────────────────
  const segments: GeneratedSegment[] = [];

  const hEdge: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS - 1).fill(false));
  const vEdge: boolean[][] = Array.from({ length: ROWS - 1 }, () => Array(COLS).fill(false));

  // Horizontal roads — always present
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

  // Vertical roads — 80% chance, always connect inner core
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

  // ── Step 5: Derive blocks from grid ───────────────────────────────────────
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
      if (hEdge[r][c])      roadEdges.push('north');
      if (hEdge[r + 1][c])  roadEdges.push('south');
      if (vEdge[r][c])      roadEdges.push('west');
      if (vEdge[r][c + 1])  roadEdges.push('east');

      const bx = gx[c]     + ROAD_HALF + 0.2;
      const bz = gz[r]     + ROAD_HALF + 0.2;
      const bw = gx[c + 1] - gx[c]    - ROAD_W - 0.4;
      const bd = gz[r + 1] - gz[r]    - ROAD_W - 0.4;

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

  // Sort innermost-first, zip with districts sorted by appearsAtLevel
  rawBlocks.sort((a, b) => a.distFromCenter - b.distFromCenter || a.r - b.r || a.c - b.c);

  const blocks: BlockLayout[] = rawBlocks.slice(0, sortedDistricts.length).map((rb, i) => {
    const district = sortedDistricts[i];

    const parkX     = rb.x + PERIMETER;
    const parkZ     = rb.z + PERIMETER;
    const parkWidth  = Math.max(rb.width  - PERIMETER * 2, 1);
    const parkDepth  = Math.max(rb.depth  - PERIMETER * 2, 1);

    const buildingSlots = placeBuildings(district, rb.x, rb.z, rb.width, rb.depth, rb.roadEdges);

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

function segLevel(r: number, c: number, ROWS: number, COLS: number): number {
  const centerR = (ROWS - 1) / 2;
  const centerC = (COLS - 1) / 2;
  const dist = Math.max(Math.abs(r - centerR), Math.abs(c - centerC));
  if (dist < 0.8) return 0;
  if (dist < 1.3) return 1;
  if (dist < 1.8) return 2;
  return 3;
}

function placeBuildings(
  district: District,
  bx: number, bz: number,
  bw: number, bd: number,
  roadEdges: RoadEdge[],
): BuildingSlot[] {
  const slots: BuildingSlot[] = [];
  const buildings = [...district.buildings];
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

  // Road-facing edges first, then remaining edges for any leftover buildings
  const allEdges: RoadEdge[] = ['north', 'south', 'east', 'west'];
  const priority = [...roadEdges, ...allEdges.filter(e => !roadEdges.includes(e))];
  for (const f of priority) {
    if (f === 'north') edge('north', bw, bx, bz + EDGE_INSET,       true);
    if (f === 'south') edge('south', bw, bx, bz + bd - EDGE_INSET,  true);
    if (f === 'west')  edge('west',  bd, bx + EDGE_INSET,       bz, false);
    if (f === 'east')  edge('east',  bd, bx + bw - EDGE_INSET,  bz, false);
  }
  return slots;
}
