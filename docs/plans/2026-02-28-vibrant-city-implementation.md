# Vibrant Living City Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the static 3D isometric city into a vibrant daytime metropolis with moving traffic, pedestrians, architectural buildings, parks, and a blue sky.

**Architecture:** Seven focused components added/replaced in `app/components/`. All animation lives in `useFrame` ref mutation — zero React state per frame tick. Road segments are defined once in `RoadSystem.tsx` and imported by `CityTraffic.tsx`.

**Tech Stack:** React Three Fiber, @react-three/drei (`Html`), Three.js, TypeScript, Next.js 15

---

## District world positions (raw, pre-offset)

These are coordinates INSIDE the `<group position={[-24, 0, -20]}>` in CityWorld. All new components render inside this group.

| District | x range | z range |
|---|---|---|
| frontend | 4–14 | 4–12 |
| backend | 18–28 | 4–12 |
| system-design | 32–42 | 4–12 |
| databases | 4–14 | 16–24 |
| devops | 18–28 | 16–24 |
| performance | 32–42 | 16–24 |
| testing | 4–14 | 28–36 |
| security | 18–28 | 28–36 |
| leadership | 32–44 | 28–36 |

Road gaps:
- N-S road 1: x=14–18 → center x=16
- N-S road 2: x=28–32 → center x=30
- E-W road 1: z=12–16 → center z=14
- E-W road 2: z=24–28 → center z=26

---

## Task 1: Daytime Sky + Lighting

**Files:**
- Create: `app/components/SkyDome.tsx`
- Modify: `app/components/CityScene.tsx`

**Step 1: Create SkyDome.tsx**

```tsx
// app/components/SkyDome.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 8 clouds, each made of 4 merged spheres
const CLOUDS = [
  { x: -60, y: 70, z: -80, scale: 1.2 },
  { x:  20, y: 80, z: -100, scale: 0.9 },
  { x:  80, y: 75, z: -50, scale: 1.0 },
  { x: -30, y: 85, z:  30, scale: 1.3 },
  { x:  60, y: 72, z:  70, scale: 0.8 },
  { x: -90, y: 78, z:  60, scale: 1.1 },
  { x:  10, y: 90, z: 100, scale: 0.95 },
  { x: -50, y: 68, z: -20, scale: 1.4 },
];

// Cloud blob offsets within each cloud
const BLOB_OFFSETS = [
  [0, 0, 0], [2.5, 0.8, 0], [-2.0, 0.5, 0.5], [0.5, 1.2, -1.0],
];

export function SkyDome() {
  const cloudRefs = useRef<(THREE.Group | null)[]>([]);
  const speeds = useRef(CLOUDS.map(() => 0.02 + Math.random() * 0.04));

  useFrame((_, delta) => {
    cloudRefs.current.forEach((ref, i) => {
      if (!ref) return;
      ref.position.x += speeds.current[i] * delta * 10;
      if (ref.position.x > 120) ref.position.x = -120;
    });
  });

  return (
    <>
      {/* Sky sphere — inside-facing gradient */}
      <mesh>
        <sphereGeometry args={[280, 32, 16]} />
        <meshBasicMaterial color="#5ba3d9" side={THREE.BackSide} />
      </mesh>

      {/* Horizon brightening — second smaller sphere */}
      <mesh>
        <sphereGeometry args={[270, 32, 8, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
        <meshBasicMaterial color="#a8d4f0" side={THREE.BackSide} transparent opacity={0.6} />
      </mesh>

      {/* Clouds */}
      {CLOUDS.map((cloud, ci) => (
        <group
          key={ci}
          ref={el => { cloudRefs.current[ci] = el; }}
          position={[cloud.x, cloud.y, cloud.z]}
          scale={cloud.scale}
        >
          {BLOB_OFFSETS.map((off, bi) => (
            <mesh key={bi} position={off as [number, number, number]}>
              <sphereGeometry args={[3.5, 8, 6]} />
              <meshBasicMaterial color="#f0f6ff" transparent opacity={0.82} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
```

**Step 2: Update CityScene.tsx lighting and fog**

Replace the entire file:

```tsx
// app/components/CityScene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { CityWorld } from './CityWorld';
import { SkyDome } from './SkyDome';

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

const CAM_DISTANCE = 80;
const CAM_ANGLE_DEG = 35.264;
const CAM_AZIMUTH_DEG = 45;

function getIsometricPosition(): [number, number, number] {
  const phi = (CAM_ANGLE_DEG * Math.PI) / 180;
  const theta = (CAM_AZIMUTH_DEG * Math.PI) / 180;
  return [
    CAM_DISTANCE * Math.cos(phi) * Math.sin(theta),
    CAM_DISTANCE * Math.sin(phi),
    CAM_DISTANCE * Math.cos(phi) * Math.cos(theta),
  ];
}

export default function CityScene({ level, onBuildingClick, selectedBuilding }: Props) {
  const camPos = getIsometricPosition();

  return (
    <Canvas
      className="fixed inset-0 w-full h-full"
      orthographic
      camera={{
        position: camPos,
        zoom: 12,
        near: 0.1,
        far: 1000,
        up: [0, 1, 0],
      }}
      shadows
    >
      {/* Daytime fog — light blue haze at horizon */}
      <fog attach="fog" args={['#a8d4f0', 100, 260]} />

      {/* Bright daytime ambient */}
      <ambientLight intensity={1.1} color="#d8eaff" />

      {/* Main sun — warm white from upper right */}
      <directionalLight
        position={[30, 60, 20]}
        intensity={2.0}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      {/* Sky bounce fill — cool blue from left */}
      <directionalLight position={[-20, 30, -20]} intensity={0.5} color="#c8e8ff" />

      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minZoom={3}
        maxZoom={40}
        panSpeed={1.5}
        zoomSpeed={1.2}
      />

      <SkyDome />

      <CityWorld
        level={level}
        onBuildingClick={onBuildingClick}
        selectedBuilding={selectedBuilding}
      />
    </Canvas>
  );
}
```

