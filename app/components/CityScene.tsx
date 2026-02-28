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
