# Three.js Isometric City Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 2D canvas city with a vibrant React Three Fiber 3D isometric city featuring real 3D buildings with facades/windows, road tiles, trees, pan/zoom controls, and spring-animated floor growth.

**Architecture:** R3F Canvas wraps an isometric OrthographicCamera locked at 45°/35.26°. District ground planes, road tiles, and procedural building meshes are React components. Animation uses useFrame with spring physics per-floor. Click detection uses R3F raycasting with userData.

**Tech Stack:** `three`, `@react-three/fiber`, `@react-three/drei` (OrbitControls, MapControls), existing `app/data/city.ts` (unchanged), existing `LevelSlider.tsx` / `BuildingPanel.tsx` (unchanged).

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
cd /Users/cowcow02/Repo/beyond-vibe-coding
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

**Step 2: Verify installation**

```bash
npm ls three @react-three/fiber @react-three/drei
```

Expected: three, @react-three/fiber, @react-three/drei listed without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install three.js + react-three-fiber + drei"
```

---

## Task 2: Scene Foundation — Camera, Lighting, Controls

**Files:**
- Create: `app/components/CityScene.tsx`
- Modify: `app/components/CityCanvas.tsx` (replace all content)

**Step 1: Create CityScene.tsx**

This is the R3F Canvas root, replacing `CityCanvas.tsx`'s canvas element entirely.

```tsx
// app/components/CityScene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { CityWorld } from './CityWorld';

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

// Isometric camera constants
const CAM_DISTANCE = 80;
const CAM_ANGLE_DEG = 35.264; // arctan(1/sqrt(2)) — true isometric
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
  const frustumSize = 50;

  return (
    <Canvas
      className="fixed inset-0 w-full h-full"
      style={{ background: '#0f172a' }}
      orthographic
      camera={{
        position: camPos,
        zoom: 1,
        near: 0.1,
        far: 1000,
        up: [0, 1, 0],
      }}
      shadows
    >
      {/* Ambient + directional lighting for isometric look */}
      <ambientLight intensity={0.6} color="#c8d8ff" />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.2}
        color="#fff8e7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight position={[-10, 20, -10]} intensity={0.3} color="#a0c4ff" />

      {/* Pan/zoom controls — locked rotation, map-style pan */}
      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minZoom={0.5}
        maxZoom={5}
        panSpeed={1.5}
        zoomSpeed={1.2}
        target={[0, 0, 0]}
      />

      <CityWorld
        level={level}
        onBuildingClick={onBuildingClick}
        selectedBuilding={selectedBuilding}
      />
    </Canvas>
  );
}
```

**Step 2: Replace CityCanvas.tsx to re-export CityScene**

```tsx
// app/components/CityCanvas.tsx
export { default } from './CityScene';
```

This preserves the import in `page.tsx` without any changes there.

**Step 3: Start dev server and verify it loads without crash**

```bash
npm run dev
```

Open http://localhost:3000 — expect dark background, no errors in console.

**Step 4: Commit**

```bash
git add app/components/CityScene.tsx app/components/CityCanvas.tsx
git commit -m "feat: r3f canvas with isometric camera + lighting + mapcontrols"
```

---

## Task 3: District Ground Planes + Road Grid

**Files:**
- Create: `app/components/CityWorld.tsx`
- Create: `app/lib/cityLayout.ts`

**Step 1: Create cityLayout.ts — world coordinate math**

Each grid tile is `TILE_SIZE` × `TILE_SIZE` world units. Grid `(col, row)` maps to world `(x, z)`.

```ts
// app/lib/cityLayout.ts
export const TILE_SIZE = 2;         // world units per grid tile
export const FLOOR_HEIGHT = 0.8;    // world units per building floor
export const ROAD_WIDTH = 1;        // 1 tile wide roads between districts

export function tileToWorld(col: number, row: number): [number, number] {
  return [col * TILE_SIZE, row * TILE_SIZE];
}

export function districtCenter(
  originCol: number, originRow: number,
  cols: number, rows: number
): [number, number] {
  const [x0, z0] = tileToWorld(originCol, originRow);
  return [
    x0 + (cols * TILE_SIZE) / 2,
    z0 + (rows * TILE_SIZE) / 2,
  ];
}
```

**Step 2: Create CityWorld.tsx — ground planes + road base**

```tsx
// app/components/CityWorld.tsx
'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { districts } from '../data/city';
import { tileToWorld, TILE_SIZE, districtCenter } from '../lib/cityLayout';
import { DistrictGround } from './DistrictGround';
import { CityBuilding } from './CityBuilding';