**Step 3: Verify visually**

Run: `npm run dev` → navigate to http://localhost:3000
Expected: Blue sky visible behind city, drifting white clouds, city looks bright/daytime (no dark fog).

**Step 4: Commit**

```bash
git add app/components/SkyDome.tsx app/components/CityScene.tsx
git commit -m "feat: daytime sky dome with drifting clouds + bright lighting"
```

---

## Task 2: Road System

**Files:**
- Create: `app/components/RoadSystem.tsx`
- Delete: `app/components/RoadGrid.tsx` (after wiring in Task 7)

**Step 1: Create RoadSystem.tsx**

```tsx
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
```

**Step 2: Verify**

Run: `npm run dev` — temporarily add `<RoadSystem />` inside CityWorld group (before Task 7 full wiring) to check roads render with lanes, dashes, crosswalks.

**Step 3: Commit**

```bash
git add app/components/RoadSystem.tsx
git commit -m "feat: proper road system with lanes, sidewalks, dashes, crosswalks"
```

---

## Task 3: Architectural Building Overhaul

**Files:**
- Modify: `app/components/CityBuilding.tsx`
- Modify: `app/components/CityWorld.tsx` (add districtStyle prop)

**Step 1: Add district style type to CityWorld.tsx**

Add this map near the top of CityWorld.tsx (after DISTRICT_COLORS):

```tsx
type RooftopStyle = 'antenna' | 'watertower' | 'ac' | 'satellite' | 'spire';

interface DistrictStyle {
  rooftop: RooftopStyle;
  windowRows: number;   // window rows per floor face (2 or 3)
  windowCols: number;   // window cols per floor face (2 or 3)
  bodyDark: number;     // body color darkness 0.2–0.4
  lobbyDark: number;    // lobby color darkness 0.1–0.25
}

const DISTRICT_STYLES: Record<string, DistrictStyle> = {
  frontend:       { rooftop: 'antenna',    windowRows: 3, windowCols: 3, bodyDark: 0.25, lobbyDark: 0.15 },
  backend:        { rooftop: 'watertower', windowRows: 2, windowCols: 2, bodyDark: 0.35, lobbyDark: 0.20 },
  databases:      { rooftop: 'ac',         windowRows: 2, windowCols: 3, bodyDark: 0.30, lobbyDark: 0.18 },
  devops:         { rooftop: 'ac',         windowRows: 2, windowCols: 2, bodyDark: 0.38, lobbyDark: 0.22 },
  testing:        { rooftop: 'satellite',  windowRows: 2, windowCols: 3, bodyDark: 0.28, lobbyDark: 0.16 },
  security:       { rooftop: 'spire',      windowRows: 1, windowCols: 2, bodyDark: 0.40, lobbyDark: 0.25 },
  'system-design':{ rooftop: 'antenna',    windowRows: 3, windowCols: 3, bodyDark: 0.26, lobbyDark: 0.15 },
  performance:    { rooftop: 'spire',      windowRows: 2, windowCols: 3, bodyDark: 0.22, lobbyDark: 0.13 },
  leadership:     { rooftop: 'watertower', windowRows: 3, windowCols: 3, bodyDark: 0.24, lobbyDark: 0.14 },
};
```

Then in the CityBuilding render inside CityWorld, add:
```tsx
const dStyle = DISTRICT_STYLES[district.id] ?? DISTRICT_STYLES['frontend'];
// ...
<CityBuilding
  ...existing props...
  districtStyle={dStyle}
/>
```

**Step 2: Update CityBuilding.tsx Props and imports**

Add to the Props interface:
```tsx
districtStyle: {
  rooftop: 'antenna' | 'watertower' | 'ac' | 'satellite' | 'spire';
  windowRows: number;
  windowCols: number;
  bodyDark: number;
  lobbyDark: number;
};
```

**Step 3: Replace CityBuilding.tsx floor rendering**

Replace the entire return JSX in CityBuilding.tsx with this (keep all the useRef/useFrame spring logic unchanged — only the JSX changes):

