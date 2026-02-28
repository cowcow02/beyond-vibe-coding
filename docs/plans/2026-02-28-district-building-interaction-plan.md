# District & Building Interaction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Three-mode navigation (city → district zoom → building overlay) with district labels, a camera rig that pans/zooms to focused districts, a district info strip, and a 50/50 building overlay with a live mini R3F canvas.

**Architecture:** A `mode` state machine in `page.tsx` drives the UI. A `CameraRig` component (replacing `AutoZoom`) handles all camera animation — zooming to fit all districts in city mode, or panning + zooming to a single district block in district mode. The building overlay is a full-screen overlay with a second `<Canvas>` rendering just the focused building. No camera rotation — isometric angle is preserved throughout.

**Tech Stack:** Next.js 14, React Three Fiber, @react-three/drei (Html, OrbitControls), Three.js, Tailwind CSS

---

### Task 1: Add `tagline` to District type and data

**Files:**
- Modify: `app/data/city.ts`

**Step 1: Add `tagline` field to the District interface**

In `app/data/city.ts`, find the `District` interface (line 18) and add `tagline`:

```ts
export interface District {
  id: string;
  name: string;
  tagline: string;           // ← add this line
  type: 'technical' | 'non-technical';
  appearsAtLevel: number;
  originCol: number;
  originRow: number;
  cols: number;
  rows: number;
  buildings: Building[];
}
```

**Step 2: Add tagline strings to each of the 9 district objects**

Find each district in the `districts` array and add a `tagline` right after `name`:

```ts
// frontend
tagline: 'Where browsers meet ambition',

// backend
tagline: 'The engine beneath every click',

// databases
tagline: 'Where data finds its shape',

// devops
tagline: 'Ships sail, systems scale',

// testing
tagline: 'Confidence, quantified',

// security
tagline: 'Trust nothing, verify everything',

// system-design
tagline: 'Architecture at the scale of ambition',

// performance
tagline: 'Every millisecond is a choice',

// leadership
tagline: 'The code that shapes the team',
```

**Step 3: Verify no TypeScript errors**