// District colors matching existing palette
const DISTRICT_COLORS: Record<string, { ground: string; accent: string }> = {
  frontend:       { ground: '#1e3a5f', accent: '#60a5fa' },
  backend:        { ground: '#064e3b', accent: '#34d399' },
  databases:      { ground: '#2e1065', accent: '#a78bfa' },
  devops:         { ground: '#431407', accent: '#fb923c' },
  testing:        { ground: '#500724', accent: '#f472b6' },
  security:       { ground: '#450a0a', accent: '#f87171' },
  'system-design':{ ground: '#0c4a6e', accent: '#38bdf8' },
  performance:    { ground: '#451a03', accent: '#fbbf24' },
  leadership:     { ground: '#3b0764', accent: '#e879f9' },
};

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

export function CityWorld({ level, onBuildingClick, selectedBuilding }: Props) {
  const visibleDistricts = districts.filter(d => d.appearsAtLevel <= level);

  return (
    <group>
      {/* Global ground plane — road/asphalt color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color="#1e293b" />
      </mesh>

      {visibleDistricts.map(district => {
        const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
        return (
          <group key={district.id}>
            <DistrictGround
              district={district}
              groundColor={colors.ground}
              accentColor={colors.accent}
              level={level}
            />
            {district.buildings.map(building => (
              <CityBuilding
                key={building.id}
                building={building}
                district={district}
                level={level}
                accentColor={colors.accent}
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
    </group>
  );
}
```

**Step 3: Create DistrictGround.tsx**

```tsx
// app/components/DistrictGround.tsx
'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { type District } from '../data/city';
import { tileToWorld, TILE_SIZE, districtCenter } from '../lib/cityLayout';

interface Props {
  district: District;
  groundColor: string;
  accentColor: string;
  level: number;
}

export function DistrictGround({ district, groundColor, accentColor, level }: Props) {
  const [cx, cz] = districtCenter(
    district.originCol, district.originRow,
    district.cols, district.rows
  );
  const width  = district.cols * TILE_SIZE;
  const depth  = district.rows * TILE_SIZE;

  return (
    <group position={[cx, 0, cz]}>
      {/* Ground slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshLambertMaterial color={groundColor} />
      </mesh>
      {/* Thin edge border in accent color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[width + 0.2, depth + 0.2]} />
        <meshLambertMaterial color={accentColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
```

**Step 4: Verify ground planes render**

Start dev server, check that colored district rectangles appear on dark road base.

**Step 5: Commit**

```bash
git add app/components/CityWorld.tsx app/components/DistrictGround.tsx app/lib/cityLayout.ts
git commit -m "feat: district ground planes + road base grid"
```

---

## Task 4: Procedural Building Component

**Files:**
- Create: `app/components/CityBuilding.tsx`

This is the most complex component. Each building is a stack of floor boxes. Each floor has:
- A box body (main structure)
- Window strips on front + right faces (emissive planes slightly in front of faces)
- Roof decoration on top floor

**Step 1: Create CityBuilding.tsx**

```tsx
// app/components/CityBuilding.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Building, type District } from '../data/city';
import { tileToWorld, TILE_SIZE, FLOOR_HEIGHT } from '../lib/cityLayout';

const FLOOR_W = TILE_SIZE * 0.82;  // building footprint slightly smaller than tile
const FLOOR_D = TILE_SIZE * 0.82;

interface FloorState {
  targetY: number;
  currentY: number;
  velocity: number;
  visible: boolean;
}

interface Props {
  building: Building;
  district: District;
  level: number;
  accentColor: string;
  isSelected: boolean;
  onBuildingClick: (districtId: string, buildingId: string) => void;
}

export function CityBuilding({
  building, district, level, accentColor, isSelected, onBuildingClick,
}: Props) {
  const [wx, wz] = tileToWorld(
    district.originCol + building.col,
    district.originRow + building.row,
  );

  const numFloors = Math.min(level + 1, 6);

  // Per-floor spring animation state
  const floorStates = useRef<FloorState[]>(
    Array.from({ length: 6 }, (_, i) => ({
      targetY:  i < numFloors ? 0 : -30,
      currentY: i < numFloors ? 0 : -30,
      velocity: 0,
      visible:  i < numFloors,
    }))
  );

  // When level changes, animate floors in/out
  useEffect(() => {
    const newCount = Math.min(level + 1, 6);
    floorStates.current.forEach((fs, i) => {
      if (i < newCount) {
        // Drop from sky
        fs.currentY = 25 + i * 2;
        fs.velocity = 0;
        fs.targetY  = 0;
        fs.visible  = true;
      } else {
        // Fly upward and away
        fs.targetY  = 30;
        fs.velocity = 0.5;
      }
    });
  }, [level]);

  // Refs for each floor mesh (up to 6 floors)
  const floorRefs = useRef<(THREE.Mesh | null)[]>(Array(6).fill(null));

  useFrame((_, delta) => {
    const stiffness = 200;
    const damping   = 18;

    floorStates.current.forEach((fs, i) => {
      if (!fs.visible && fs.currentY >= 28) return;

      // Spring physics: F = stiffness * (target - current) - damping * velocity
      const force = stiffness * (fs.targetY - fs.currentY) - damping * fs.velocity;
      fs.velocity += force * delta;
      fs.currentY += fs.velocity * delta;

      const mesh = floorRefs.current[i];
      if (mesh) {
        // Floor i sits at height i * FLOOR_HEIGHT, offset by animation
        const baseY = i * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
        mesh.position.y = baseY + fs.currentY;

        // Hide if animated out far enough
        if (!fs.visible && fs.currentY > 25) {
          mesh.visible = false;
        } else {
          mesh.visible = true;
        }
      }
    });
  });

  const accent = new THREE.Color(accentColor);
  const bodyColor = accent.clone().multiplyScalar(0.35);
  const topColor  = accent.clone().multiplyScalar(0.55);
  const windowColor = accent.clone().multiplyScalar(1.6);

  return (
    <group
      position={[wx + TILE_SIZE / 2, 0, wz + TILE_SIZE / 2]}
      onClick={(e) => {
        e.stopPropagation();
        onBuildingClick(district.id, building.id);
      }}
    >
      {Array.from({ length: 6 }, (_, floorIdx) => {
        const isTop = floorIdx === numFloors - 1;
        const isFloorVisible = floorIdx < numFloors;

        return (
          <FloorMesh
            key={floorIdx}
            floorIdx={floorIdx}
            ref={(el) => { floorRefs.current[floorIdx] = el; }}
            bodyColor={`#${bodyColor.getHexString()}`}
            topColor={`#${topColor.getHexString()}`}
            windowColor={`#${windowColor.getHexString()}`}
            accentColor={accentColor}
            isTop={isTop && isFloorVisible}
            isSelected={isSelected}
            visible={isFloorVisible}
          />
        );
      })}
    </group>
  );
}

interface FloorMeshProps {
  floorIdx: number;
  bodyColor: string;
  topColor: string;
  windowColor: string;
  accentColor: string;
  isTop: boolean;
  isSelected: boolean;
  visible: boolean;
}

import { forwardRef } from 'react';

const FloorMesh = forwardRef<THREE.Mesh, FloorMeshProps>(function FloorMesh(
  { floorIdx, bodyColor, topColor, windowColor, accentColor, isTop, isSelected, visible },
  ref
) {
  const baseY = floorIdx * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
  const scale = isSelected ? 1.06 : 1;

  return (
    <group visible={visible}>
      {/* Main box */}
      <mesh
        ref={ref}
        position={[0, baseY, 0]}
        scale={[scale, 1, scale]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[FLOOR_W, FLOOR_HEIGHT * 0.95, FLOOR_D]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>

      {/* Window strip — front face */}
      <mesh position={[0, baseY + FLOOR_HEIGHT * 0.1, FLOOR_D / 2 + 0.01]}>
        <planeGeometry args={[FLOOR_W * 0.7, FLOOR_HEIGHT * 0.4]} />
        <meshStandardMaterial
          color={windowColor}
          emissive={windowColor}
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Window strip — right face */}
      <mesh
        position={[FLOOR_W / 2 + 0.01, baseY + FLOOR_HEIGHT * 0.1, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[FLOOR_D * 0.7, FLOOR_HEIGHT * 0.4]} />
        <meshStandardMaterial
          color={windowColor}
          emissive={windowColor}
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Roof trim on top floor */}
      {isTop && (
        <mesh position={[0, baseY + FLOOR_HEIGHT / 2 + 0.04, 0]}>
          <boxGeometry args={[FLOOR_W + 0.1, 0.08, FLOOR_D + 0.1]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.6}
          />
        </mesh>
      )}
    </group>
  );
});
```

**Step 2: Verify buildings appear in browser**

Run dev server. At L0, two districts (Frontend, Backend) should show colored 3D boxes. Slider to L5 should stack 6 floors.

**Step 3: Commit**

```bash
git add app/components/CityBuilding.tsx
git commit -m "feat: procedural 3d building component with spring floor animation"
```

---

## Task 5: Road Tiles Between Districts

**Files:**
- Create: `app/components/RoadGrid.tsx`
- Modify: `app/components/CityWorld.tsx` (add `<RoadGrid />`)

**Step 1: Create RoadGrid.tsx**

Roads are simply taller/lighter strips between districts. We use the dark ground as base; road markings are thin white planes laid on top.

```tsx
// app/components/RoadGrid.tsx
'use client';