```tsx
const accent   = new THREE.Color(accentColor);
const bodyHex  = '#' + accent.clone().multiplyScalar(districtStyle.bodyDark).getHexString();
const lobbyHex = '#' + accent.clone().multiplyScalar(districtStyle.lobbyDark).getHexString();
const ledgeHex = '#' + accent.clone().multiplyScalar(0.55).getHexString();
const winHex   = '#' + accent.clone().multiplyScalar(1.4).getHexString();

// Window grid positions for one face (normalized 0..1, applied to face size)
function windowPositions(rows: number, cols: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = (c + 1) / (cols + 1);  // horizontal offset 0..1
      const v = (r + 0.5) / rows;      // vertical offset 0..1
      pts.push([u, v]);
    }
  }
  return pts;
}

const winPts = windowPositions(districtStyle.windowRows, districtStyle.windowCols);
const LOBBY_EXTRA = 0.06;
const LOBBY_H_MULT = 1.15;

return (
  <group
    position={[wx + TILE_SIZE / 2, 0, wz + TILE_SIZE / 2]}
    onClick={(e) => { e.stopPropagation(); onBuildingClick(district.id, building.id); }}
    onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
    onPointerLeave={() => { document.body.style.cursor = 'default'; }}
  >
    {/* Selection ring */}
    {isSelected && (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[FLOOR_W * 0.52, FLOOR_W * 0.62, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.9} />
      </mesh>
    )}

    {Array.from({ length: 6 }, (_, floorIdx) => {
      const isLobby   = floorIdx === 0;
      const isTop     = floorIdx === numFloors - 1 && floorIdx < numFloors;
      const isVisible = floorIdx < numFloors;
      // Setback: floors 4+ are slightly narrower
      const setback   = floorIdx >= 4 ? 0.92 : 1.0;
      const selScale  = isSelected ? 1.05 : 1.0;
      const fw = isLobby ? FLOOR_W * (1 + LOBBY_EXTRA) : FLOOR_W;
      const fd = isLobby ? FLOOR_D * (1 + LOBBY_EXTRA) : FLOOR_D;
      const fh = isLobby ? FLOOR_HEIGHT * LOBBY_H_MULT : FLOOR_HEIGHT;
      const bodyColor = isLobby ? lobbyHex : bodyHex;

      return (
        <group
          key={floorIdx}
          ref={el => { floorRefs.current[floorIdx] = el; }}
          position={[0, floorIdx * FLOOR_HEIGHT + fh / 2, 0]}
          scale={[setback * selScale, 1, setback * selScale]}
          visible={isVisible}
        >
          {/* Main floor box */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[fw, fh * 0.93, fd]} />
            <meshLambertMaterial color={bodyColor} />
          </mesh>

          {/* Floor ledge — horizontal band at top of each floor */}
          <mesh position={[0, fh * 0.47, 0]}>
            <boxGeometry args={[fw + 0.06, 0.055, fd + 0.06]} />
            <meshLambertMaterial color={ledgeHex} />
          </mesh>

          {/* Window grid — front face (+Z) */}
          {winPts.map(([u, v], wi) => (
            <mesh
              key={`wf-${wi}`}
              position={[
                fw * (u - 0.5),
                fh * (v - 0.5) * 0.75,
                fd / 2 + 0.01,
              ]}
            >
              <planeGeometry args={[fw * 0.18, fh * 0.22]} />
              <meshStandardMaterial
                color={winHex}
                emissive={winHex}
                emissiveIntensity={wi % 3 === 0 ? 0.2 : 0.05}
                transparent
                opacity={0.85}
              />
            </mesh>
          ))}

          {/* Window grid — right face (+X) */}
          {winPts.map(([u, v], wi) => (
            <mesh
              key={`wr-${wi}`}
              position={[
                fd / 2 + 0.01,
                fh * (v - 0.5) * 0.75,
                fd * (u - 0.5),
              ]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[fd * 0.18, fh * 0.22]} />
              <meshStandardMaterial
                color={winHex}
                emissive={winHex}
                emissiveIntensity={wi % 3 === 1 ? 0.2 : 0.05}
                transparent
                opacity={0.85}
              />
            </mesh>
          ))}

          {/* Lobby door on ground floor front face */}
          {isLobby && (
            <mesh position={[0, -fh * 0.25, fd / 2 + 0.012]}>
              <planeGeometry args={[fw * 0.22, fh * 0.38]} />
              <meshBasicMaterial color="#0a1020" />
            </mesh>
          )}

          {/* Rooftop details on top floor */}
          {isTop && districtStyle.rooftop === 'antenna' && (
            <group position={[0, fh / 2, 0]}>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
                <meshLambertMaterial color="#8898aa" />
              </mesh>
              <mesh position={[0, 1.08, 0]}>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.2} />
              </mesh>
            </group>
          )}

          {isTop && districtStyle.rooftop === 'watertower' && (
            <group position={[fw * 0.3, fh / 2 + 0.3, fd * 0.3]}>
              {/* Legs */}
              {[[0.1,0.1],[0.1,-0.1],[-0.1,0.1],[-0.1,-0.1]].map(([lx,lz], li) => (
                <mesh key={li} position={[lx, 0.05, lz]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
                  <meshLambertMaterial color="#5a4030" />
                </mesh>
              ))}
              {/* Tank */}
              <mesh position={[0, 0.28, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.32, 8]} />
                <meshLambertMaterial color="#7a6050" />
              </mesh>
            </group>
          )}

          {isTop && districtStyle.rooftop === 'ac' && (
            <group position={[0, fh / 2 + 0.06, 0]}>
              {[[-0.2, -0.1], [0.15, 0.15]].map(([rx, rz], ri) => (
                <mesh key={ri} position={[rx, 0.06, rz]}>
                  <boxGeometry args={[0.22, 0.12, 0.16]} />
                  <meshLambertMaterial color="#6a7a8a" />
                </mesh>
              ))}
            </group>
          )}

          {isTop && districtStyle.rooftop === 'satellite' && (
            <group position={[fw * 0.25, fh / 2, -fd * 0.25]}>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
                <meshLambertMaterial color="#aab0b8" />
              </mesh>
              <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 4, 0, 0]}>
                <sphereGeometry args={[0.16, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <meshStandardMaterial color="#c0c8d0" side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {isTop && districtStyle.rooftop === 'spire' && (
            <group position={[0, fh / 2, 0]}>
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.0, 0.06, 0.9, 6]} />
                <meshLambertMaterial color={ledgeHex} />
              </mesh>
            </group>
          )}
        </group>
      );
    })}

    {/* Floating name label */}
    {numFloors > 0 && (
      <BuildingLabel
        name={building.name}
        position={[0, numFloors * FLOOR_HEIGHT + 0.5, 0]}
        accentColor={accentColor}
      />
    )}
  </group>
);
```

**Step 4: Import THREE.DoubleSide** (already imported via `import * as THREE from 'three'`)

**Step 5: TypeScript check**

```bash
cd /Users/cowcow02/Repo/beyond-vibe-coding && npx tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors

**Step 6: Verify visually**

http://localhost:3000 → buildings should show floor ledge bands, window grids, wider lobby base, rooftop details per district.

**Step 7: Commit**

```bash
git add app/components/CityBuilding.tsx app/components/CityWorld.tsx
git commit -m "feat: architectural building overhaul — ledges, window grids, lobby, rooftops"
```

---

## Task 4: City Traffic (depends on Task 2 — needs ROAD_SEGMENTS)

**Files:**
- Create: `app/components/CityTraffic.tsx`

**Step 1: Create CityTraffic.tsx**

```tsx
// app/components/CityTraffic.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_SEGMENTS, type RoadSegment } from './RoadSystem';