```bash
cd /Users/cowcow02/Repo/beyond-vibe-coding
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing unrelated ones).

**Step 4: Commit**

```bash
git add app/data/city.ts
git commit -m "feat: add tagline field to District data"
```

---

### Task 2: Add `selectedFloor` glow to CityBuilding

**Files:**
- Modify: `app/components/CityBuilding.tsx`

**Step 1: Add `selectedFloor` to Props interface**

Find the `Props` interface (around line 20) and add:

```ts
interface Props {
  // ... existing props ...
  selectedFloor?: number;   // ← add this
}
```

**Step 2: Destructure `selectedFloor` in the component function**

Find the component signature (line ~39):

```ts
export function CityBuilding({
  building, district, level, accentColor, districtStyle, isSelected, onBuildingClick,
  worldX, worldZ, facing,
}: Props) {
```

Change to:

```ts
export function CityBuilding({
  building, district, level, accentColor, districtStyle, isSelected, onBuildingClick,
  worldX, worldZ, facing, selectedFloor,
}: Props) {
```

**Step 3: Render amber glow box on the selected floor**

Inside the `Array.from({ length: 6 }, (_, floorIdx) => {` render block (around line 169), find the closing `</group>` of each floor group. Just before the floor group closes, add the glow mesh — insert this after the lobby door block and before `{/* Rooftop details */}`:

```tsx
{/* Selected-floor amber glow */}
{selectedFloor === floorIdx && (
  <mesh>
    <boxGeometry args={[fw + 0.14, fh + 0.08, fd + 0.14]} />
    <meshStandardMaterial
      color="#f59e0b"
      emissive="#f59e0b"
      emissiveIntensity={0.5}
      transparent
      opacity={0.22}
    />
  </mesh>
)}
```

**Step 4: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**

```bash
git add app/components/CityBuilding.tsx
git commit -m "feat: add selectedFloor amber glow to CityBuilding"
```

---

### Task 3: Add district labels to DistrictGround

**Files:**
- Modify: `app/components/DistrictGround.tsx`

**Step 1: Add Html import**

At the top of the file, add:

```ts
import { Html } from '@react-three/drei';
```

**Step 2: Add new props to the Props interface**

```ts
interface Props {
  district: District;
  groundColor: string;
  accentColor: string;
  level: number;
  worldBounds?: { x: number; z: number; width: number; depth: number };
  onDistrictClick?: () => void;   // ← add
  isFocused?: boolean;            // ← add
  isOtherFocused?: boolean;       // ← add (another district is focused, dim this one)
}
```

**Step 3: Destructure new props in function signature**

```ts
export function DistrictGround({
  district, groundColor, accentColor, level, worldBounds,
  onDistrictClick, isFocused, isOtherFocused,
}: Props) {
```

**Step 4: Add the Html label inside the `<group>` return, after the accent border mesh**

The existing JSX ends with the accent border mesh. Add the label right after it, before `</group>`:

```tsx
{/* District label — visible when unlocked */}
{district.appearsAtLevel <= level && (
  <Html
    center
    position={[0, 0.6, 0]}
    style={{ pointerEvents: onDistrictClick ? 'auto' : 'none' }}
  >
    <div
      onClick={onDistrictClick}
      style={{
        cursor: onDistrictClick ? 'pointer' : 'default',
        opacity: isOtherFocused ? 0.35 : 1,
        transform: isFocused ? 'scale(1.12)' : 'scale(1)',
        transition: 'opacity 0.3s, transform 0.3s',
        textAlign: 'center',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <div style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '0.1em',
        color: accentColor,
        whiteSpace: 'nowrap',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
      }}>
        ● {district.name.toUpperCase()}
      </div>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        color: 'rgba(200,200,200,0.7)',
        whiteSpace: 'nowrap',
      }}>
        {district.buildings.length} buildings
      </div>
    </div>
  </Html>
)}
```

**Step 5: Verify it renders without errors**

Start dev server if not running:
```bash
npm run dev
```
Open http://localhost:3000. District labels should appear (floating above each colored ground block). Clicking them does nothing yet (no handler wired in CityWorld).

**Step 6: Commit**

```bash
git add app/components/DistrictGround.tsx
git commit -m "feat: add clickable district labels to DistrictGround"
```

---

### Task 4: CameraRig replaces AutoZoom + makeDefault on MapControls

**Files:**
- Modify: `app/components/CityScene.tsx`
- Modify: `app/components/CityWorld.tsx`

**Step 1: Add `makeDefault` to MapControls in CityScene.tsx**

Find the `<MapControls` block (around line 70) and add `makeDefault`:

```tsx
<MapControls
  makeDefault          // ← add this line
  enableRotate={false}
  enablePan={true}
  enableZoom={true}
  minZoom={3}
  maxZoom={40}
  panSpeed={1.5}
  zoomSpeed={1.2}
/>
```

`makeDefault` registers the controls with R3F's `useThree` so any component can access them via `state.controls`.

**Step 2: Replace `AutoZoom` component in CityWorld.tsx with `CameraRig`**

Find the `AutoZoom` component definition (lines ~18–66) and **replace it entirely** with:

```tsx
import type { BlockLayout } from '../lib/cityLayoutGenerator';

// ─── CameraRig: handles all camera pan + zoom animation ─────────────────────
// Replaces the old AutoZoom. Works in two modes:
//   focusedBlock = undefined → zoom to fit all activeBlocks (city mode)
//   focusedBlock = BlockLayout → pan + zoom to that single district block

function CameraRig({
  activeBlocks,
  focusedBlock,
}: {
  activeBlocks: BlockLayout[];
  focusedBlock: BlockLayout | undefined;
}) {
  const { camera, controls, size } = useThree();
  const targetZoom = useRef(12);
  const targetX    = useRef(0);
  const targetZ    = useRef(0);

  useEffect(() => {
    if (focusedBlock) {
      // Focus on one district block
      const cx = focusedBlock.x + focusedBlock.width  / 2;
      const cz = focusedBlock.z + focusedBlock.depth  / 2;
      targetX.current = cx;
      targetZ.current = cz;
      const spanX = focusedBlock.width  + 6;
      const spanZ = focusedBlock.depth  + 6;
      const screenW = (spanX + spanZ) / Math.SQRT2;
      const screenH = (spanX + spanZ) / Math.sqrt(6);
      const PADDING = 1.6;
      targetZoom.current = Math.min(
        size.width  / (screenW * PADDING),
        size.height / (screenH * PADDING),
      );
    } else if (activeBlocks.length > 0) {
      // Fit all active blocks (city mode)
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const b of activeBlocks) {
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x + b.width);
        minZ = Math.min(minZ, b.z);
        maxZ = Math.max(maxZ, b.z + b.depth);
      }
      targetX.current = (minX + maxX) / 2;
      targetZ.current = (minZ + maxZ) / 2;
      const spanX = maxX - minX;
      const spanZ = maxZ - minZ;
      const screenW = (spanX + spanZ) / Math.SQRT2;
      const screenH = (spanX + spanZ) / Math.sqrt(6);
      const PADDING = 1.35;
      targetZoom.current = Math.min(
        size.width  / (screenW * PADDING),
        size.height / (screenH * PADDING),
      );
    }
  }, [activeBlocks, focusedBlock, size]);

  useFrame((_, delta) => {
    const cam  = camera as THREE.OrthographicCamera;
    const ctrl = controls as unknown as { target: THREE.Vector3 } | null;
    if (!ctrl?.target) return;

    // Pan: move target and camera together (preserves isometric offset)
    const dx = (targetX.current - ctrl.target.x) * Math.min(delta * 4, 1);
    const dz = (targetZ.current - ctrl.target.z) * Math.min(delta * 4, 1);
    ctrl.target.x    += dx;
    ctrl.target.z    += dz;
    cam.position.x   += dx;
    cam.position.z   += dz;

    // Zoom
    const zDiff = targetZoom.current - cam.zoom;
    cam.zoom += zDiff * Math.min(delta * 3.5, 1);
    cam.updateProjectionMatrix();
  });

  return null;
}
```

**Step 3: Update the `<AutoZoom>` usage inside `CityWorld`**

Find the `<AutoZoom activeBlocks={activeBlocks} />` line (around line 130) and replace with:

```tsx
<CameraRig activeBlocks={activeBlocks} focusedBlock={focusedBlock} />
```

Also add `focusedBlock` to `CityWorld` props (you'll wire it in Task 5).

**Step 4: Verify no TypeScript errors and camera still auto-zooms in city mode**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Open http://localhost:3000 — slider should still zoom camera as districts unlock.

**Step 5: Commit**

```bash
git add app/components/CityScene.tsx app/components/CityWorld.tsx
git commit -m "feat: replace AutoZoom with CameraRig that supports district pan+zoom"
```

---

### Task 5: Export styles + wire mode/focusedDistrict through CityWorld and CityScene

**Files:**
- Modify: `app/components/CityWorld.tsx`
- Modify: `app/components/CityScene.tsx`

**Step 1: Export DISTRICT_COLORS and DISTRICT_STYLES from CityWorld.tsx**

Find these two `const` declarations (around lines 68–100) and add `export`:

```ts
export const DISTRICT_COLORS: Record<string, { ground: string; accent: string }> = { ... };
export const DISTRICT_STYLES: Record<string, DistrictStyle> = { ... };
export type { DistrictStyle };  // also export the type
```

**Step 2: Add new props to CityWorld's Props interface**

```ts
interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
  mode: 'city' | 'district' | 'building';               // ← add
  focusedDistrictId: string | null;                      // ← add
  onDistrictClick: (districtId: string) => void;         // ← add
}
```

**Step 3: Destructure new props in CityWorld function**

```ts
export function CityWorld({
  level, onBuildingClick, selectedBuilding,
  mode, focusedDistrictId, onDistrictClick,
}: Props) {
```

**Step 4: Derive `focusedBlock` for CameraRig**

After the `activeBlocks` memo, add:

```ts
const focusedBlock = useMemo(
  () => focusedDistrictId
    ? layout.blocks.find(b => b.districtId === focusedDistrictId)
    : undefined,
  [layout.blocks, focusedDistrictId],
);
```

**Step 5: Pass focusedBlock to CameraRig**

Replace the `<CameraRig .../>` line:

```tsx
<CameraRig activeBlocks={activeBlocks} focusedBlock={focusedBlock} />
```

**Step 6: Pass mode-aware props to each DistrictGround**

Find the `<DistrictGround` block inside the `districts.map(district => {` loop and add the new props:

```tsx
<DistrictGround
  district={district}
  groundColor={colors.ground}
  accentColor={colors.accent}
  level={level}
  worldBounds={block ? { x: block.x, z: block.z, width: block.width, depth: block.depth } : undefined}
  onDistrictClick={mode === 'city' ? () => onDistrictClick(district.id) : undefined}
  isFocused={focusedDistrictId === district.id}
  isOtherFocused={focusedDistrictId !== null && focusedDistrictId !== district.id}
/>
```

**Step 7: Add new props to CityScene.tsx Props interface and pass them to CityWorld**

In `CityScene.tsx`, find the `Props` interface:

```ts
interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
  mode: 'city' | 'district' | 'building';               // ← add
  focusedDistrictId: string | null;                      // ← add
  onDistrictClick: (districtId: string) => void;         // ← add
}
```

Update the function signature and pass through to `CityWorld`:

```tsx
export default function CityScene({
  level, onBuildingClick, selectedBuilding,
  mode, focusedDistrictId, onDistrictClick,
}: Props) {
  // ...
  return (
    <Canvas ...>
      {/* ... lights, controls, sky ... */}
      <CityWorld
        level={level}
        onBuildingClick={onBuildingClick}
        selectedBuilding={selectedBuilding}
        mode={mode}
        focusedDistrictId={focusedDistrictId}
        onDistrictClick={onDistrictClick}
      />
    </Canvas>
  );
}
```

**Step 8: Verify — clicking a district label in the browser should now trigger onDistrictClick (currently does nothing until page.tsx wires it, but no crash)**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 9: Commit**

```bash
git add app/components/CityWorld.tsx app/components/CityScene.tsx
git commit -m "feat: thread mode/focusedDistrict props through CityScene and CityWorld"
```

---

### Task 6: New DistrictStrip component

**Files:**
- Create: `app/components/DistrictStrip.tsx`

**Step 1: Create the file**

```tsx
// app/components/DistrictStrip.tsx
'use client';

import { districts } from '../data/city';

interface Props {
  districtId: string;
  level: number;
  onBack: () => void;
}

const ACCENT_COLORS: Record<string, string> = {
  frontend:        '#60a5fa',
  backend:         '#34d399',
  databases:       '#a78bfa',
  devops:          '#fb923c',
  testing:         '#f472b6',
  security:        '#f87171',
  'system-design': '#38bdf8',
  performance:     '#fbbf24',
  leadership:      '#e879f9',
};

export function DistrictStrip({ districtId, level, onBack }: Props) {
  const district = districts.find(d => d.id === districtId);
  if (!district) return null;

  const accent = ACCENT_COLORS[districtId] ?? '#60a5fa';
  const unlockedCount = district.buildings.length;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: 'linear-gradient(to bottom, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.85) 70%, transparent 100%)',
        paddingTop: '0',
      }}
    >
      {/* Title row (existing title bar content lives here in the parent) */}
      <div
        className="flex items-center gap-4 px-6 py-3 border-b"
        style={{ borderColor: 'rgba(51,65,85,0.5)' }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="font-mono text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          ← Back to city
        </button>

        <div className="w-px h-4 bg-slate-700 shrink-0" />

        {/* District identity */}
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: accent, fontSize: '10px' }}>●</span>
          <span
            className="font-mono text-xs font-bold tracking-widest uppercase"
            style={{ color: accent }}
          >
            {district.name}
          </span>
        </div>

        {/* Tagline */}
        <span className="font-mono text-xs text-slate-400 italic truncate hidden sm:block">
          "{district.tagline}"
        </span>

        {/* Count */}
        <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-auto">
          {unlockedCount} buildings · unlocked at L{district.appearsAtLevel}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/components/DistrictStrip.tsx
