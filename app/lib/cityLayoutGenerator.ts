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

const ROAD_W      = 2.5;
const ROAD_HALF   = ROAD_W / 2;
const PERIMETER   = TILE_SIZE * 1.0;
const SLOT_SPACING = TILE_SIZE * 1.3;
const EDGE_INSET   = TILE_SIZE * 0.6;
const MIN_PARK    = 3;

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

function blockWidthForN(n: number): number {
  const slotsPerEdge = Math.max(Math.ceil(n / 4), 2);
  return Math.max(slotsPerEdge * SLOT_SPACING + 2 * EDGE_INSET + 2.0, MIN_PARK + 2 * PERIMETER + 1);
}

function blockDepthForN(n: number): number {
  const ratio = 0.78 + (n % 3) * 0.08;
  return blockWidthForN(n) * ratio;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateLayout(districts: District[]): GeneratedLayout {
  const rng = makePRNG(Date.now() % 2147483647);
  const sortedDistricts = [...districts].sort((a, b) => a.appearsAtLevel - b.appearsAtLevel);
  const N = sortedDistricts.length;

  // ── Step 1: Frontier growth placement ─────────────────────────────────────
  // Each district gets a sparse grid cell; later districts spread outward
  // with weakening center-bias for organic L/T/cross shapes.

  type PlacedCell = { r: number; c: number; district: District };
  const placed = new Map<string, PlacedCell>();
  const frontier = new Map<string, { r: number; c: number }>();
  const DIRS: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function cellKey(r: number, c: number) { return `${r},${c}`; }

  function expandFrontier(r: number, c: number) {
    for (const [dr, dc] of DIRS) {
      const k = cellKey(r + dr, c + dc);
      if (!placed.has(k)) frontier.set(k, { r: r + dr, c: c + dc });
    }
  }

  // Place first district at origin
  placed.set(cellKey(0, 0), { r: 0, c: 0, district: sortedDistricts[0] });
  expandFrontier(0, 0);

  for (let i = 1; i < N; i++) {
    // bias decreases as we place later districts → more spread-out
    const bias = 1.6 - (i / (N - 1)) * 1.0;
    const cells = Array.from(frontier.values());
    const weights = cells.map(({ r, c }) => Math.exp(-Math.sqrt(r * r + c * c) * bias));
    const totalW = weights.reduce((s, w) => s + w, 0);

    let rand = rng() * totalW;
    let chosen = cells[0];
    for (let j = 0; j < cells.length; j++) {
      rand -= weights[j];
      if (rand <= 0) { chosen = cells[j]; break; }
    }

    const k = cellKey(chosen.r, chosen.c);
    placed.set(k, { r: chosen.r, c: chosen.c, district: sortedDistricts[i] });
    frontier.delete(k);
    expandFrontier(chosen.r, chosen.c);
  }

  // ── Step 2: Dense index mapping + boundary arrays ──────────────────────────

  const allRows = [...new Set([...placed.values()].map(p => p.r))].sort((a, b) => a - b);
  const allCols = [...new Set([...placed.values()].map(p => p.c))].sort((a, b) => a - b);
  const NR = allRows.length;
  const NC = allCols.length;
  const rowIdx = new Map(allRows.map((r, i) => [r, i]));
  const colIdx = new Map(allCols.map((c, i) => [c, i]));

  // Per column/row max block size
  const colW: number[] = Array(NC).fill(0);
  const rowD: number[] = Array(NR).fill(0);
  for (const { r, c, district } of placed.values()) {
    const ci = colIdx.get(c)!;
    const ri = rowIdx.get(r)!;
    const n = district.buildings.length;
    colW[ci] = Math.max(colW[ci], blockWidthForN(n));
    rowD[ri] = Math.max(rowD[ri], blockDepthForN(n));
  }

  // Boundary arrays: gxB[ci] = x of west road of column ci
  //                 gxB[ci+1] = x of east road of column ci
  const totalWidth = colW.reduce((s, w) => s + w, 0) + (NC + 1) * ROAD_W;
  const totalDepth = rowD.reduce((s, d) => s + d, 0) + (NR + 1) * ROAD_W;

  const gxB: number[] = [-totalWidth / 2];
  for (let ci = 0; ci < NC; ci++) gxB.push(gxB[ci] + ROAD_W + colW[ci]);

  const gzB: number[] = [-totalDepth / 2];
  for (let ri = 0; ri < NR; ri++) gzB.push(gzB[ri] + ROAD_W + rowD[ri]);

  // ── Step 3: Roads derived from placed district positions ───────────────────
  // Each placed district emits the 4 roads that surround it.
  // Key format: h_<ri>_<ci> = horizontal road at row boundary ri, block column ci
  //             v_<ci>_<ri> = vertical road at col boundary ci, block row ri

  // Map from road key → min appearsAtLevel of all adjacent districts
  const hRoadLevel = new Map<string, number>(); // top/bottom edges
  const vRoadLevel = new Map<string, number>(); // left/right edges

  function updateRoadLevel(map: Map<string, number>, key: string, level: number) {
    map.set(key, Math.min(map.get(key) ?? Infinity, level));
  }

  for (const { r, c, district } of placed.values()) {
    const ri = rowIdx.get(r)!;
    const ci = colIdx.get(c)!;
    const lv = district.appearsAtLevel;
    updateRoadLevel(hRoadLevel, `${ri}_${ci}`,   lv); // north road
    updateRoadLevel(hRoadLevel, `${ri+1}_${ci}`, lv); // south road
    updateRoadLevel(vRoadLevel, `${ci}_${ri}`,   lv); // west road
    updateRoadLevel(vRoadLevel, `${ci+1}_${ri}`, lv); // east road
  }

  // ── Step 4: Build nodes + segments ────────────────────────────────────────
  // Nodes at every (ci, ri) corner of placed districts' bounding roads.
  // Collect needed node coords.

  const nodeSet = new Map<string, RoadNode>();
  function getNode(ci_b: number, ri_b: number): RoadNode {
    const k = `${ci_b},${ri_b}`;
    if (!nodeSet.has(k)) {
      nodeSet.set(k, {
        id: `n_${ri_b}_${ci_b}`,
        x: gxB[ci_b],
        z: gzB[ri_b],
      });
    }
    return nodeSet.get(k)!;
  }

  const segments: GeneratedSegment[] = [];

  // Horizontal road segments (constant z, varying x along a column)
  for (const [key, level] of hRoadLevel.entries()) {
    const [riStr, ciStr] = key.split('_');
    const ri_b = parseInt(riStr); // boundary index (0..NR)
    const ci   = parseInt(ciStr); // column index (0..NC-1)
    const z = gzB[ri_b];
    segments.push({
      id: `h_${ri_b}_${ci}`,
      x1: gxB[ci], z1: z,
      x2: gxB[ci + 1], z2: z,
      axis: 'x',
      level,
    });
    getNode(ci, ri_b);
    getNode(ci + 1, ri_b);
  }

  // Vertical road segments (constant x, varying z along a row)
  for (const [key, level] of vRoadLevel.entries()) {
    const [ciStr, riStr] = key.split('_');
    const ci_b = parseInt(ciStr); // boundary index (0..NC)
    const ri   = parseInt(riStr); // row index (0..NR-1)
    const x = gxB[ci_b];
    segments.push({
      id: `v_${ci_b}_${ri}`,
      x1: x, z1: gzB[ri],
      x2: x, z2: gzB[ri + 1],
      axis: 'z',
      level,
    });
    getNode(ci_b, ri);
    getNode(ci_b, ri + 1);
  }

  const nodes: RoadNode[] = Array.from(nodeSet.values());

  // ── Step 5: Build blocks ───────────────────────────────────────────────────

  const blocks: BlockLayout[] = [];

  for (const { r, c, district } of placed.values()) {
    const ri = rowIdx.get(r)!;
    const ci = colIdx.get(c)!;

    // Block bounds (interior, excluding road half-width)
    const bx = gxB[ci]     + ROAD_HALF + 0.2;
    const bz = gzB[ri]     + ROAD_HALF + 0.2;
    const bw = gxB[ci + 1] - gxB[ci]  - ROAD_W - 0.4;
    const bd = gzB[ri + 1] - gzB[ri]  - ROAD_W - 0.4;

    // All four edges always have roads (roads completely surround every district)
    const roadEdges: RoadEdge[] = ['north', 'south', 'east', 'west'];

    const parkX     = bx + PERIMETER;
    const parkZ     = bz + PERIMETER;
    const parkWidth  = Math.max(bw - PERIMETER * 2, 1);
    const parkDepth  = Math.max(bd - PERIMETER * 2, 1);

    const buildingSlots = placeBuildings(district, bx, bz, Math.max(bw, 4), Math.max(bd, 4), roadEdges, rng);

    blocks.push({
      districtId: district.id,
      x: bx, z: bz,
      width: Math.max(bw, 4), depth: Math.max(bd, 4),
      roadEdges,
      buildingSlots,
      parkX, parkZ, parkWidth, parkDepth,
    });
  }

  return { nodes, segments, blocks };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function placeBuildings(
  district: District,
  bx: number, bz: number,
  bw: number, bd: number,
  roadEdges: RoadEdge[],
  rng: () => number,
): BuildingSlot[] {
  const buildings = [...district.buildings];
  const n = buildings.length;
  if (n === 0) return [];

  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [buildings[i], buildings[j]] = [buildings[j], buildings[i]];
  }

  // Weighted random edge assignment: road-facing edges get 3× weight
  const allEdges: RoadEdge[] = ['north', 'south', 'east', 'west'];
  const weights = allEdges.map(e => roadEdges.includes(e) ? 3 : 1);
  const totalW  = weights.reduce((s, w) => s + w, 0);

  const buckets: Record<RoadEdge, typeof buildings> = { north: [], south: [], east: [], west: [] };
  for (const b of buildings) {
    let r = rng() * totalW;
    let chosen: RoadEdge = allEdges[0];
    for (let i = 0; i < allEdges.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = allEdges[i]; break; }
    }
    buckets[chosen].push(b);
  }

  const slots: BuildingSlot[] = [];

  function placeEdge(facing: RoadEdge, bs: typeof buildings) {
    if (bs.length === 0) return;
    const isH     = facing === 'north' || facing === 'south';
    const edgeLen = isH ? bw : bd;
    const zoneLen = edgeLen / (bs.length + 1);

    bs.forEach((building, i) => {
      // Reduced jitter: ±18% of zone size (was ±35%)
      const along = zoneLen * (i + 1) + (rng() - 0.5) * zoneLen * 0.36;
      const inset = EDGE_INSET * (0.75 + rng() * 0.5);

      let x: number, z: number;
      switch (facing) {
        case 'north': x = bx + along;        z = bz + inset;          break;
        case 'south': x = bx + along;        z = bz + bd - inset;     break;
        case 'west':  x = bx + inset;        z = bz + along;          break;
        default:      x = bx + bw - inset;   z = bz + along;          break; // east
      }
      x = Math.max(bx + 0.5, Math.min(bx + bw - 0.5, x));
      z = Math.max(bz + 0.5, Math.min(bz + bd - 0.5, z));
      slots.push({ buildingId: building.id, x, z, facing });
    });
  }

  for (const e of allEdges) placeEdge(e, buckets[e]);

  // ── Overlap nudge pass: push apart buildings that are too close ────────────
  const MIN_DIST = SLOT_SPACING * 0.65;
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < slots.length; a++) {
      for (let b = a + 1; b < slots.length; b++) {
        const dx = slots[b].x - slots[a].x;
        const dz = slots[b].z - slots[a].z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < MIN_DIST && dist > 0.001) {
          const overlap = MIN_DIST - dist;
          const nx = dx / dist, nz = dz / dist;
          slots[a].x -= nx * overlap * 0.5;
          slots[a].z -= nz * overlap * 0.5;
          slots[b].x += nx * overlap * 0.5;
          slots[b].z += nz * overlap * 0.5;
          // Re-clamp to block bounds
          slots[a].x = Math.max(bx + 0.5, Math.min(bx + bw - 0.5, slots[a].x));
          slots[a].z = Math.max(bz + 0.5, Math.min(bz + bd - 0.5, slots[a].z));
          slots[b].x = Math.max(bx + 0.5, Math.min(bx + bw - 0.5, slots[b].x));
          slots[b].z = Math.max(bz + 0.5, Math.min(bz + bd - 0.5, slots[b].z));
        }
      }
    }
  }

  return slots;
}
