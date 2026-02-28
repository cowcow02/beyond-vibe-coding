# Procedural City Layout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded district positions and road segments with a procedural generator that produces a unique connected city on every page load, with buildings placed on block perimeters facing roads.

**Architecture:** A 3×3 jittered intersection grid generates 9 city blocks. Each block becomes one district. Buildings line perimeter edges facing roads. Roads grow with level. Corner fills at intersections complete the visual road turns.

**Tech Stack:** TypeScript, React Three Fiber, Three.js, Next.js 15. Working directory: `/Users/cowcow02/Repo/beyond-vibe-coding`. Branch: `feat/three-js-city`. Dev server: `npm run dev`. TypeScript check: `npx tsc --noEmit`.

---

## Execution Plan

**Phase 1 (Tasks 1–6) — run ALL in parallel.**
**Phase 2 (Task 7) — run after Phase 1 is complete.**

---

## Task 1: Create `app/lib/cityLayoutGenerator.ts`

**Files:**
- Create: `app/lib/cityLayoutGenerator.ts`

This is the core generator. It takes the `districts` array and returns a `GeneratedLayout` containing road nodes, road segments, and block layouts (one per district).

**Full implementation:**

```typescript
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
```

**After writing:** Run `npx tsc --noEmit` — must produce no output (no errors).

**Commit:**
```bash
git add app/lib/cityLayoutGenerator.ts
git commit -m "feat: procedural city layout generator — jittered grid, blocks, building slots"
```

---

## Task 2: Update `app/components/RoadSystem.tsx`

**Files:**
- Modify: `app/components/RoadSystem.tsx`

**Goal:** Remove all hardcoded `ROAD_SEGMENTS` and `INTERSECTIONS` constants. Accept `nodes`, `segments`, and `activeLevel` as props. Add corner fill geometry at each node so road turns look visually complete.

**New component signature:**
```typescript
import type { RoadNode, GeneratedSegment } from '../lib/cityLayoutGenerator';

interface Props {
  nodes: RoadNode[];
  segments: GeneratedSegment[];
  activeLevel: number;
}

export function RoadSystem({ nodes, segments, activeLevel }: Props)
```

**Remove from the file:**
- The `export const ROAD_SEGMENTS` array (CityTraffic will receive segments as a prop in Task 5)
- The `INTERSECTIONS` constant
- The `NS_ROADS` and `EW_ROADS` typed descriptor arrays
- The `NSRoad` and `EWRoad` interfaces

**Keep unchanged:**
- All geometry constants: `ASPHALT`, `SIDEWALK`, `DASH_COL`, `CROSS_COL`, `ROAD_W`, `SIDEWALK_W`
- The `RoadSegment` interface export (CityTraffic still uses it — just add `level: number` to it)
- Dash and crosswalk geometry generation logic (just adapt it to use the new prop arrays)

**Filter active segments:**
```typescript
const activeSegs = segments.filter(s => s.level <= activeLevel);
const activeNodeIds = new Set(
  activeSegs.flatMap(s => {
    // Find which nodes this segment connects
    return nodes
      .filter(n => (n.x === s.x1 && n.z === s.z1) || (n.x === s.x2 && n.z === s.z2))
      .map(n => n.id);
  })
);
const activeNodes = nodes.filter(n => activeNodeIds.has(n.id));
```

**Corner fills — add inside the JSX return, after the road segments:**
```tsx
{/* Corner fill patch at every active intersection node */}
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
```

**Crosswalk detection:** A node is a "4-way intersection" if it has ≥ 3 active connecting segments. Only render crosswalk stripes at those nodes.

**After changes:** Run `npx tsc --noEmit` — no errors.

**Commit:**
```bash
git add app/components/RoadSystem.tsx
git commit -m "feat: RoadSystem accepts generated segments/nodes props, adds corner fills"
```

---

## Task 3: Update `app/components/CityBuilding.tsx`

**Files:**
- Modify: `app/components/CityBuilding.tsx`

**Goal:** Accept optional `worldX`, `worldZ`, and `facing` props. When `worldX`/`worldZ` are provided, use them instead of the tile-based position calculation. Rotate the building group so the lobby faces the road.