git commit -m "feat: add DistrictStrip info bar for district focus mode"
```

---

### Task 7: New BuildingOverlay component

**Files:**
- Create: `app/components/BuildingOverlay.tsx`

This is the largest task. The overlay is a full-screen backdrop with a 50/50 split: left = floor list, right = mini R3F Canvas showing the building.

**Step 1: Create the file**

```tsx
// app/components/BuildingOverlay.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { districts } from '../data/city';
import { CityBuilding } from './CityBuilding';
import { DISTRICT_COLORS, DISTRICT_STYLES } from './CityWorld';

interface Props {
  districtId: string;
  buildingId: string;
  level: number;
  onBack: () => void;
}

// ── Mini canvas: renders one building with auto-rotation ────────────────────

function RotatingBuilding({
  districtId, buildingId, level, selectedFloor,
}: {
  districtId: string;
  buildingId: string;
  level: number;
  selectedFloor: number | null;
}) {
  const groupRef   = useRef<THREE.Group>(null);
  const hovering   = useRef(false);
  const district   = districts.find(d => d.id === districtId)!;
  const building   = district.buildings.find(b => b.id === buildingId)!;
  const colors     = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend'];
  const dStyle     = DISTRICT_STYLES[districtId] ?? DISTRICT_STYLES['frontend'];

  useFrame((_, delta) => {
    if (!groupRef.current || hovering.current) return;
    groupRef.current.rotation.y += 0.2 * delta;
  });

  return (
    <>
      <ambientLight intensity={1.2} color="#d8eaff" />
      <directionalLight position={[30, 60, 20]} intensity={2.0} color="#fff5e0" />
      <directionalLight position={[-20, 30, -20]} intensity={0.5} color="#c8e8ff" />

      <group
        ref={groupRef}
        onPointerEnter={() => { hovering.current = true; }}
        onPointerLeave={() => { hovering.current = false; }}
      >
        <CityBuilding
          building={building}
          district={district}
          level={level}
          accentColor={colors.accent}
          districtStyle={dStyle}
          isSelected={false}
          onBuildingClick={() => {}}
          worldX={0}
          worldZ={0}
          facing="south"
          selectedFloor={selectedFloor ?? undefined}
        />
      </group>
    </>
  );
}