interface CarState {
  segIdx: number;     // index into ROAD_SEGMENTS
  t: number;          // 0→1 progress along segment
  speed: number;      // units/sec
  dir: 1 | -1;        // direction along segment
  laneOff: number;    // perpendicular offset (+0.55 = right lane)
  // Parking state
  parkMode: boolean;
  parkT: number;      // progress toward park spot 0→1
  parkTimer: number;  // time spent parked
  parkDuration: number;
  parkPhase: 'driving' | 'parking' | 'parked' | 'leaving';
}

const CAR_COLORS = [
  '#2a4060', '#3a2820', '#1e3828', '#3e2a3e',
  '#3c381c', '#1c2e3c', '#2e1e1e', '#182838',
];

// 4 parking spots near building entrances (in raw world coords)
const PARK_SPOTS = [
  { x: 8,  z: 6  },
  { x: 22, z: 6  },
  { x: 8,  z: 20 },
  { x: 22, z: 20 },
];

function segLength(seg: RoadSegment): number {
  return Math.sqrt((seg.x2 - seg.x1) ** 2 + (seg.z2 - seg.z1) ** 2);
}

function segPos(seg: RoadSegment, t: number, laneOff: number): [number, number, number] {
  const x = seg.x1 + (seg.x2 - seg.x1) * t + (seg.axis === 'z' ? laneOff : 0);
  const z = seg.z1 + (seg.z2 - seg.z1) * t + (seg.axis === 'x' ? laneOff : 0);
  return [x, 0.14, z];
}

function segRotY(seg: RoadSegment, dir: 1 | -1): number {
  if (seg.axis === 'x') return dir === 1 ? 0 : Math.PI;
  return dir === 1 ? -Math.PI / 2 : Math.PI / 2;
}

