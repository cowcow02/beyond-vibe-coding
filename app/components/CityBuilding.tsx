'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Building, type District } from '../data/city';
import { tileToWorld, TILE_SIZE, FLOOR_HEIGHT } from '../lib/cityLayout';
import { BuildingLabel } from './BuildingLabel';

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
  districtStyle: {
    rooftop: 'antenna' | 'watertower' | 'ac' | 'satellite' | 'spire';
    windowRows: number;
    windowCols: number;
    bodyDark: number;
    lobbyDark: number;
  };
  isSelected: boolean;
  onBuildingClick: (districtId: string, buildingId: string) => void;
  worldX?: number;
  worldZ?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  selectedFloor?: number;
  hoveredFloor?: number;
  onFloorClick?: (floor: number) => void;
  onFloorHover?: (floor: number | null) => void;
  showLabel?: boolean;
}

export function CityBuilding({
  building, district, level, accentColor, districtStyle, isSelected, onBuildingClick,
  worldX, worldZ, facing, selectedFloor, hoveredFloor, onFloorClick, onFloorHover, showLabel = true,
}: Props) {
  if (level < (building.appearsAtLevel ?? district.appearsAtLevel)) return null;

  const [tileX, tileZ] = tileToWorld(
    district.originCol + building.col,
    district.originRow + building.row,
  );
  // tileToWorld returns the top-left corner of a tile; tile-based buildings
  // need +TILE_SIZE/2 to center. worldX/worldZ from the generator are already
  // center positions, so don't add the offset in that case.
  const wx = worldX !== undefined ? worldX : tileX + TILE_SIZE / 2;
  const wz = worldZ !== undefined ? worldZ : tileZ + TILE_SIZE / 2;

  const floorStart    = building.floorStartLevel ?? 0;
  const maxFloors     = 6 - floorStart;
  const numFloors     = Math.min(level - floorStart + 1, maxFloors);
  const visibleFloors = Math.max(numFloors, 1);

  const floorStates = useRef<FloorState[]>(
    Array.from({ length: 6 }, (_, i) => ({
      targetY:  0,
      currentY: 0,
      velocity: 0,
      visible:  i < visibleFloors,
    }))
  );

  const prevNumFloors = useRef(numFloors);

  useEffect(() => {
    const prev = prevNumFloors.current;
    const next = Math.min(level - floorStart + 1, maxFloors);
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
        const u = (c + 1) / (cols + 1);
        const v = (r + 0.5) / rows;
        pts.push([u, v]);
      }
    }
    return pts;
  }

  const winPts = windowPositions(districtStyle.windowRows, districtStyle.windowCols);
  const LOBBY_EXTRA = 0.06;
  const LOBBY_H_MULT = 1.15;

  const facingRotationY: Record<string, number> = {
    north: Math.PI,
    south: 0,
    east: -Math.PI / 2,
    west: Math.PI / 2,
  };
  const rotY = facingRotationY[facing ?? 'south'] ?? 0;

  return (
    <group
      position={[wx, 0, wz]}
      rotation={[0, rotY, 0]}
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
        const isTop     = floorIdx === visibleFloors - 1 && floorIdx < visibleFloors;
        const isVisible = floorIdx < visibleFloors;
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

            {/* Hover glow (only when not already selected) */}
            {hoveredFloor === floorIdx && selectedFloor !== floorIdx && (
              <mesh>
                <boxGeometry args={[fw + 0.14, fh + 0.08, fd + 0.14]} />
                <meshStandardMaterial
                  color="#94a3b8"
                  emissive="#94a3b8"
                  emissiveIntensity={0.4}
                  transparent
                  opacity={0.18}
                />
              </mesh>
            )}

            {/* Invisible hitbox for per-floor hover/click (only when callbacks provided) */}
            {onFloorClick && isVisible && (
              <mesh
                onClick={(e) => { e.stopPropagation(); onFloorClick(floorIdx); }}
                onPointerEnter={(e) => { e.stopPropagation(); onFloorHover?.(floorIdx); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={(e) => { e.stopPropagation(); onFloorHover?.(null); document.body.style.cursor = 'default'; }}
              >
                <boxGeometry args={[fw + 0.2, fh + 0.1, fd + 0.2]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
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
      {showLabel && visibleFloors > 0 && (
        <BuildingLabel
          name={building.name}
          position={[0, visibleFloors * FLOOR_HEIGHT + 0.5, 0]}
          accentColor={accentColor}
        />
      )}
    </group>
  );
}
