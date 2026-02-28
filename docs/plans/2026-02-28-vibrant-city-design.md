# Vibrant Living City — Design Document

**Goal:** Transform the static 3D isometric city into a living, breathing daytime metropolis with moving traffic, pedestrians, architectural variety, parks, and a vivid sky.

**Date:** 2026-02-28

---

## 1. Daytime Atmosphere

### Sky & Lighting
- **Sky dome**: Large `SphereGeometry` (radius 300, inside-facing) with vertical gradient from `#1a6db5` (zenith) to `#87ceeb` (horizon). Rendered with `side: THREE.BackSide`.
- **Clouds**: 8–12 flat ellipsoid clusters (merged `SphereGeometry` blobs, white `#f5f8ff`, opacity 0.85) drifting slowly across the sky at Y=60–90. Each cloud moves along X axis at 0.02–0.06 units/sec, wrapping around when it exits bounds.
- **Sun light**: `DirectionalLight` intensity raised to `2.0`, color `#fff5e0` (warm white), position `[30, 60, 20]`.
- **Secondary fill**: `DirectionalLight` intensity `0.5`, color `#c8e8ff` (sky bounce), position `[-20, 30, -20]`.
- **Ambient**: `AmbientLight` intensity `0.9`, color `#d4e8ff`.
- **Fog**: Changed from dark `#0f172a` to light `#c8dcf0` — city edges fade into bright haze, not darkness.
- **Ground plane**: Updated from `#1e293b` to `#2a3f52` (slightly lighter asphalt, still dark enough to contrast roads).

---

## 2. Road System (replaces RoadGrid)

New component: `RoadSystem.tsx`

### Road geometry (per gap between districts)
- **Road plane**: `planeGeometry`, width 2.5 units, asphalt `#1e2d3d`, Y=0.
- **Sidewalk strips**: Two 0.4-unit-wide planes along each road edge, color `#2d3f50` (lighter than road).
- **Lane dashes**: Series of short planes (0.8 long, 0.08 wide) spaced every 2.0 units along road center, color `#c8a020` (yellow). Static geometry.
- **Crosswalk stripes**: At each road intersection, 5 white (`#e8eef4`) planes (0.6 wide, 0.35 long) with 0.25 gaps. Static.

### Road segment constants
Exported as `ROAD_SEGMENTS` array — single source of truth used by traffic and pedestrians:
```ts
interface RoadSegment {
  id: string;
  x1: number; z1: number;
  x2: number; z2: number;
  axis: 'x' | 'z';
  laneOffset: number; // +0.55 or -0.55 for left/right lane
}
```

---

## 3. City Traffic

New component: `CityTraffic.tsx`

### Car geometry
Each car: two `BoxGeometry` meshes in a group:
- **Body**: `0.7 × 0.22 × 0.38` (wide, flat)
- **Cab**: `0.38 × 0.2 × 0.34` (narrower, taller), offset `+0.05` forward and `+0.21` up
- **Headlights**: Two tiny `PlaneGeometry` (0.08×0.06) on front face, emissive white `#fffff0`, intensity 0.8
- **Tail lights**: Two tiny planes on rear, emissive red `#ff2010`, intensity 0.6
- **Colors**: 8 muted palette options — `#2a3f5f`, `#3a2f1f`, `#1f3a2a`, `#3f2a3f`, `#3f3a1f`, `#1f2f3f`, `#2f1f1f`, `#1a2a3a`

### Car count & distribution
~15 cars total. Distributed across road segments based on segment length. Each car has:
```ts
interface CarState {
  segmentId: string;
  t: number;          // 0→1 progress along segment
  speed: number;      // 0.8–2.0 units/sec
  direction: 1 | -1; // forward or backward
  laneOffset: number; // which lane
  parkState: 'driving' | 'parking' | 'parked' | 'leaving';
  parkTimer: number;
}
```

4 cars are "parking cars" — they exit a road, slow to a building entrance, pause 3–6s, then return.

### Animation (useFrame)
- `t += speed * delta / segmentLength`; wrap at 0/1
- Position = lerp(start, end, t) + laneOffset on perpendicular axis
- Rotation = face direction of travel (Y rotation based on axis + direction)
- Parking cars: lerp toward park spot, scale lerp for smoothness

---

## 4. Pedestrians

New component: `CityPedestrians.tsx`

### Figure geometry
Per pedestrian (group):
- **Head**: `SphereGeometry` radius 0.09, color = district accent × 0.7 (muted)
- **Body**: `CylinderGeometry` radius 0.055, height 0.22, same color

### Count & behavior
~24 pedestrians total, ~2–3 per visible district.

Each pedestrian state:
```ts
interface PedState {
  x: number; z: number;          // current world position
  targetX: number; targetZ: number; // walk endpoint
  speed: number;                 // 0.3–0.7 units/sec
  scale: number;                 // 0→1 for enter/exit animation
  behavior: 'walking' | 'entering' | 'inside' | 'leaving';
  timer: number;                 // time in current state
  insideDuration: number;        // how long to stay inside (2–8s)
  bobOffset: number;             // phase offset for walking bob
}
```

### Walking bob
`mesh.position.y = baseY + sin(time * 6 + bobOffset) * 0.015`

### Enter/leave buildings
- 30% of pedestrians are "visitors" — they walk to a building entrance, scale lerps 1→0 (`entering`), wait `insideDuration`, scale lerps 0→1 (`leaving`), resume walking.

---

## 5. Parks & Gardens

New component: `CityPark.tsx` (replaces tree placement in CityWorld)