**Add to the `Props` interface (after existing props):**
```typescript
worldX?: number;   // direct world position override from layout generator
worldZ?: number;
facing?: 'north' | 'south' | 'east' | 'west';
```

**Position logic** — replace the existing position destructuring at the top of the component:
```typescript
// Old:
const [wx, wz] = tileToWorld(
  district.originCol + building.col,
  district.originRow + building.row,
);

// New:
const [tileX, tileZ] = tileToWorld(
  district.originCol + building.col,
  district.originRow + building.row,
);
const wx = worldX ?? tileX;
const wz = worldZ ?? tileZ;
```

**Facing rotation** — add before the return statement:
```typescript
const facingRotationY: Record<string, number> = {
  north: Math.PI,        // lobby faces toward -Z (north road)
  south: 0,              // lobby faces toward +Z (default)
  east: -Math.PI / 2,   // lobby faces toward +X
  west: Math.PI / 2,    // lobby faces toward -X
};
const rotY = facingRotationY[facing ?? 'south'] ?? 0;
```

**Apply rotation** — on the outer group, add `rotation={[0, rotY, 0]}`:
```tsx
<group
  position={[wx + TILE_SIZE / 2, 0, wz + TILE_SIZE / 2]}
  rotation={[0, rotY, 0]}
  onClick={...}
  onPointerEnter={...}
  onPointerLeave={...}
>
```

No other changes needed — the interior building geometry (floors, windows, rooftops) all rotate with the parent group.

**After changes:** Run `npx tsc --noEmit` — no errors.

**Commit:**
```bash
git add app/components/CityBuilding.tsx
git commit -m "feat: CityBuilding accepts worldX/worldZ/facing props for procedural placement"
```

---

## Task 4: Update `app/components/CityPark.tsx`

**Files:**
- Modify: `app/components/CityPark.tsx`

**Goal:** Replace the hardcoded `PARKS` array with a `blocks` prop. Each block provides `parkX, parkZ, parkWidth, parkDepth` — the interior green space. Place park content (trees, flowers, optional fountain) within those bounds.

**New component signature:**
```typescript
import type { BlockLayout } from '../lib/cityLayoutGenerator';

interface Props {
  blocks: BlockLayout[];
}

export function CityPark({ blocks }: Props)
```

**Remove:** The entire hardcoded `PARKS` constant array at the top of the file.

**New rendering logic:** Map over `blocks` instead of `PARKS`. Each block has:
- `parkX, parkZ` — interior origin (world units)
- `parkWidth, parkDepth` — interior dimensions

Replace any reference to `park.cx, park.cz` with the block center:
```typescript
const cx = block.parkX + block.parkWidth / 2;
const cz = block.parkZ + block.parkDepth / 2;
```

Fountain presence: keep it for every other block (use block index % 2 === 0).

The park geometry itself (ground plane, flower beds, trees, fountain water arcs) is **unchanged** — just adapt the position calculation to use the block's park bounds instead of hardcoded coordinates.

**After changes:** Run `npx tsc --noEmit` — no errors.

**Commit:**
```bash
git add app/components/CityPark.tsx
git commit -m "feat: CityPark accepts blocks prop — park fills block interior from generated layout"
```

---

## Task 5: Update `app/components/CityTraffic.tsx` and `app/components/CityPedestrians.tsx`

**Files:**
- Modify: `app/components/CityTraffic.tsx`
- Modify: `app/components/CityPedestrians.tsx`

### CityTraffic

**Goal:** Stop importing the hardcoded `ROAD_SEGMENTS`. Accept `segments` as a prop, filtered by `activeLevel` (CityWorld handles the filtering before passing).

**New signature:**
```typescript
import type { GeneratedSegment } from '../lib/cityLayoutGenerator';

interface Props {
  segments: GeneratedSegment[];
}

export function CityTraffic({ segments }: Props)
```

**Remove:** The `import { ROAD_SEGMENTS } from './RoadSystem'` line.