import { districts } from '../data/city';
import { tileToWorld, TILE_SIZE } from '../lib/cityLayout';

// Calculate bounding box of entire city for road sizing
function getCityBounds() {
  let minCol = Infinity, maxCol = -Infinity;
  let minRow = Infinity, maxRow = -Infinity;
  districts.forEach(d => {
    minCol = Math.min(minCol, d.originCol);
    maxCol = Math.max(maxCol, d.originCol + d.cols);
    minRow = Math.min(minRow, d.originRow);
    maxRow = Math.max(maxRow, d.originRow + d.rows);
  });
  return { minCol, maxCol, minRow, maxRow };
}

export function RoadGrid() {
  const bounds = getCityBounds();

  // Dashed center-line markings along column gaps
  const markings: Array<{ x: number; z: number; w: number; d: number; rot: number }> = [];

  // Horizontal road lines (between row groups)
  const rowGaps = new Set<number>();
  districts.forEach(d => {
    rowGaps.add(d.originRow);
    rowGaps.add(d.originRow + d.rows);
  });

  rowGaps.forEach(row => {
    const [, z] = tileToWorld(0, row);
    const totalW = (bounds.maxCol - bounds.minCol) * TILE_SIZE;
    const [startX] = tileToWorld(bounds.minCol, 0);
    markings.push({ x: startX + totalW / 2, z, w: totalW, d: 0.08, rot: 0 });
  });

  // Vertical road lines (between col groups)
  const colGaps = new Set<number>();
  districts.forEach(d => {
    colGaps.add(d.originCol);
    colGaps.add(d.originCol + d.cols);
  });

  colGaps.forEach(col => {
    const [x] = tileToWorld(col, 0);
    const totalD = (bounds.maxRow - bounds.minRow) * TILE_SIZE;
    const [, startZ] = tileToWorld(0, bounds.minRow);
    markings.push({ x, z: startZ + totalD / 2, w: 0.08, d: totalD, rot: 0 });
  });

  return (
    <group>
      {markings.map((m, i) => (
        <mesh key={i} position={[m.x, 0.02, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[m.w, m.d]} />
          <meshBasicMaterial color="#475569" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}
```

**Step 2: Add RoadGrid to CityWorld.tsx**

In `CityWorld.tsx`, import and place `<RoadGrid />` inside the root `<group>`:

```tsx
import { RoadGrid } from './RoadGrid';
// ...inside the return:
<RoadGrid />
```

**Step 3: Verify roads visible**

Subtle grey lines should appear between district blocks.

**Step 4: Commit**

```bash
git add app/components/RoadGrid.tsx app/components/CityWorld.tsx
git commit -m "feat: road grid markings between districts"
```

---

## Task 6: Trees + Street Decorations

**Files:**
- Create: `app/components/CityTree.tsx`
- Modify: `app/components/CityWorld.tsx` (scatter trees on road tiles)

**Step 1: Create CityTree.tsx — low-poly cone tree**

```tsx
// app/components/CityTree.tsx
'use client';

interface Props {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

export function CityTree({ position, scale = 1, color = '#16a34a' }: Props) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.6, 6]} />
        <meshLambertMaterial color="#78350f" />
      </mesh>
      {/* Bottom canopy */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.45, 0.7, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Middle canopy */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.32, 0.6, 6]} />
        <meshLambertMaterial color="#15803d" />
      </mesh>
      {/* Top canopy */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.18, 0.45, 6]} />
        <meshLambertMaterial color="#166534" />
      </mesh>
    </group>
  );
}
```

**Step 2: Add tree placement to CityWorld.tsx**

Add deterministic tree positions near road edges. Seed positions from district IDs so they don't change on re-render:

```tsx
import { CityTree } from './CityTree';

