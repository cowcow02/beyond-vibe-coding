'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Building, type District } from '../data/city';
import { tileToWorld, TILE_SIZE, FLOOR_HEIGHT } from '../lib/cityLayout';

const FLOOR_W = TILE_SIZE * 0.82;
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

  const floorStates = useRef<FloorState[]>(
    Array.from({ length: 6 }, (_, i) => ({
      targetY:  0,
      currentY: 0,
      velocity: 0,
      visible:  i < numFloors,
    }))
  );

  const prevNumFloors = useRef(numFloors);

  useEffect(() => {
    const prev = prevNumFloors.current;
    const next = Math.min(level + 1, 6);
    prevNumFloors.current = next;

    if (next > prev) {
      // New floors drop from sky
      for (let i = prev; i < next; i++) {
        const fs = floorStates.current[i];
        fs.currentY = 20 + (i - prev) * 3;
        fs.velocity = 0;
        fs.targetY  = 0;
        fs.visible  = true;
      }
    } else if (next < prev) {
      // Old floors fly upward
      for (let i = next; i < prev; i++) {
        const fs = floorStates.current[i];
        fs.targetY  = 30;
        fs.velocity = 1;
      }
    }
  }, [level]);

  const floorRefs = useRef<(THREE.Group | null)[]>(Array(6).fill(null));

  useFrame((_, delta) => {
    const stiffness = 180;
    const damping   = 16;

    floorStates.current.forEach((fs, i) => {
      const mesh = floorRefs.current[i];
      if (!mesh) return;

      if (!fs.visible) {
        mesh.visible = false;
        return;
      }

      const force = stiffness * (fs.targetY - fs.currentY) - damping * fs.velocity;
      fs.velocity += force * delta;
      fs.currentY += fs.velocity * delta;

      const baseY = i * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
      mesh.position.y = baseY + fs.currentY;

      // Hide floors that flew away
      if (fs.targetY > 0 && fs.currentY > 28) {
        mesh.visible = false;
        fs.visible = false;
      } else {
        mesh.visible = true;
      }
    });
  });

  const accent    = new THREE.Color(accentColor);
  const bodyHex   = '#' + accent.clone().multiplyScalar(0.3).getHexString();
  const windowHex = '#' + accent.clone().multiplyScalar(1.5).clampLength(0, 1).getHexString();

  return (
    <group
      position={[wx + TILE_SIZE / 2, 0, wz + TILE_SIZE / 2]}
      onClick={(e) => {
        e.stopPropagation();
        onBuildingClick(district.id, building.id);
      }}
      onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
      onPointerLeave={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Selection ring at base */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[FLOOR_W * 0.52, FLOOR_W * 0.62, 32]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.9} />
        </mesh>
      )}

      {Array.from({ length: 6 }, (_, floorIdx) => {
        const isTopFloor  = floorIdx === numFloors - 1 && floorIdx < numFloors;
        const isVisible   = floorIdx < numFloors;
        const scale       = isSelected ? 1.05 : 1;

        return (
          <group
            key={floorIdx}
            ref={(el) => { floorRefs.current[floorIdx] = el; }}
            position={[0, floorIdx * FLOOR_HEIGHT + FLOOR_HEIGHT / 2, 0]}
            visible={isVisible}
          >
            {/* Main box */}
            <mesh scale={[scale, 1, scale]} castShadow receiveShadow>
              <boxGeometry args={[FLOOR_W, FLOOR_HEIGHT * 0.94, FLOOR_D]} />
              <meshLambertMaterial color={bodyHex} />
            </mesh>

            {/* Window strip — front face (positive Z) */}
            <mesh position={[0, FLOOR_HEIGHT * 0.08, FLOOR_D / 2 + 0.01]}>
              <planeGeometry args={[FLOOR_W * 0.65, FLOOR_HEIGHT * 0.38]} />
              <meshStandardMaterial
                color={windowHex}
                emissive={windowHex}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>

            {/* Window strip — right face (positive X) */}
            <mesh
              position={[FLOOR_W / 2 + 0.01, FLOOR_HEIGHT * 0.08, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[FLOOR_D * 0.65, FLOOR_HEIGHT * 0.38]} />
              <meshStandardMaterial
                color={windowHex}
                emissive={windowHex}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>

            {/* Roof trim on top floor */}
            {isTopFloor && (
              <mesh position={[0, FLOOR_HEIGHT / 2 + 0.05, 0]}>
                <boxGeometry args={[FLOOR_W + 0.12, 0.1, FLOOR_D + 0.12]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={0.7}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