**Adapt:** Anywhere the component references `ROAD_SEGMENTS`, replace with `segments`. The car animation logic (lerping along segment x1/z1 → x2/z2, computing `segmentLength`, etc.) is **unchanged** — the segment data shape is identical.

### CityPedestrians

**Goal:** Replace the hardcoded `SIDEWALK_AREAS` with areas derived from `blocks`.

**New signature:**
```typescript
import type { BlockLayout } from '../lib/cityLayoutGenerator';

interface Props {
  blocks: BlockLayout[];
}

export function CityPedestrians({ blocks }: Props)
```

**Remove:** The hardcoded `SIDEWALK_AREAS` constant.

**Derive sidewalk areas from blocks inside the component** (before the pedestrian state init):
```typescript
// Build sidewalk areas from block road-facing edges
const sidewalkAreas = blocks.flatMap(block => {
  const areas: { xMin: number; xMax: number; zMin: number; zMax: number }[] = [];
  const sw = 1.5; // sidewalk strip half-width
  if (block.roadEdges.includes('north'))
    areas.push({ xMin: block.x, xMax: block.x + block.width, zMin: block.z - sw, zMax: block.z + sw });
  if (block.roadEdges.includes('south'))
    areas.push({ xMin: block.x, xMax: block.x + block.width, zMin: block.z + block.depth - sw, zMax: block.z + block.depth + sw });
  if (block.roadEdges.includes('west'))
    areas.push({ xMin: block.x - sw, xMax: block.x + sw, zMin: block.z, zMax: block.z + block.depth });
  if (block.roadEdges.includes('east'))
    areas.push({ xMin: block.x + block.width - sw, xMax: block.x + block.width + sw, zMin: block.z, zMax: block.z + block.depth });
  return areas;
});
```

Use `sidewalkAreas` wherever the old `SIDEWALK_AREAS` constant was referenced.

**After changes:** Run `npx tsc --noEmit` — no errors.

**Commit:**
```bash
git add app/components/CityTraffic.tsx app/components/CityPedestrians.tsx
git commit -m "feat: CityTraffic and CityPedestrians accept generated layout props"
```

---

## Task 6: Update `app/components/DistrictGround.tsx`

**Files:**
- Modify: `app/components/DistrictGround.tsx`

**Goal:** Accept optional `worldBounds` prop to override the tile-based position. When provided, use it for the ground plane size and position instead of computing from `district.originCol/Row/cols/rows`.

**Add to Props:**
```typescript
worldBounds?: { x: number; z: number; width: number; depth: number };
```

**Position logic** — replace the existing calculation:
```typescript
// Old:
const [cx, cz] = districtCenter(district.originCol, district.originRow, district.cols, district.rows);
const width = district.cols * TILE_SIZE;
const depth = district.rows * TILE_SIZE;

// New:
let cx: number, cz: number, width: number, depth: number;
if (worldBounds) {
  cx = worldBounds.x + worldBounds.width / 2;
  cz = worldBounds.z + worldBounds.depth / 2;
  width = worldBounds.width;
  depth = worldBounds.depth;
} else {
  [cx, cz] = districtCenter(district.originCol, district.originRow, district.cols, district.rows);
  width = district.cols * TILE_SIZE;
  depth = district.rows * TILE_SIZE;
}
```

No other changes — the `<group ref={groupRef} position={[cx, 0, cz]}>` and meshes use `width`/`depth` unchanged.

**After changes:** Run `npx tsc --noEmit` — no errors.

**Commit:**
```bash
git add app/components/DistrictGround.tsx
git commit -m "feat: DistrictGround accepts worldBounds prop for procedural layout"
```

---

## Task 7: Wire up `app/components/CityWorld.tsx`

**Files:**
- Modify: `app/components/CityWorld.tsx`

**Run AFTER Tasks 1–6 are all committed.**

**Goal:** Call `generateLayout` once on component mount. Pass the results to all child components. Remove `CITY_OFFSET_X/Z` (layout is centered at origin). Remove the old `ROAD_SEGMENTS` usage.