export function CityTraffic() {
  const carRefs = useRef<(THREE.Group | null)[]>([]);

  const cars = useMemo<CarState[]>(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const isPark = i < 4;
      const segIdx = isPark ? i % ROAD_SEGMENTS.length : Math.floor(Math.random() * ROAD_SEGMENTS.length);
      return {
        segIdx,
        t: isPark ? 0 : Math.random(),
        speed: 1.0 + Math.random() * 1.2,
        dir: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
        laneOff: Math.random() > 0.5 ? 0.55 : -0.55,
        parkMode: isPark,
        parkT: 0,
        parkTimer: 0,
        parkDuration: 3 + Math.random() * 5,
        parkPhase: isPark ? 'driving' : 'driving',
      };
    });
  }, []);

  useFrame((_, delta) => {
    cars.forEach((car, i) => {
      const mesh = carRefs.current[i];
      if (!mesh) return;

      const seg = ROAD_SEGMENTS[car.segIdx];
      const len = segLength(seg);

      if (car.parkMode) {
        const spot = PARK_SPOTS[i];
        if (!spot) return;

        if (car.parkPhase === 'driving' || car.parkPhase === 'leaving') {
          car.t += (car.dir * car.speed * delta) / len;
          if (car.t > 1) { car.t = 0; }
          if (car.t < 0) { car.t = 1; }

          const [cx, , cz] = segPos(seg, car.t, car.laneOff);
          const distToSpot = Math.sqrt((cx - spot.x) ** 2 + (cz - spot.z) ** 2);

          if (car.parkPhase === 'driving' && distToSpot < 2.5) {
            car.parkPhase = 'parking';
            car.parkT = 0;
          }
          if (car.parkPhase === 'leaving' && distToSpot > 5) {
            car.parkPhase = 'driving';
          }
          mesh.position.set(cx, 0.14, cz);
          mesh.rotation.y = segRotY(seg, car.dir);
        }

        if (car.parkPhase === 'parking') {
          car.parkT = Math.min(1, car.parkT + delta * 0.8);
          const [sx, , sz] = segPos(seg, car.t, car.laneOff);
          mesh.position.set(
            sx + (spot.x - sx) * car.parkT,
            0.14,
            sz + (spot.z - sz) * car.parkT,
          );
          if (car.parkT >= 1) {
            car.parkPhase = 'parked';
            car.parkTimer = 0;
          }
        }

        if (car.parkPhase === 'parked') {
          car.parkTimer += delta;
          if (car.parkTimer >= car.parkDuration) {
            car.parkPhase = 'leaving';
            car.parkDuration = 3 + Math.random() * 5;
          }
        }
      } else {
        // Normal driving
        car.t += (car.speed * delta) / len;
        if (car.t > 1) { car.t = 0; }

        const [px, py, pz] = segPos(seg, car.t, car.laneOff);
        mesh.position.set(px, py, pz);
        mesh.rotation.y = segRotY(seg, car.dir);
      }
    });
  });

  return (
    <group>
      {cars.map((car, i) => {
        const seg = ROAD_SEGMENTS[car.segIdx];
        const [ix, iy, iz] = segPos(seg, car.t, car.laneOff);
        const color = CAR_COLORS[i % CAR_COLORS.length];

        return (
          <group
            key={i}
            ref={el => { carRefs.current[i] = el; }}
            position={[ix, iy, iz]}
            rotation={[0, segRotY(seg, car.dir), 0]}
          >
            {/* Car body */}
            <mesh>
              <boxGeometry args={[0.7, 0.22, 0.38]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Cab */}
            <mesh position={[-0.05, 0.19, 0]}>
              <boxGeometry args={[0.38, 0.18, 0.32]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Headlights */}
            <mesh position={[0.36, 0.0, 0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#fffff0" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.36, 0.0, -0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#fffff0" side={THREE.DoubleSide} />
            </mesh>
            {/* Tail lights */}
            <mesh position={[-0.36, 0.0, 0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#ff2010" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-0.36, 0.0, -0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#ff2010" side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add app/components/CityTraffic.tsx
git commit -m "feat: city traffic — 15 animated cars with parking behavior"
```

---

## Task 5: City Pedestrians

**Files:**
- Create: `app/components/CityPedestrians.tsx`

**Step 1: Create CityPedestrians.tsx**

```tsx
// app/components/CityPedestrians.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PedState {
  x: number; z: number;
  tx: number; tz: number;      // walk target
  speed: number;
  scale: number;               // 0→1 for enter/exit animation
  behavior: 'walking' | 'entering' | 'inside' | 'leaving';
  timer: number;
  insideDuration: number;
  bobPhase: number;
  isVisitor: boolean;
  // entrance position for visitor
  entrX: number; entrZ: number;
  // walk bounds
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

// District sidewalk areas (raw world coords, inside city group)
const SIDEWALK_AREAS = [
  // frontend district sidewalks
  { minX: 4,  maxX: 14, minZ: 3.2, maxZ: 3.8, entr: [7,  4  ] },
  { minX: 4,  maxX: 14, minZ: 12.2,maxZ: 12.8,entr: [11, 12 ] },
  // backend
  { minX: 18, maxX: 28, minZ: 3.2, maxZ: 3.8, entr: [22, 4  ] },
  { minX: 18, maxX: 28, minZ: 12.2,maxZ: 12.8,entr: [24, 12 ] },
  // databases
  { minX: 4,  maxX: 14, minZ: 15.2,maxZ: 15.8,entr: [8,  16 ] },
  { minX: 4,  maxX: 14, minZ: 24.2,maxZ: 24.8,entr: [10, 24 ] },
  // devops
  { minX: 18, maxX: 28, minZ: 15.2,maxZ: 15.8,entr: [22, 16 ] },
  // testing
  { minX: 4,  maxX: 14, minZ: 27.2,maxZ: 27.8,entr: [8,  28 ] },
  // security
  { minX: 18, maxX: 28, minZ: 27.2,maxZ: 27.8,entr: [22, 28 ] },
  // system-design
  { minX: 32, maxX: 42, minZ: 3.2, maxZ: 3.8, entr: [36, 4  ] },
  // performance
  { minX: 32, maxX: 42, minZ: 15.2,maxZ: 15.8,entr: [36, 16 ] },
  // leadership
  { minX: 32, maxX: 44, minZ: 27.2,maxZ: 27.8,entr: [38, 28 ] },
];

// Muted accent colors per district
const PED_COLORS = [
  '#5090c0', '#30a060', '#7060a0', '#c06030',
  '#c04060', '#c04040', '#2870b0', '#c08030', '#a040c0',
];

export function CityPedestrians() {
  const bodyRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const headRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  const peds = useMemo<PedState[]>(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const area = SIDEWALK_AREAS[i % SIDEWALK_AREAS.length];
      const x = area.minX + Math.random() * (area.maxX - area.minX);
      const z = area.minZ + Math.random() * (area.maxZ - area.minZ);
      const isVisitor = i % 3 === 0; // every 3rd ped is a visitor
      return {
        x, z,
        tx: x + (Math.random() - 0.5) * 4,
        tz: z + (Math.random() - 0.5) * 0.3,
        speed: 0.35 + Math.random() * 0.35,
        scale: 1,
        behavior: 'walking',
        timer: Math.random() * 5,
        insideDuration: 2 + Math.random() * 6,
        bobPhase: Math.random() * Math.PI * 2,
        isVisitor,
        entrX: (area.entr as number[])[0],
        entrZ: (area.entr as number[])[1],
        minX: area.minX + 0.5,
        maxX: area.maxX - 0.5,
        minZ: area.minZ,
        maxZ: area.maxZ,
      };
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;

    peds.forEach((ped, i) => {
      const group = groupRefs.current[i];
      if (!group) return;

      if (ped.behavior === 'walking') {
        // Move toward target
        const dx = ped.tx - ped.x;
        const dz = ped.tz - ped.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.1) {
          // Pick new target within bounds
          ped.tx = ped.minX + Math.random() * (ped.maxX - ped.minX);
          ped.tz = ped.minZ + Math.random() * (ped.maxZ - ped.minZ);

          // Visitors: sometimes go to entrance
          if (ped.isVisitor && Math.random() < 0.3) {
            ped.tx = ped.entrX + (Math.random() - 0.5) * 0.5;
            ped.tz = ped.entrZ;
            ped.behavior = 'walking'; // will trigger 'entering' when close to entrance
          }
        } else {
          ped.x += (dx / dist) * ped.speed * delta;
          ped.z += (dz / dist) * ped.speed * delta;
        }

        // Check if visitor near entrance
        if (ped.isVisitor) {
          const de = Math.sqrt((ped.x - ped.entrX) ** 2 + (ped.z - ped.entrZ) ** 2);
          if (de < 0.4) {
            ped.behavior = 'entering';
            ped.timer = 0;
          }
        }

        const bob = Math.sin(time * 6 + ped.bobPhase) * 0.015;
        group.position.set(ped.x, 0.15 + bob, ped.z);
        group.scale.setScalar(ped.scale);

      } else if (ped.behavior === 'entering') {
        ped.scale = Math.max(0, ped.scale - delta * 2.5);
        group.scale.setScalar(ped.scale);
        if (ped.scale <= 0) {
          ped.behavior = 'inside';
          ped.timer = 0;
        }

      } else if (ped.behavior === 'inside') {
        group.scale.setScalar(0);
        ped.timer += delta;
        if (ped.timer >= ped.insideDuration) {
          ped.behavior = 'leaving';
          ped.scale = 0;
          // Reappear at entrance
          ped.x = ped.entrX + (Math.random() - 0.5) * 0.3;
          ped.z = ped.entrZ;
          group.position.set(ped.x, 0.15, ped.z);
        }

      } else if (ped.behavior === 'leaving') {
        ped.scale = Math.min(1, ped.scale + delta * 2.5);
        group.scale.setScalar(ped.scale);
        if (ped.scale >= 1) {
          ped.behavior = 'walking';
          ped.tx = ped.minX + Math.random() * (ped.maxX - ped.minX);
          ped.tz = ped.minZ + Math.random() * (ped.maxZ - ped.minZ);
        }
      }
    });
  });

  return (
    <group>
      {peds.map((ped, i) => {
        const color = PED_COLORS[i % PED_COLORS.length];
        return (
          <group
            key={i}
            ref={el => { groupRefs.current[i] = el; }}
            position={[ped.x, 0.15, ped.z]}
          >
            {/* Body */}
            <mesh ref={el => { bodyRefs.current[i] = el; }} position={[0, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.065, 0.22, 6]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Head */}
            <mesh ref={el => { headRefs.current[i] = el; }} position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.09, 6, 6]} />
              <meshLambertMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add app/components/CityPedestrians.tsx
git commit -m "feat: pedestrians — 24 animated figures with enter/exit building behavior"
```

---

## Task 6: City Parks & Gardens

**Files:**
- Create: `app/components/CityPark.tsx`

**Step 1: Create CityPark.tsx**

```tsx
// app/components/CityPark.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FlowerDef {
  x: number; z: number;
  color: string;
  freq: number;
  phase: number;
}

interface FountainArc {
  angle: number;
  phaseOffset: number;
}

interface ParkDef {
  cx: number; cz: number;  // center of garden patch
  flowers: FlowerDef[];
  trees: { x: number; z: number; scale: number }[];
  fountain: { x: number; z: number } | null;
}

// Garden patch centers — placed at open corners of each district
const PARKS: ParkDef[] = [
  // frontend district corner (col=2,row=2 → x=4,z=4 → corner patch at x=3,z=3)
  {
    cx: 3.2, cz: 3.2,
    flowers: [
      { x: -0.5, z:  0.3, color: '#ff6b8a', freq: 2.1, phase: 0.0 },
      { x:  0.3, z: -0.4, color: '#ffb347', freq: 1.7, phase: 1.2 },
      { x: -0.2, z: -0.6, color: '#7ec8e3', freq: 2.5, phase: 2.4 },
      { x:  0.6, z:  0.2, color: '#b8f5a0', freq: 1.9, phase: 0.8 },
      { x: -0.6, z:  0.6, color: '#ffd700', freq: 2.3, phase: 3.1 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.9, z: -0.2, scale: 0.6 }],
    fountain: { x: 0, z: 0 },
  },
  // backend district
  {
    cx: 17.2, cz: 3.2,
    flowers: [
      { x: -0.4, z: 0.2,  color: '#34d399', freq: 1.8, phase: 0.5 },
      { x:  0.4, z: -0.3, color: '#6ee7b7', freq: 2.2, phase: 1.8 },
      { x: -0.2, z: -0.5, color: '#a7f3d0', freq: 2.0, phase: 3.0 },
    ],
    trees: [{ x: 0.7, z: 0.7, scale: 0.65 }],
    fountain: null,
  },
  // databases district
  {
    cx: 3.2, cz: 15.2,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#a78bfa', freq: 2.4, phase: 0.3 },
      { x:  0.3, z: -0.5, color: '#c4b5fd', freq: 1.6, phase: 1.5 },
      { x:  0.5, z:  0.5, color: '#ddd6fe', freq: 2.0, phase: 2.7 },
      { x: -0.3, z: -0.2, color: '#7c3aed', freq: 1.9, phase: 0.9 },
    ],
    trees: [{ x: 0.8, z: -0.8, scale: 0.7 }, { x: -0.8, z: 0.8, scale: 0.6 }],
    fountain: { x: 0.1, z: 0.1 },
  },
  // devops
  {
    cx: 17.2, cz: 15.2,
    flowers: [
      { x: -0.4, z: 0.3,  color: '#fb923c', freq: 2.0, phase: 0.7 },
      { x:  0.4, z: -0.4, color: '#fed7aa', freq: 1.8, phase: 2.0 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.65 }],
    fountain: null,
  },
  // testing
  {
    cx: 3.2, cz: 27.2,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#f472b6', freq: 2.1, phase: 1.1 },
      { x:  0.3, z: -0.4, color: '#fbcfe8', freq: 1.9, phase: 2.3 },
      { x:  0.5, z:  0.4, color: '#fce7f3', freq: 2.3, phase: 0.4 },
    ],
    trees: [{ x: 0.8, z: -0.8, scale: 0.7 }],
    fountain: null,
  },
  // system-design
  {
    cx: 31.2, cz: 3.2,
    flowers: [
      { x: -0.4, z: 0.4,  color: '#38bdf8', freq: 2.2, phase: 0.6 },
      { x:  0.4, z: -0.3, color: '#7dd3fc', freq: 1.7, phase: 1.9 },
      { x: -0.3, z: -0.5, color: '#bae6fd', freq: 2.0, phase: 3.2 },
    ],
    trees: [{ x: 0.8, z: 0.8, scale: 0.7 }, { x: -0.8, z: -0.3, scale: 0.6 }],
    fountain: { x: -0.1, z: -0.1 },
  },
  // performance
  {
    cx: 31.2, cz: 15.2,
    flowers: [
      { x: -0.5, z: 0.3,  color: '#fbbf24', freq: 2.3, phase: 0.2 },
      { x:  0.4, z: -0.4, color: '#fde68a', freq: 1.8, phase: 1.4 },
    ],
    trees: [{ x: 0.7, z: 0.7, scale: 0.65 }],
    fountain: null,
  },
  // leadership
  {
    cx: 31.2, cz: 27.2,
    flowers: [
      { x: -0.5, z: 0.4,  color: '#e879f9', freq: 2.0, phase: 0.8 },
      { x:  0.4, z: -0.4, color: '#f0abfc', freq: 1.7, phase: 2.1 },
      { x: -0.2, z: -0.6, color: '#fae8ff', freq: 2.4, phase: 3.4 },
      { x:  0.6, z:  0.3, color: '#d946ef', freq: 1.9, phase: 1.0 },
    ],
    trees: [{ x: 0.9, z: 0.9, scale: 0.75 }, { x: -0.9, z: 0.2, scale: 0.65 }],
    fountain: { x: 0, z: -0.2 },
  },
];

// Fountain arc definitions (6 arcs per fountain)
const ARC_DEFS: FountainArc[] = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * Math.PI * 2,
  phaseOffset: i / 6,
}));

export function CityPark() {
  // One ref per flower across all parks
  const flowerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const fountainRefs = useRef<(THREE.Mesh | null)[]>([]);

  let flowerIdx = 0;
  let fountainIdx = 0;
  // Pre-compute indices for useFrame
  const flowerMeta = useRef<{ baseY: number; freq: number; phase: number }[]>([]);
  const fountainMeta = useRef<{ cx: number; cz: number; arcAngle: number; arcPhase: number }[]>([]);

  // Populate metadata on first render
  if (flowerMeta.current.length === 0) {
    PARKS.forEach(park => {
      park.flowers.forEach(f => {
        flowerMeta.current.push({ baseY: 0.16, freq: f.freq, phase: f.phase });
      });
      if (park.fountain) {
        ARC_DEFS.forEach(arc => {
          fountainMeta.current.push({
            cx: park.cx + park.fountain!.x,
            cz: park.cz + park.fountain!.z,
            arcAngle: arc.angle,
            arcPhase: arc.phaseOffset,
          });
        });
      }
    });
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    flowerRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const m = flowerMeta.current[i];
      if (!m) return;
      ref.position.y = m.baseY + Math.sin(t * m.freq + m.phase) * 0.07;
    });

    fountainRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const m = fountainMeta.current[i];
      if (!m) return;
      const tp = ((t * 0.9 + m.arcPhase) % 1);
      const arc = Math.sin(tp * Math.PI);
      ref.position.set(
        m.cx + Math.sin(m.arcAngle) * 0.38 * arc,
        0.18 + arc * 0.55,
        m.cz + Math.cos(m.arcAngle) * 0.38 * arc,
      );
    });
  });

  flowerIdx = 0;
  fountainIdx = 0;

  return (
    <group>
      {PARKS.map((park, pi) => (
        <group key={pi}>
          {/* Garden base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[park.cx, 0.02, park.cz]}>
            <planeGeometry args={[3.0, 3.0]} />
            <meshLambertMaterial color="#253a20" />
          </mesh>
          {/* Border */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[park.cx, 0.01, park.cz]}>
            <planeGeometry args={[3.3, 3.3]} />
            <meshLambertMaterial color="#1a2e16" />
          </mesh>

          {/* Flowers */}
          {park.flowers.map((f, fi) => {
            const thisFlowerIdx = flowerIdx++;
            return (
              <group key={fi} position={[park.cx + f.x, 0, park.cz + f.z]}>
                {/* Stem */}
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.14, 4]} />
                  <meshLambertMaterial color="#3a6030" />
                </mesh>
                {/* Bloom */}
                <mesh
                  ref={el => { flowerRefs.current[thisFlowerIdx] = el; }}
                  position={[0, 0.16, 0]}
                >
                  <sphereGeometry args={[0.1, 6, 6]} />
                  <meshLambertMaterial color={f.color} />
                </mesh>
              </group>
            );
          })}

          {/* Trees */}
          {park.trees.map((tr, ti) => (
            <group key={ti} position={[park.cx + tr.x, 0, park.cz + tr.z]} scale={tr.scale}>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.42, 6]} />
                <meshLambertMaterial color="#5c3a1a" />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <coneGeometry args={[0.52, 1.2, 8]} />
                <meshLambertMaterial color="#1e5c1e" />
              </mesh>
              <mesh position={[0, 1.3, 0]}>
                <coneGeometry args={[0.36, 0.9, 8]} />
                <meshLambertMaterial color="#226622" />
              </mesh>
            </group>
          ))}

          {/* Fountain */}
          {park.fountain && (
            <group position={[park.cx + park.fountain.x, 0, park.cz + park.fountain.z]}>
              {/* Base ring */}
              <mesh position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.52, 0.52, 0.12, 16]} />
                <meshLambertMaterial color="#7a8898" />
              </mesh>
              {/* Water pool */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.125, 0]}>
                <circleGeometry args={[0.44, 16]} />
                <meshStandardMaterial color="#2060a0" transparent opacity={0.65} />
              </mesh>
              {/* Center spout */}
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
                <meshLambertMaterial color="#8090a0" />
              </mesh>
              {/* Water arc spheres */}
              {ARC_DEFS.map((arc, ai) => {
                const thisFountainIdx = fountainIdx++;
                const initT = ai / 6;
                const initArc = Math.sin(initT * Math.PI);
                return (
                  <mesh
                    key={ai}
                    ref={el => { fountainRefs.current[thisFountainIdx] = el; }}
                    position={[
                      Math.sin(arc.angle) * 0.38 * initArc,
                      0.18 + initArc * 0.55,
                      Math.cos(arc.angle) * 0.38 * initArc,
                    ]}
                  >
                    <sphereGeometry args={[0.06, 5, 5]} />
                    <meshStandardMaterial color="#80c8ff" transparent opacity={0.8} />
                  </mesh>
                );
              })}
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add app/components/CityPark.tsx
git commit -m "feat: parks with bobbing flowers, stylized trees, animated fountains"
```

---

## Task 7: Wire Everything Up in CityWorld

**Files:**
- Modify: `app/components/CityWorld.tsx`

**Step 1: Update CityWorld.tsx imports and render**

Replace the full file:

```tsx
// app/components/CityWorld.tsx
'use client';

