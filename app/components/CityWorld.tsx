// app/components/CityWorld.tsx
'use client';

import { districts } from '../data/city';
import { tileToWorld, TILE_SIZE } from '../lib/cityLayout';
import { DistrictGround } from './DistrictGround';
import { CityBuilding } from './CityBuilding';
import { RoadGrid } from './RoadGrid';
import { CityTree } from './CityTree';

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

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

export function CityWorld({ level, onBuildingClick, selectedBuilding }: Props) {
  const visibleDistricts = districts.filter(d => d.appearsAtLevel <= level);

  // City spans col 2–22, row 2–18 → world x: 4–44, z: 4–36. Center: (24, 20).
  // Offset entire city to sit at origin so the camera (which looks at [0,0,0]) sees it correctly.
  const CITY_OFFSET_X = -24;
  const CITY_OFFSET_Z = -20;

  return (
    <group position={[CITY_OFFSET_X, 0, CITY_OFFSET_Z]}>
      {/* Global road/asphalt base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color="#1e293b" />
      </mesh>

      {/* Road markings between districts */}
      <RoadGrid />

      {/* District grounds + buildings */}
      {districts.map(district => {
        const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
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

      {/* Trees at district corners */}
      {visibleDistricts.map(district => {
        const [ox, oz] = tileToWorld(district.originCol, district.originRow);
        const w = district.cols * TILE_SIZE;
        const d = district.rows * TILE_SIZE;
        return [
          <CityTree key={`${district.id}-t0`} position={[ox - TILE_SIZE * 0.7, 0, oz - TILE_SIZE * 0.7]} scale={0.65} />,
          <CityTree key={`${district.id}-t1`} position={[ox + w + TILE_SIZE * 0.1, 0, oz - TILE_SIZE * 0.7]} scale={0.65} />,
          <CityTree key={`${district.id}-t2`} position={[ox - TILE_SIZE * 0.7, 0, oz + d + TILE_SIZE * 0.1]} scale={0.65} />,
        ];
      })}
    </group>
  );
}