### Garden patch (one per district)
Placed at the district's least-obstructed corner:
- **Base**: `PlaneGeometry` 2.8×2.8, color `#1e3a18` (deep green), Y=0.02
- **Border**: Slightly larger plane `3.0×3.0`, color `#2a5020` (medium green), Y=0.01
- **Flower beds**: 3 clusters of 5 spheres (`SphereGeometry` r=0.1), colors `#ff6b8a`, `#ffb347`, `#7ec8e3`, `#ff8c69`, `#b8f5a0`. Each on a thin cylinder stem r=0.02.
- **Bob animation**: `y = baseY + sin(time * freq + phase) * 0.07`, freq=1.5–3.0, unique phase per flower
- **Trees**: 2 stylized trees — `ConeGeometry` (r=0.5, h=1.2) + `CylinderGeometry` trunk (r=0.08, h=0.4). Colors: `#1a5c1a` canopy, `#5c3a1a` trunk.

### Fountain (one per park)
- **Base**: `CylinderGeometry` r=0.5, h=0.12, color `#8090a0`
- **Water pool**: `CylinderGeometry` r=0.42, h=0.05, color `#3060a0`, transparent opacity 0.6
- **Water arcs**: 6 spheres (`SphereGeometry` r=0.06), color `#80c8ff`, opacity 0.75. Each follows parabola:
  ```
  angle = (i / 6) * 2π
  t = (time * 0.8 + i/6) % 1
  x = sin(angle) * 0.35 * sin(t * π)
  z = cos(angle) * 0.35 * sin(t * π)
  y = 0.15 + sin(t * π) * 0.5
  ```

### Intersection planters
At each major road crossing: `CylinderGeometry` r=0.4, h=0.15, terracotta `#a05030`. 3 bobbing flower spheres on top.

### All park animation in one useFrame
Single `time` variable from `state.clock.elapsedTime`, shared across all flowers/fountains. No per-object frame handlers.

---

## 6. Architectural Building Overhaul

Updates to `CityBuilding.tsx` — buildings should look like real city structures, not plain boxes.

### District style identities
| District | Style | Window Type | Rooftop | Facade Color Modifier |
|---|---|---|---|---|
| frontend | Glass tower | Full-height curtain wall | Antenna spire | Bright, reflective |
| backend | Industrial | Small square windows grid | Water tower | Dark, solid |
| databases | Corporate | Wide horizontal bands | Flat AC units | Mid-tone, symmetric |
| devops | Utilitarian | Irregular scatter | Mechanical tower | Warm grey |
| testing | Modern | Alternating panels | Satellite dish | Cool grey |
| security | Brutalist | Narrow slits | Solid parapet | Dark, heavy |
| system-design | Civic | Arched tops (visual) | Dome accent | Stone-like |
| performance | Sleek | Diagonal stripe accent | Speed fins | Chrome-ish |
| leadership | Prestige | Large panoramic | Penthouse box | Warm gold tint |

### Floor ledge separators
Between each floor: a thin `BoxGeometry` (FLOOR_W+0.06, 0.06, FLOOR_D+0.06), color = `accentColor × 0.5`. Creates visible horizontal banding — the key to looking like a building.

### Window grid (replaces current window strips)
Instead of one wide strip, render a 3×2 grid of window planes per floor face:
- Each window: `PlaneGeometry` 0.18×0.22
- Spacing: 0.25 between columns, 0.12 between rows
- Windows have slight random emissive variance (some lit, some dark)

### Lobby base
Ground floor (floor 0) is slightly wider (`FLOOR_W * 1.06`, `FLOOR_D * 1.06`) and taller (`FLOOR_HEIGHT * 1.15`). Darker color (`accentColor × 0.2`). Has a visible "door" rectangle on front face.

### Building setback (floors 4+)
Floors above index 3 use `scale={[0.92, 1, 0.92]}` — slight narrowing gives classic skyscraper stepped profile.

### Rooftop details (on top floor, per district style)
- **Antenna spire**: Thin `CylinderGeometry` r=0.03, h=0.8, emissive tip sphere r=0.06
- **Water tower**: Cylinder r=0.2, h=0.35 on 4 thin leg cylinders
- **AC units**: 2–3 small `BoxGeometry` 0.2×0.12×0.15 cubes on roof
- **Satellite dish**: `SphereGeometry` partial (widthSeg=8, phiStart=0, phiLength=π) r=0.18, tilted 45°

---

## 7. Component Changes Summary

| File | Action | Change |
|---|---|---|
| `CityScene.tsx` | Modify | Update lighting (intensity, colors), fog color, add sky |
| `CityWorld.tsx` | Modify | Import new components, remove old RoadGrid/CityTree calls |
| `RoadGrid.tsx` | Replace | → `RoadSystem.tsx` |
| `CityBuilding.tsx` | Modify | Floor ledges, window grid, lobby base, setback, rooftop details |
| `CityTree.tsx` | Retire | Trees moved into CityPark |
| `CityPark.tsx` | Create | Gardens, fountains, trees per district |
| `CityTraffic.tsx` | Create | ~15 animated cars |
| `CityPedestrians.tsx` | Create | ~24 animated pedestrian figures |
| `SkyDome.tsx` | Create | Sky gradient sphere + drifting clouds |

---

## 8. Performance Notes

- All animation via `useFrame` ref mutation — zero React state changes per tick
- Cars, pedestrians, park elements each get ONE `useFrame` call (not per-object)
- Building window grid adds ~12 meshes per floor (vs 2 currently) — acceptable for 27 buildings × 6 floors = ~1944 extra meshes. Use `instancedMesh` if frame rate drops.
- Sky clouds: 10 meshes, trivial cost
- Target: 60fps on a mid-range laptop with all features enabled
