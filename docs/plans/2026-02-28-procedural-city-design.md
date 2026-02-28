# Procedural City Layout — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded district positions and road segments with a procedural generator that produces a unique, connected, visually rich city on every page load.

**Architecture:** Road graph is generated first; districts fill the blocks it creates; buildings are placed on block perimeters facing roads; parks fill block interiors.

**Tech Stack:** React Three Fiber, Three.js, existing city.ts data, new `cityLayoutGenerator.ts` module.

---

## Core Mental Model

```
Road graph → City blocks → Districts → Buildings (perimeter) + Park (interior)
```

- **Road graph** = connected set of intersection nodes + road segments between them
- **City block = District** — each enclosed/semi-enclosed space in the road graph is one district (1:1 mapping)
- **Buildings** line the perimeter of each block, lobbies facing the road
- **Park** fills the block interior automatically
- **Road network grows with level** — Gen 0 roads appear at L0, Gen 1 at L1–L2, Gen 2 at L3+

---

## 1. Data Structures

### New file: `app/lib/cityLayoutGenerator.ts`

```ts
// A node in the road graph (intersection or road endpoint)
interface RoadNode {
  id: string;
  x: number;   // world tile units
  z: number;
  level: number; // appears at this district level
}

// A road segment between two nodes (always axis-aligned: x or z)
interface RoadSegment {
  id: string;
  fromNode: string;  // RoadNode id
  toNode: string;    // RoadNode id
  axis: 'x' | 'z';
  level: number;     // appears when level >= this
}

// A city block = district footprint in world space
interface BlockLayout {
  districtId: string;
  // Bounding rectangle (in tile units)
  x: number;  // min x
  z: number;  // min z
  width: number;
  depth: number;
  // Which edges face a road (determines building placement + park interior)
  roadEdges: Array<'north' | 'south' | 'east' | 'west'>;
  // Perimeter slots: one per building, each with a facing direction
  buildingSlots: BuildingSlot[];
}

interface BuildingSlot {
  buildingId: string;   // matches building.id from city.ts
  x: number; z: number; // center position within block (world tile units)
  facing: 'north' | 'south' | 'east' | 'west';
}

// Full generated layout for the city
export interface GeneratedLayout {
  nodes: RoadNode[];
  segments: RoadSegment[];
  blocks: BlockLayout[];
}
```

`GeneratedLayout` is computed once in `page.tsx` (on mount, using `Math.random()`) and passed down to all city components.

---

## 2. Layout Generator Algorithm

### Step 1 — Grow the road graph

Start from a central origin (0, 0). Grow outward in **generations** matching district level groups:

```
Gen 0 (L0): 1 central intersection → 2–3 short axis-aligned roads
             creates 1–2 inner blocks for Frontend + Backend

Gen 1 (L1–L2): extend from Gen 0 endpoints → 2–3 new segments
               creates 2–3 new blocks for Databases, DevOps, Testing

Gen 2 (L3–L4): extend from Gen 1 endpoints → 2–3 new segments
               creates 2–3 new blocks for Security, System-design, Performance

Gen 3 (L5): extend from Gen 2 endpoints → 1–2 final segments
            creates 1 block for Leadership
```

**Growth rules:**
- Each new segment picks a random cardinal direction (N/S/E/W) from an existing endpoint
- Random length: 8–14 tiles (wide enough for a district block + roads on each side)
- No two segments overlap; if a collision is detected, resample direction
- New segment adds a new `RoadNode` at its far end
- Segment `level` = the generation that created it

### Step 2 — Identify blocks

After the graph is built, each **gap between adjacent parallel road segments** is a candidate block. Algorithm:

1. For every pair of parallel segments that face each other (e.g., two E-W roads at different z values with overlapping x ranges), the space between them is a block candidate.
2. Check if the block is also bounded on the sides (by N-S segments) — if bounded on 3+ sides, it's a valid block.
3. Assign `roadEdges` based on which sides have a road.
4. Block dimensions = segment gap minus `ROAD_W` (2.5 tiles) on each road-facing side.

This naturally produces **L-shaped or T-bounded blocks** when segments don't perfectly enclose a rectangle — the block just has fewer `roadEdges` and a wider open face.