import { districts } from '../data/city';
import { tileToWorld, TILE_SIZE } from '../lib/cityLayout';
import { DistrictGround } from './DistrictGround';
import { CityBuilding } from './CityBuilding';
import { RoadSystem } from './RoadSystem';
import { CityTraffic } from './CityTraffic';
import { CityPedestrians } from './CityPedestrians';
import { CityPark } from './CityPark';

const DISTRICT_COLORS: Record<string, { ground: string; accent: string }> = {
  frontend:         { ground: '#1e3a5f', accent: '#60a5fa' },
  backend:          { ground: '#064e3b', accent: '#34d399' },
  databases:        { ground: '#2e1065', accent: '#a78bfa' },
  devops:           { ground: '#431407', accent: '#fb923c' },
  testing:          { ground: '#500724', accent: '#f472b6' },
  security:         { ground: '#450a0a', accent: '#f87171' },
  'system-design':  { ground: '#0c4a6e', accent: '#38bdf8' },
  performance:      { ground: '#451a03', accent: '#fbbf24' },
  leadership:       { ground: '#3b0764', accent: '#e879f9' },
};

type RooftopStyle = 'antenna' | 'watertower' | 'ac' | 'satellite' | 'spire';

interface DistrictStyle {
  rooftop: RooftopStyle;
  windowRows: number;
  windowCols: number;
  bodyDark: number;
  lobbyDark: number;
}