// Inside CityWorld, after <RoadGrid />:
{visibleDistricts.map(district => {
  // Place one tree at each corner of the district (on road, offset outward by 1 tile)
  const trees: Array<[number, number, number]> = [];
  const [ox, oz] = tileToWorld(district.originCol, district.originRow);
  const w = district.cols * TILE_SIZE;
  const d = district.rows * TILE_SIZE;

  trees.push([ox - TILE_SIZE * 0.6, 0, oz - TILE_SIZE * 0.6]);
  trees.push([ox + w + TILE_SIZE * 0.1, 0, oz - TILE_SIZE * 0.6]);
  trees.push([ox - TILE_SIZE * 0.6, 0, oz + d + TILE_SIZE * 0.1]);

  return trees.map((pos, i) => (
    <CityTree key={`${district.id}-tree-${i}`} position={pos} scale={0.7} />
  ));
})}
```

**Step 3: Verify trees appear on road tiles**

Small green cone trees should dot the road areas around districts.

**Step 4: Commit**

```bash
git add app/components/CityTree.tsx app/components/CityWorld.tsx
git commit -m "feat: low-poly cone trees on road tiles"
```

---

## Task 7: District Appear / Disappear Animation

**Files:**
- Modify: `app/components/DistrictGround.tsx` (add fade-in/out via opacity spring)
- Modify: `app/components/CityWorld.tsx` (track which districts are animating)

**Step 1: Update DistrictGround.tsx with opacity animation**

```tsx
// Additions to DistrictGround.tsx
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface Props {
  district: District;
  groundColor: string;
  accentColor: string;
  level: number;
}

