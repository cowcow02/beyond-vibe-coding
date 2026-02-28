// app/components/CityScene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { CityWorld } from './CityWorld';

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
      style={{ background: '#0f172a' }}
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
      <fog attach="fog" args={['#0f172a', 80, 200]} />
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

      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minZoom={3}
        maxZoom={40}
        panSpeed={1.5}
        zoomSpeed={1.2}
      />

      <CityWorld
        level={level}
        onBuildingClick={onBuildingClick}
        selectedBuilding={selectedBuilding}
      />
    </Canvas>
  );
}