const DISTRICT_STYLES: Record<string, DistrictStyle> = {
  frontend:         { rooftop: 'antenna',    windowRows: 3, windowCols: 3, bodyDark: 0.25, lobbyDark: 0.15 },
  backend:          { rooftop: 'watertower', windowRows: 2, windowCols: 2, bodyDark: 0.35, lobbyDark: 0.20 },
  databases:        { rooftop: 'ac',         windowRows: 2, windowCols: 3, bodyDark: 0.30, lobbyDark: 0.18 },
  devops:           { rooftop: 'ac',         windowRows: 2, windowCols: 2, bodyDark: 0.38, lobbyDark: 0.22 },
  testing:          { rooftop: 'satellite',  windowRows: 2, windowCols: 3, bodyDark: 0.28, lobbyDark: 0.16 },
  security:         { rooftop: 'spire',      windowRows: 1, windowCols: 2, bodyDark: 0.40, lobbyDark: 0.25 },
  'system-design':  { rooftop: 'antenna',    windowRows: 3, windowCols: 3, bodyDark: 0.26, lobbyDark: 0.15 },
  performance:      { rooftop: 'spire',      windowRows: 2, windowCols: 3, bodyDark: 0.22, lobbyDark: 0.13 },
  leadership:       { rooftop: 'watertower', windowRows: 3, windowCols: 3, bodyDark: 0.24, lobbyDark: 0.14 },
};

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

