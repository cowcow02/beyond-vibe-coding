// app/components/CityWorld.tsx
'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { districts } from '../data/city';
import { generateLayout, type GeneratedLayout, type BlockLayout, type GeneratedSegment } from '../lib/cityLayoutGenerator';
import { DistrictGround } from './DistrictGround';
import { CityBuilding } from './CityBuilding';
import { RoadSystem } from './RoadSystem';
import { CityTraffic } from './CityTraffic';
import { CityPedestrians } from './CityPedestrians';
import { CityPark } from './CityPark';

// ─── Camera rig: smooth pan + zoom to fit active/focused blocks ───────────────

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
  // dirty=true while animating to target; false once settled → user can pan freely
  const dirty      = useRef(false);

  useEffect(() => {
    const isPortrait = size.height > size.width;

    if (focusedBlock) {
      const cx = focusedBlock.x + focusedBlock.width  / 2;
      const cz = focusedBlock.z + focusedBlock.depth  / 2;
      targetX.current = cx;
      targetZ.current = cz;
      const spanX = focusedBlock.width  + 6;
      const spanZ = focusedBlock.depth  + 6;
      const screenW = (spanX + spanZ) / Math.SQRT2;
      const screenH = (spanX + spanZ) / Math.sqrt(6);
      const PADDING = isPortrait ? 0.75 : 1.6;
      targetZoom.current = isPortrait
        ? size.width / (screenW * PADDING)          // portrait: fit to width only
        : Math.min(
            size.width  / (screenW * PADDING),
            size.height / (screenH * PADDING),
          );
    } else if (activeBlocks.length > 0) {
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
      const PADDING = isPortrait ? 0.7 : 1.35;
      targetZoom.current = isPortrait
        ? size.width / (screenW * PADDING)          // portrait: fit to width only
        : Math.min(
            size.width  / (screenW * PADDING),
            size.height / (screenH * PADDING),
          );
    }
    dirty.current = true;
  }, [activeBlocks, focusedBlock, size]);

  useFrame((_, delta) => {
    // Once settled, stop animating so the user can pan/zoom freely
    if (!dirty.current) return;

    const cam  = camera as THREE.OrthographicCamera;
    const ctrl = controls as unknown as { target: THREE.Vector3 } | null;
    if (!ctrl?.target) return;

    const dx = (targetX.current - ctrl.target.x) * Math.min(delta * 4, 1);
    const dz = (targetZ.current - ctrl.target.z) * Math.min(delta * 4, 1);
    ctrl.target.x  += dx;
    ctrl.target.z  += dz;
    cam.position.x += dx;
    cam.position.z += dz;

    const zDiff = targetZoom.current - cam.zoom;
    cam.zoom += zDiff * Math.min(delta * 3.5, 1);
    cam.updateProjectionMatrix();

    // Mark settled when close enough
    const panDist  = Math.abs(targetX.current - ctrl.target.x) + Math.abs(targetZ.current - ctrl.target.z);
    const zoomDist = Math.abs(targetZoom.current - cam.zoom);
    if (panDist < 0.05 && zoomDist < 0.1) dirty.current = false;
  });

  return null;
}

export const DISTRICT_COLORS: Record<string, { ground: string; accent: string }> = {
  frontend:         { ground: '#1e3a5f', accent: '#60a5fa' },
  backend:          { ground: '#064e3b', accent: '#34d399' },
  databases:        { ground: '#2e1065', accent: '#a78bfa' },
  devops:           { ground: '#431407', accent: '#fb923c' },
  testing:          { ground: '#500724', accent: '#f472b6' },
  security:         { ground: '#450a0a', accent: '#f87171' },
  'system-design':  { ground: '#0c4a6e', accent: '#38bdf8' },
  performance:      { ground: '#451a03', accent: '#fbbf24' },
  leadership:       { ground: '#3b0764', accent: '#e879f9' },
  'backend-basics':   { ground: '#064e3b', accent: '#34d399' },
  'data-layer':       { ground: '#2e1065', accent: '#a78bfa' },
  'developer-craft':  { ground: '#1a2e1a', accent: '#86efac' },
  'backend-patterns': { ground: '#1c1a3a', accent: '#818cf8' },
  'devops-cloud':     { ground: '#431407', accent: '#fb923c' },
  'backend-arch':     { ground: '#1c1219', accent: '#f0abfc' },
  'backend-architecture': { ground: '#1c1219', accent: '#f0abfc' },
};

type RooftopStyle = 'antenna' | 'watertower' | 'ac' | 'satellite' | 'spire';

export interface DistrictStyle {
  rooftop: RooftopStyle;
  windowRows: number;
  windowCols: number;
  bodyDark: number;
  lobbyDark: number;
}