**Step 1 — Add the import:**
```typescript
import { useMemo } from 'react';
import { generateLayout, type GeneratedLayout } from '../lib/cityLayoutGenerator';
```

**Step 2 — Generate layout once (stable across re-renders):**
```typescript
export function CityWorld({ level, onBuildingClick, selectedBuilding }: Props) {
  // Computed once on mount; Math.random() inside uses Date.now() seed.
  const layout: GeneratedLayout = useMemo(() => generateLayout(districts), []);

  // Active segments for this level
  const activeSegments = useMemo(
    () => layout.segments.filter(s => s.level <= level),
    [layout.segments, level]
  );
```

**Step 3 — Remove `CITY_OFFSET_X/Z`.** The generated layout is already centered at origin (gx/gz are centered). Remove the `<group position={[CITY_OFFSET_X, 0, CITY_OFFSET_Z]}>` wrapper. Keep the outer `<group>` but without the position offset:
```tsx
<group>  {/* no position offset needed */}
```

Also update the asphalt base plane — instead of hardcoded `position={[28, -0.05, 23]}`, use `position={[0, -0.05, 0]}`.

**Step 4 — Update RoadSystem:**
```tsx
<RoadSystem
  nodes={layout.nodes}
  segments={layout.segments}
  activeLevel={level}
/>
```

**Step 5 — Update CityPark:**
```tsx
<CityPark blocks={layout.blocks} />
```

**Step 6 — Update CityTraffic:**
```tsx
<CityTraffic segments={activeSegments} />
```

**Step 7 — Update CityPedestrians:**
```tsx
<CityPedestrians blocks={layout.blocks} />
```

**Step 8 — Update district rendering.** Replace the old tile-based building position with slot-based. Find the block for each district, then render each building at its slot position:

```tsx
{districts.map(district => {
  const colors  = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
  const dStyle  = DISTRICT_STYLES[district.id] ?? DISTRICT_STYLES['frontend'];
  const isVisible = district.appearsAtLevel <= level;
  const block   = layout.blocks.find(b => b.districtId === district.id);

  return (
    <group key={district.id}>
      {/* District ground — sized to block bounds */}
      <DistrictGround
        district={district}
        groundColor={colors.ground}
        accentColor={colors.accent}
        level={level}
        worldBounds={block ? { x: block.x, z: block.z, width: block.width, depth: block.depth } : undefined}
      />

      {/* Buildings at their procedurally assigned slots */}
      {isVisible && block?.buildingSlots.map(slot => {
        const building = district.buildings.find(b => b.id === slot.buildingId);
        if (!building) return null;
        return (
          <CityBuilding
            key={building.id}
            building={building}
            district={district}
            level={level}
            accentColor={colors.accent}
            districtStyle={dStyle}
            worldX={slot.x}
            worldZ={slot.z}
            facing={slot.facing}
            isSelected={
              selectedBuilding?.districtId === district.id &&
              selectedBuilding?.buildingId === building.id
            }
            onBuildingClick={onBuildingClick}
          />
        );
      })}
    </group>
  );
})}
```

**Step 9 — Verify:** Run `npx tsc --noEmit` — no errors. Start dev server (`npm run dev`), open http://localhost:3000. Confirm:
- City renders with buildings visible
- Level slider L0→L5 shows districts growing and new roads appearing
- Each page refresh produces a different city shape
- Roads have corner fills at intersections (no gaps)
- Buildings face the road on each block edge

**Commit:**
```bash
git add app/components/CityWorld.tsx
git commit -m "feat: wire up procedural layout — random city on every page load, perimeter buildings"
```

---

## Verification Checklist

After Task 7 is complete:
- [ ] `npx tsc --noEmit` → no output
- [ ] Page loads without console errors
- [ ] Refreshing produces a visibly different city layout
- [ ] At L0: only 2 districts + central roads visible
- [ ] At L5: full city + all roads visible
- [ ] Buildings are on the perimeter of each block, facing outward
- [ ] Road corners have no gaps (corner fill patches visible)
- [ ] Parks fill block interiors (not on roads)
- [ ] Clicking a building opens the side panel correctly