export function CityWorld({ level, onBuildingClick, selectedBuilding }: Props) {
  const CITY_OFFSET_X = -24;
  const CITY_OFFSET_Z = -20;

  return (
    <group position={[CITY_OFFSET_X, 0, CITY_OFFSET_Z]}>
      {/* Global asphalt base — lighter daytime color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, -0.05, 20]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color="#2a3f52" />
      </mesh>

      {/* Road system */}
      <RoadSystem />

      {/* Parks & gardens */}
      <CityPark />

      {/* District grounds + buildings */}
      {districts.map(district => {
        const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
        const dStyle = DISTRICT_STYLES[district.id] ?? DISTRICT_STYLES['frontend'];
        const isVisible = district.appearsAtLevel <= level;

        return (
          <group key={district.id}>
            <DistrictGround
              district={district}
              groundColor={colors.ground}
              accentColor={colors.accent}
              level={level}
            />

            {isVisible && district.buildings.map(building => (
              <CityBuilding
                key={building.id}
                building={building}
                district={district}
                level={level}
                accentColor={colors.accent}
                districtStyle={dStyle}
                isSelected={
                  selectedBuilding?.districtId === district.id &&
                  selectedBuilding?.buildingId === building.id
                }
                onBuildingClick={onBuildingClick}
              />
            ))}
          </group>
        );
      })}

      {/* Traffic */}
      <CityTraffic />

      {/* Pedestrians */}
      <CityPedestrians />
    </group>
  );
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors

**Step 3: Full visual check**

```bash
npm run dev
```

Navigate to http://localhost:3000. Verify:
- [ ] Blue sky + drifting clouds visible
- [ ] Wide roads with lane dashes, sidewalks, crosswalks at intersections
- [ ] Buildings have floor ledges, window grids, lobby base, rooftop details
- [ ] Cars slide along roads, some park near buildings
- [ ] Pedestrians walk sidewalks, some enter/exit buildings
- [ ] Garden patches with bobbing flowers, trees, animated fountains in district corners
- [ ] Level slider still works — new districts appear, buildings grow floor by floor

**Step 4: Delete old RoadGrid.tsx**

```bash
rm app/components/RoadGrid.tsx
```

**Step 5: Final TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire up vibrant city — sky, roads, buildings, traffic, pedestrians, parks"
```

---

## Execution Order

Tasks 1, 2, 3, 5, 6 are independent — run in parallel.
Task 4 requires Task 2 (needs ROAD_SEGMENTS export).
Task 7 requires all others.

```
Phase A (parallel): Task 1, Task 2, Task 3, Task 5, Task 6
Phase B:            Task 4  (after Task 2 complete)
Phase C:            Task 7  (after all complete)
```