// ── Main overlay ────────────────────────────────────────────────────────────

export function BuildingOverlay({ districtId, buildingId, level, onBack }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(level);
  const listRef = useRef<HTMLDivElement>(null);

  const district = districts.find(d => d.id === districtId);
  const building = district?.buildings.find(b => b.id === buildingId);
  const colors   = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend'];

  // When level changes, point selected floor at current level
  useEffect(() => {
    setSelectedFloor(level);
  }, [level]);

  // Auto-scroll active floor card into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFloor]);

  if (!district || !building) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(2,6,23,0.82)' }}
    >
      {/* ── Left: floor list ───────────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
          <button
            onClick={onBack}
            className="font-mono text-xs text-slate-400 hover:text-white transition-colors mb-3 flex items-center gap-1.5"
          >
            ← Back to district
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: colors.accent, fontSize: '10px' }}>●</span>
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              {district.name}
            </span>
          </div>
          <h2 className="font-mono text-xl font-bold text-white">{building.name}</h2>
          <p className="font-mono text-xs text-slate-500 mt-1">
            {Math.min(level + 1, 6)} of 6 floors unlocked
          </p>
        </div>

        {/* Floor cards */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {building.floors.map(floor => {
            const isUnlocked = floor.level <= level;
            const isActive   = floor.level === selectedFloor;

            return (
              <div
                key={floor.level}
                data-active={isActive ? 'true' : undefined}
                onClick={() => isUnlocked && setSelectedFloor(floor.level)}
                className={`rounded-lg border p-3 transition-all duration-200 ${
                  !isUnlocked
                    ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-900/30'
                    : isActive
                    ? 'cursor-pointer border-amber-500/70 bg-amber-500/10'
                    : 'cursor-pointer border-slate-700 bg-slate-900/50 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className={`font-mono text-xs font-bold w-6 ${
                    isActive ? 'text-amber-400' : isUnlocked ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    L{floor.level}
                  </span>
                  <span className={`font-mono text-sm font-semibold ${
                    isUnlocked ? 'text-slate-100' : 'text-slate-600'
                  }`}>
                    {floor.title}
                  </span>
                  {!isUnlocked && <span className="text-slate-700 text-xs ml-auto">🔒</span>}
                  {isActive && isUnlocked && (
                    <span className="text-amber-400 text-xs ml-auto">●</span>
                  )}
                </div>
                <p className={`font-mono text-xs mb-2 ${
                  isUnlocked ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  {floor.description}
                </p>
                {isUnlocked && floor.skills.length > 0 && (
                  <ul className="space-y-0.5">
                    {floor.skills.map(skill => (
                      <li key={skill} className="font-mono text-[10px] text-slate-500 flex items-start gap-1.5">
                        <span style={{ color: colors.accent }} className="mt-0.5">·</span>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
          <p className="font-mono text-[10px] text-slate-600 text-center">
            Drag the level slider to unlock more floors
          </p>
        </div>
      </div>

      {/* ── Right: 3D building mini-canvas ─────────────────────────────────── */}
      <div className="w-1/2 relative">
        <Canvas
          orthographic
          camera={{
            position: [40, 28, 40],
            zoom: 22,
            near: 0.1,
            far: 500,
            up: [0, 1, 0],
          }}
        >
          <color attach="background" args={['#0a1628']} />
          <RotatingBuilding
            districtId={districtId}
            buildingId={buildingId}
            level={level}
            selectedFloor={selectedFloor}
          />
          <OrbitControls
            enableRotate={true}
            enableZoom={true}
            enablePan={false}
            minZoom={8}
            maxZoom={60}
          />
        </Canvas>

        {/* Hint overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="font-mono text-[10px] text-slate-600">
            drag to rotate · scroll to zoom
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/components/BuildingOverlay.tsx
git commit -m "feat: add BuildingOverlay with mini R3F canvas and floor list"
```

---

### Task 8: Wire page.tsx — connect all modes

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace the entire page.tsx with the wired version**

```tsx
// app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import CityCanvas from './components/CityCanvas';
import LevelSlider from './components/LevelSlider';
import { DistrictStrip } from './components/DistrictStrip';
import { BuildingOverlay } from './components/BuildingOverlay';
import { LEVEL_LABELS } from './data/city';

type Mode = 'city' | 'district' | 'building';

export default function Home() {
  const [level,            setLevel]           = useState(0);
  const [mode,             setMode]            = useState<Mode>('city');
  const [focusedDistrict,  setFocusedDistrict] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  // City → District
  const handleDistrictClick = useCallback((districtId: string) => {
    setFocusedDistrict(districtId);
    setMode('district');
  }, []);

  // District → City
  const handleBackToCity = useCallback(() => {
    setMode('city');
    setFocusedDistrict(null);
    setSelectedBuilding(null);
  }, []);

  // District → Building
  const handleBuildingClick = useCallback((districtId: string, buildingId: string) => {
    if (!districtId) return;
    // If we're in city mode and click a building, first set district
    if (mode === 'city') {
      setFocusedDistrict(districtId);
    }
    setSelectedBuilding({ districtId, buildingId });
    setMode('building');
  }, [mode]);

  // Building → District
  const handleBackToDistrict = useCallback(() => {
    setMode('district');
    setSelectedBuilding(null);
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      {/* Canvas city */}
      <CityCanvas
        level={level}
        onBuildingClick={handleBuildingClick}
        selectedBuilding={selectedBuilding}
        mode={mode}
        focusedDistrictId={focusedDistrict}
        onDistrictClick={handleDistrictClick}
      />

      {/* Title — hide when building overlay is open */}
      {mode !== 'building' && (
        <div
          className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.8), transparent)' }}
        >
          <h1 className="font-mono text-2xl font-bold text-amber-300 tracking-tight">
            Beyond Vibe Coding
          </h1>
          <p className="font-mono text-xs text-slate-500 mt-1">
            {LEVEL_LABELS[level].title} — {LEVEL_LABELS[level].tagline}
          </p>
        </div>
      )}

      {/* District info strip */}
      {mode === 'district' && focusedDistrict && (
        <DistrictStrip
          districtId={focusedDistrict}
          level={level}
          onBack={handleBackToCity}
        />
      )}

      {/* Building overlay */}
      {mode === 'building' && selectedBuilding && (
        <BuildingOverlay
          districtId={selectedBuilding.districtId}
          buildingId={selectedBuilding.buildingId}
          level={level}
          onBack={handleBackToDistrict}
        />
      )}

      {/* Level slider — always visible */}
      <LevelSlider level={level} onChange={setLevel} />
    </main>
  );
}
```

**Step 2: Update CityCanvas.tsx to pass through the new props**

`CityCanvas` re-exports `CityScene`. Open `app/components/CityCanvas.tsx` and check if it needs updating:

```tsx
// app/components/CityCanvas.tsx  — if it's just a re-export wrapper, update Props:
import CityScene from './CityScene';
import type { ComponentProps } from 'react';

export default function CityCanvas(props: ComponentProps<typeof CityScene>) {
  return <CityScene {...props} />;
}
```

This spreads all props through so CityScene receives mode, focusedDistrictId, onDistrictClick automatically.

**Step 3: Verify TypeScript — all files clean**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Smoke test in browser**

```
1. Open http://localhost:3000
2. City mode: district labels visible, title bar visible
3. Click a district label → camera zooms to that district, DistrictStrip appears
4. Click "← Back to city" → camera zooms back, strip disappears
5. Click a building → BuildingOverlay slides over the city, 50/50 split
6. Right panel: building rotates slowly, floors visible
7. Click a floor card → that floor glows amber in 3D view
8. Move level slider → floors appear/disappear in 3D view AND in floor list
9. Click "← Back to district" → overlay closes, district focus restored
```

**Step 5: Final commit**

```bash
git add app/page.tsx app/components/CityCanvas.tsx
git commit -m "feat: wire mode state machine in page.tsx for district/building navigation"
```

---

### Final push

```bash
git push origin main
```

---

## Summary of changes

| File | Change type |
|---|---|
| `app/data/city.ts` | Add `tagline` to District interface + 9 taglines |
| `app/components/CityBuilding.tsx` | Add `selectedFloor` amber glow prop |
| `app/components/DistrictGround.tsx` | Add Html district label + mode-aware styling |
| `app/components/CityScene.tsx` | Add `makeDefault` to MapControls; new props |
| `app/components/CityWorld.tsx` | Replace AutoZoom with CameraRig; export styles; new props |
| `app/components/CityCanvas.tsx` | Pass through new props |
| `app/page.tsx` | Mode state machine, all callback wiring |
| NEW `app/components/DistrictStrip.tsx` | District info bar |
| NEW `app/components/BuildingOverlay.tsx` | 50/50 overlay with mini R3F canvas |
