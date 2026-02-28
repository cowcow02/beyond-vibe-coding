// app/components/CityPedestrians.tsx
'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GeneratedSegment } from '../lib/cityLayoutGenerator';

const ROAD_W      = 2.5;
const SW_OFFSET   = ROAD_W / 2 + 0.2;   // center of sidewalk strip from road center
const MAX_PEDS    = 8;
const SPAWN_DELAY = 1.8;                 // seconds between each ped appearing

const PED_COLORS = [
  '#5090c0', '#30a060', '#7060a0', '#c06030',
  '#c04060', '#2870b0', '#c08030', '#a040c0',
];

interface SidewalkLane {
  axis:      'x' | 'z';
  roadCoord: number;   // fixed coord perpendicular to travel (x for z-roads, z for x-roads)
  side:      1 | -1;  // which side of the road
  minAlong:  number;
  maxAlong:  number;
}

interface PedState {
  lane:      SidewalkLane;
  along:     number;
  dir:       1 | -1;
  speed:     number;
  spawnAt:   number;   // clock time when this ped should appear
  scale:     number;
  bobPhase:  number;
}

interface Props {
  segments: GeneratedSegment[];
}

export function CityPedestrians({ segments }: Props) {
  const groupRefs = useRef<(THREE.Group | null)[]>(Array(MAX_PEDS).fill(null));
  const clockRef  = useRef(0);

  // Build one sidewalk lane per side of each road segment
  const lanes = useMemo<SidewalkLane[]>(() => {
    const result: SidewalkLane[] = [];
    for (const seg of segments) {
      if (seg.axis === 'z') {
        const minZ = Math.min(seg.z1, seg.z2);
        const maxZ = Math.max(seg.z1, seg.z2);
        if (maxZ - minZ < 1) continue;
        result.push({ axis: 'z', roadCoord: seg.x1, side:  1, minAlong: minZ, maxAlong: maxZ });
        result.push({ axis: 'z', roadCoord: seg.x1, side: -1, minAlong: minZ, maxAlong: maxZ });
      } else {
        const minX = Math.min(seg.x1, seg.x2);
        const maxX = Math.max(seg.x1, seg.x2);
        if (maxX - minX < 1) continue;
        result.push({ axis: 'x', roadCoord: seg.z1, side:  1, minAlong: minX, maxAlong: maxX });
        result.push({ axis: 'x', roadCoord: seg.z1, side: -1, minAlong: minX, maxAlong: maxX });
      }
    }
    return result;
  }, [segments]);

  // Reset clock when lanes change so staggered spawn restarts
  useEffect(() => { clockRef.current = 0; }, [lanes]);

  const peds = useMemo<PedState[]>(() => {
    if (lanes.length === 0) return [];
    return Array.from({ length: MAX_PEDS }, (_, i) => {
      const lane  = lanes[i % lanes.length];
      const along = lane.minAlong + Math.random() * (lane.maxAlong - lane.minAlong);
      return {
        lane,
        along,
        dir:      (Math.random() < 0.5 ? 1 : -1) as 1 | -1,
        speed:    0.7 + Math.random() * 0.5,
        spawnAt:  i * SPAWN_DELAY,
        scale:    0,
        bobPhase: Math.random() * Math.PI * 2,
      };
    });
  }, [lanes]);

  useFrame((state, delta) => {
    clockRef.current += delta;
    const t = clockRef.current;

    peds.forEach((ped, i) => {
      const group = groupRefs.current[i];
      if (!group) return;

      // Not spawned yet
      if (t < ped.spawnAt) {
        group.visible = false;
        return;
      }

      group.visible = true;

      // Scale up on first appearance
      if (ped.scale < 1) {
        ped.scale = Math.min(1, ped.scale + delta * 2.5);
        group.scale.setScalar(ped.scale);
      }

      // Walk along lane, bounce at ends
      ped.along += ped.dir * ped.speed * delta;
      if (ped.along >= ped.lane.maxAlong - 0.5) {
        ped.along = ped.lane.maxAlong - 0.5;
        ped.dir = -1;
      } else if (ped.along <= ped.lane.minAlong + 0.5) {
        ped.along = ped.lane.minAlong + 0.5;
        ped.dir = 1;
      }

      // World position: fixed coord ± SW_OFFSET, varying along lane
      const sw  = ped.lane.roadCoord + ped.lane.side * SW_OFFSET;
      const bob = Math.sin(t * 6 + ped.bobPhase) * 0.015;

      if (ped.lane.axis === 'z') {
        group.position.set(sw, 0.15 + bob, ped.along);
        group.rotation.y = ped.dir > 0 ? 0 : Math.PI;
      } else {
        group.position.set(ped.along, 0.15 + bob, sw);
        group.rotation.y = ped.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
    });
  });

  return (
    <group>
      {peds.map((_, i) => {
        const color = PED_COLORS[i % PED_COLORS.length];
        return (
          <group
            key={i}
            ref={el => { groupRefs.current[i] = el; }}
            visible={false}
          >
            {/* Body */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.065, 0.22, 6]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.09, 6, 6]} />
              <meshLambertMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