### Step 3 — Assign districts to blocks

Districts (from `city.ts`) are sorted by `appearsAtLevel`. Blocks are sorted by distance from origin (innermost first). Match them 1:1:

```ts
const sortedDistricts = [...districts].sort((a, b) => a.appearsAtLevel - b.appearsAtLevel);
const sortedBlocks = [...blocks].sort((a, b) => distanceFromOrigin(a) - distanceFromOrigin(b));
// Zip: sortedDistricts[i] → sortedBlocks[i]
```

L0 districts always get the innermost blocks, L5 always gets the outermost.

### Step 4 — Place buildings in perimeter slots

For each block:

1. Identify the perimeter strip (1 tile deep) along each `roadEdge`.
2. Divide each strip into slots of width = `TILE_SIZE` (one building per slot).
3. Assign buildings to slots starting from the north/west edge, wrapping clockwise.
4. Any unfilled slots become **tree clusters** (visual filler, no data binding).
5. Each `BuildingSlot` records the building's `facing` direction (toward the road).

**Result:** A 10×8 block with 3 road-facing edges and 4 buildings might place 2 buildings on the north edge, 2 on the east edge, facing outward.

### Step 5 — Interior = park

Everything inside the perimeter strip is park space. `CityPark` no longer needs hardcoded positions — it receives the block's interior rectangle and fills it with trees, flowers, and optionally a fountain.

---

## 3. Road Rendering — Corner Fills

`RoadSystem.tsx` changes:

**Straight segments** — unchanged geometry (asphalt plane + sidewalk strips + lane dashes).

**Corner fills** — at every `RoadNode` that connects 2+ segments, render a square `PlaneGeometry` of size `ROAD_W × ROAD_W`:

```tsx
// At each node connecting segments of different axes:
<mesh position={[node.x, 0, node.z]} rotation={[-Math.PI/2, 0, 0]}>
  <planeGeometry args={[ROAD_W, ROAD_W]} />
  <meshLambertMaterial color={ASPHALT} />
</mesh>
```

This fills the visual gap at every intersection/turn. Crosswalk stripes are still rendered where 4-way intersections occur (node has 4 connecting segments).

**Level-gating:** `RoadSystem` receives `activeLevel: number` and only renders segments with `segment.level ≤ activeLevel`. Corner fills render only if all connecting segments at that node are active.

**Traffic:** `CityTraffic` receives the same `segments` array filtered by `activeLevel`. Cars only drive on currently visible roads.

---

## 4. Component Changes

| File | Change |
|---|---|
| `app/lib/cityLayoutGenerator.ts` | **Create** — full generator, exports `generateLayout(districts, seed)` |
| `app/page.tsx` | Call generator on mount; store `GeneratedLayout` in state |
| `app/components/CityWorld.tsx` | Accept `layout: GeneratedLayout`; pass segments to RoadSystem + Traffic; pass blocks to DistrictBlock renderer |
| `app/components/RoadSystem.tsx` | Accept `segments + nodes + activeLevel` props; add corner fill geometry; remove hardcoded constants |
| `app/components/CityBuilding.tsx` | Accept `facing` prop; rotate building group so lobby faces road |
| `app/components/CityPark.tsx` | Accept block interior rect instead of hardcoded cx/cz |
| `app/components/CityTraffic.tsx` | Accept `segments` prop filtered by level; remove import of hardcoded ROAD_SEGMENTS |
| `app/components/CityPedestrians.tsx` | Derive sidewalk areas from `blocks` instead of hardcoded SIDEWALK_AREAS |

---

## 5. What Does NOT Change

- `app/data/city.ts` — all district/building/floor content is untouched
- `CityBuilding.tsx` animation (spring physics floor drops)
- `SkyDome.tsx`, `BuildingLabel.tsx`, `CityScene.tsx`
- The level slider and building panel UI

---

## 6. Out of Scope

- Bezier/curved roads (decided: corner fill patches only)
- Diagonal road segments
- Sub-district road networks (roads *inside* a block)
- Procedural building count per district (stays fixed per city.ts)
