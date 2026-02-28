// app/components/CityWorld.tsx
'use client';

import { useMemo } from 'react';
import { districts } from '../data/city';
import { generateLayout, type GeneratedLayout } from '../lib/cityLayoutGenerator';
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

export interface DistrictStyle {
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
  // Computed once on mount; Date.now() seed inside generates a unique layout each page load.
  const layout: GeneratedLayout = useMemo(() => generateLayout(districts), []);

  // Active segments for this level
  const activeSegments = useMemo(
    () => layout.segments.filter(s => s.level <= level),
    [layout.segments, level]
  );

  return (
    <group>  {/* no position offset needed — layout is centered at origin */}
      {/* Global asphalt base — lighter daytime color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color="#2a3f52" />
      </mesh>

      {/* Road system */}
      <RoadSystem
        nodes={layout.nodes}
        segments={layout.segments}
        activeLevel={level}
      />

      {/* Parks & gardens */}
      <CityPark blocks={layout.blocks} />

      {/* District grounds + buildings */}
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

      {/* Traffic */}
      <CityTraffic segments={activeSegments} />

      {/* Pedestrians */}
      <CityPedestrians blocks={layout.blocks} />
    </group>
  );
}
