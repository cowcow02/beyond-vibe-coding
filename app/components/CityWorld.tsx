// app/components/CityWorld.tsx
'use client';

import { districts } from '../data/city';

interface Props {
  level: number;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

export function CityWorld({ level, onBuildingClick, selectedBuilding }: Props) {
  return (
    <group>
      {/* Global ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color="#1e293b" />
      </mesh>
      {/* Components will be added here by wire-up agent */}
    </group>
  );
}