export const DISTRICT_STYLES: Record<string, DistrictStyle> = {
  frontend:         { rooftop: 'antenna',    windowRows: 3, windowCols: 3, bodyDark: 0.25, lobbyDark: 0.15 },
  backend:          { rooftop: 'watertower', windowRows: 2, windowCols: 2, bodyDark: 0.35, lobbyDark: 0.20 },
  databases:        { rooftop: 'ac',         windowRows: 2, windowCols: 3, bodyDark: 0.30, lobbyDark: 0.18 },
  devops:           { rooftop: 'ac',         windowRows: 2, windowCols: 2, bodyDark: 0.38, lobbyDark: 0.22 },
  testing:          { rooftop: 'satellite',  windowRows: 2, windowCols: 3, bodyDark: 0.28, lobbyDark: 0.16 },
  security:         { rooftop: 'spire',      windowRows: 1, windowCols: 2, bodyDark: 0.40, lobbyDark: 0.25 },
  'system-design':  { rooftop: 'antenna',    windowRows: 3, windowCols: 3, bodyDark: 0.26, lobbyDark: 0.15 },
  performance:      { rooftop: 'spire',      windowRows: 2, windowCols: 3, bodyDark: 0.22, lobbyDark: 0.13 },
  leadership:       { rooftop: 'watertower', windowRows: 3, windowCols: 3, bodyDark: 0.24, lobbyDark: 0.14 },
  'backend-basics':       { rooftop: 'watertower', windowRows: 2, windowCols: 2, bodyDark: 0.35, lobbyDark: 0.20 },
  'data-layer':           { rooftop: 'ac',         windowRows: 2, windowCols: 3, bodyDark: 0.30, lobbyDark: 0.18 },
  'developer-craft':      { rooftop: 'satellite',  windowRows: 2, windowCols: 2, bodyDark: 0.28, lobbyDark: 0.16 },
  'backend-patterns':     { rooftop: 'antenna',    windowRows: 2, windowCols: 3, bodyDark: 0.32, lobbyDark: 0.19 },
  'devops-cloud':         { rooftop: 'ac',         windowRows: 2, windowCols: 2, bodyDark: 0.38, lobbyDark: 0.22 },
  'backend-arch':         { rooftop: 'watertower', windowRows: 1, windowCols: 2, bodyDark: 0.40, lobbyDark: 0.25 },
  'backend-architecture': { rooftop: 'watertower', windowRows: 1, windowCols: 2, bodyDark: 0.40, lobbyDark: 0.25 },
};

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
  mode: 'city' | 'district' | 'building';
  focusedDistrictId: string | null;
  onDistrictClick: (districtId: string) => void;
  onBackToCity?: () => void;
}

export function CityWorld({ level, onBuildingClick, selectedBuilding, mode, focusedDistrictId, onDistrictClick, onBackToCity }: Props) {
  // Computed once on mount; Date.now() seed inside generates a unique layout each page load.
  const layout: GeneratedLayout = useMemo(() => generateLayout(districts), []);

  // When level is negative (e.g. hero section = -1), clamp to 0 for visibility checks
  // but suppress all buildings entirely.
  const effectiveLevel = Math.max(level, 0);

  // Active segments for this level
  const activeSegments = useMemo(
    () => layout.segments.filter(s => s.level <= effectiveLevel),
    [layout.segments, effectiveLevel]
  );

  // Blocks whose districts have unlocked at this level
  const activeBlocks = useMemo(
    () => layout.blocks.filter(b => {
      const d = districts.find(d => d.id === b.districtId);
      return d && d.appearsAtLevel <= effectiveLevel;
    }),
    [layout.blocks, effectiveLevel]
  );

  const focusedBlock = useMemo(
    () => focusedDistrictId
      ? layout.blocks.find(b => b.districtId === focusedDistrictId)
      : undefined,
    [layout.blocks, focusedDistrictId],
  );

  return (
    <group>  {/* no position offset needed — layout is centered at origin */}
      {/* Camera rig — smooth pan + zoom to fit active/focused blocks */}
      <CameraRig activeBlocks={activeBlocks} focusedBlock={focusedBlock} />

      {/* Ground base — warm milky stone. Click outside district to go back to city. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
        onClick={() => { if (mode === 'district') onBackToCity?.(); }}
      >
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color="#c2b9ad" />
      </mesh>

      {/* Road system */}
      <RoadSystem
        nodes={layout.nodes}
        segments={layout.segments}
        activeLevel={level}
      />

      {/* Parks & gardens — only for unlocked districts */}
      <CityPark blocks={activeBlocks} />

      {/* District grounds + buildings */}
      {districts.map(district => {
        const colors  = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
        const dStyle  = DISTRICT_STYLES[district.id] ?? DISTRICT_STYLES['frontend'];
        const isVisible = district.appearsAtLevel <= effectiveLevel;
        const block   = layout.blocks.find(b => b.districtId === district.id);

        return (
          <group key={district.id}>
            {/* District ground — sized to block bounds */}
            <DistrictGround
              district={district}
              groundColor={colors.ground}
              accentColor={colors.accent}
              level={effectiveLevel}
              worldBounds={block ? { x: block.x, z: block.z, width: block.width, depth: block.depth } : undefined}
              onDistrictClick={mode === 'city' ? () => onDistrictClick(district.id) : undefined}
              isFocused={focusedDistrictId === district.id}
              isOtherFocused={focusedDistrictId !== null && focusedDistrictId !== district.id}
              showLabel={mode !== 'building'}
            />

            {/* Buildings at their procedurally assigned slots.
                When level < 0 (hero/empty city state) skip all buildings. */}
            {level >= 0 && isVisible && block?.buildingSlots.map(slot => {
              const building = district.buildings.find(b => b.id === slot.buildingId);
              if (!building) return null;
              // Building can appear later than its district
              const buildingVisible = effectiveLevel >= (building.appearsAtLevel ?? district.appearsAtLevel);
              if (!buildingVisible) return null;
              return (
                <CityBuilding
                  key={building.id}
                  building={building}
                  district={district}
                  level={effectiveLevel}
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
                  showLabel={mode !== 'building'}
                />
              );
            })}
          </group>
        );
      })}

      {/* Traffic */}
      <CityTraffic segments={activeSegments} />

      {/* Pedestrians — walk on active road sidewalks */}
      <CityPedestrians segments={activeSegments} />
    </group>
  );
}