export function DistrictGround({ district, groundColor, accentColor, level }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  const prevLevel = useRef(level);

  const isVisible = district.appearsAtLevel <= level;
  const wasVisible = district.appearsAtLevel <= prevLevel.current;

  useEffect(() => {
    if (!wasVisible && isVisible) {
      opacityRef.current = 0; // start invisible, fade in
    }
    prevLevel.current = level;
  }, [level, isVisible, wasVisible]);

  useFrame((_, delta) => {
    const target = isVisible ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * Math.min(1, delta * 4);
    if (groupRef.current) {
      groupRef.current.children.forEach(child => {
        if ((child as THREE.Mesh).material) {
          ((child as THREE.Mesh).material as THREE.MeshLambertMaterial).opacity = opacityRef.current;
        }
      });
    }
  });

  const [cx, cz] = districtCenter(
    district.originCol, district.originRow,
    district.cols, district.rows
  );
  const width = district.cols * TILE_SIZE;
  const depth = district.rows * TILE_SIZE;

  return (
    <group ref={groupRef} position={[cx, 0, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshLambertMaterial color={groundColor} transparent opacity={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[width + 0.2, depth + 0.2]} />
        <meshLambertMaterial color={accentColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
```

**Step 2: Verify districts fade in when slider advances**

Move slider from L0 to L1 — Databases district should fade in smoothly.

**Step 3: Commit**

```bash
git add app/components/DistrictGround.tsx
git commit -m "feat: district fade-in animation on level change"
```

---

## Task 8: Click Raycasting + Building Labels

**Files:**
- Modify: `app/components/CityBuilding.tsx` (verify onClick works, add hover state)
- Create: `app/components/BuildingLabel.tsx` (floating name above building)

**Step 1: Add floating building label**

```tsx
// app/components/BuildingLabel.tsx
'use client';

import { Text } from '@react-three/drei';

interface Props {
  name: string;
  position: [number, number, number];
}

export function BuildingLabel({ name, position }: Props) {
  return (
    <Text
      position={position}
      fontSize={0.28}
      color="#e2e8f0"
      anchorX="center"
      anchorY="bottom"
      font="/fonts/SpaceMono-Regular.woff"
      outlineWidth={0.02}
      outlineColor="#0f172a"
    >
      {name}
    </Text>
  );
}
```

**Step 2: Add label to CityBuilding.tsx**

Inside the `CityBuilding` component, below the floor group, add:

```tsx
import { BuildingLabel } from './BuildingLabel';

// Below the floors Array.from:
{numFloors > 0 && (
  <BuildingLabel
    name={building.name}
    position={[0, numFloors * FLOOR_HEIGHT + 0.3, 0]}
  />
)}
```

**Step 3: Verify click detection in browser**

Click a building — the right panel should slide in with floor details. Click elsewhere → panel closes. This uses R3F's built-in raycasting via `onClick` on the group.

**Step 4: Add hover cursor change**

In `CityScene.tsx`, set `gl.domElement.style.cursor` on hover:

```tsx
// Inside the Canvas, add this component:
function CursorManager() {
  useFrame(({ raycaster, scene }) => {
    // R3F handles this via pointer events
  });
  return null;
}
```

Actually, R3F handles cursor automatically via `onPointerEnter`/`onPointerLeave` on the CityBuilding group. Add to `CityBuilding`:

```tsx
<group
  ...
  onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
  onPointerLeave={() => { document.body.style.cursor = 'default'; }}
>
```

**Step 5: Commit**

```bash
git add app/components/BuildingLabel.tsx app/components/CityBuilding.tsx
git commit -m "feat: floating building labels + hover cursor"
```

---

## Task 9: Font Asset + Polish Pass

**Files:**
- Add: `public/fonts/SpaceMono-Regular.woff` (download from Google Fonts CDN)
- Modify: `app/components/CityScene.tsx` (add fog, stars background)
- Modify: `app/components/CityBuilding.tsx` (selection glow ring)

**Step 1: Download Space Mono font**

```bash
curl -L "https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.woff2" \
  -o public/fonts/SpaceMono-Regular.woff2
```

Update `BuildingLabel.tsx` to use `.woff2`:

```tsx
font="/fonts/SpaceMono-Regular.woff2"
```

**Step 2: Add atmospheric fog to CityScene.tsx**

Inside the Canvas, add:

```tsx
<fog attach="fog" args={['#0f172a', 80, 200]} />
```

**Step 3: Add selection glow ring to CityBuilding.tsx**

When `isSelected`, show a ring at base:

```tsx
{isSelected && (
  <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[FLOOR_W * 0.55, FLOOR_W * 0.65, 32]} />
    <meshBasicMaterial color={accentColor} transparent opacity={0.8} />
  </mesh>
)}
```

**Step 4: Final end-to-end test**

1. Open http://localhost:3000
2. Drag to pan city — verify smooth panning
3. Scroll to zoom — verify zoom in/out works
4. Move slider L0 → L5 — verify floors drop in, districts appear
5. Move slider L5 → L0 — verify floors fly away
6. Click a building — verify right panel shows floor breakdown
7. Click elsewhere — verify panel closes
8. Verify labels visible above buildings

**Step 5: Final commit**

```bash
git add public/fonts/ app/components/CityScene.tsx app/components/CityBuilding.tsx app/components/BuildingLabel.tsx
git commit -m "feat: font asset + fog + selection ring — r3f city complete"
```

---

## Summary

| Task | What it builds |
|------|----------------|
| 1 | Install three + r3f + drei |
| 2 | Camera, lights, MapControls scene foundation |
| 3 | District ground planes, road base grid |
| 4 | Procedural 3D buildings with spring floor animation |
| 5 | Road grid markings between districts |
| 6 | Low-poly cone trees on road tiles |
| 7 | District fade-in/out animation |
| 8 | Click raycasting, floating labels, hover cursor |
| 9 | Font, fog, selection glow, final polish |

**Execution note:** Tasks 1–2 must complete before others. Tasks 3–6 can run in parallel after Task 2. Tasks 7–8 depend on Tasks 3+4. Task 9 is final polish after all others.
