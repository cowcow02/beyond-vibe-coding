// app/components/CityPedestrians.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PedState {
  x: number; z: number;
  tx: number; tz: number;      // walk target
  speed: number;
  scale: number;               // 0→1 for enter/exit animation
  behavior: 'walking' | 'entering' | 'inside' | 'leaving';
  timer: number;
  insideDuration: number;
  bobPhase: number;
  isVisitor: boolean;
  // entrance position for visitor
  entrX: number; entrZ: number;
  // walk bounds
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

// District sidewalk areas (raw world coords, inside city group)
const SIDEWALK_AREAS = [
  // frontend district sidewalks
  { minX: 4,  maxX: 14, minZ: 3.2, maxZ: 3.8, entr: [7,  4  ] },
  { minX: 4,  maxX: 14, minZ: 12.2,maxZ: 12.8,entr: [11, 12 ] },
  // backend
  { minX: 18, maxX: 28, minZ: 3.2, maxZ: 3.8, entr: [22, 4  ] },
  { minX: 18, maxX: 28, minZ: 12.2,maxZ: 12.8,entr: [24, 12 ] },
  // databases
  { minX: 4,  maxX: 14, minZ: 15.2,maxZ: 15.8,entr: [8,  16 ] },
  { minX: 4,  maxX: 14, minZ: 24.2,maxZ: 24.8,entr: [10, 24 ] },
  // devops
  { minX: 18, maxX: 28, minZ: 15.2,maxZ: 15.8,entr: [22, 16 ] },
  // testing
  { minX: 4,  maxX: 14, minZ: 27.2,maxZ: 27.8,entr: [8,  28 ] },
  // security
  { minX: 18, maxX: 28, minZ: 27.2,maxZ: 27.8,entr: [22, 28 ] },
  // system-design
  { minX: 32, maxX: 42, minZ: 3.2, maxZ: 3.8, entr: [36, 4  ] },
  // performance
  { minX: 32, maxX: 42, minZ: 15.2,maxZ: 15.8,entr: [36, 16 ] },
  // leadership
  { minX: 32, maxX: 44, minZ: 27.2,maxZ: 27.8,entr: [38, 28 ] },
];

// Muted accent colors per district
const PED_COLORS = [
  '#5090c0', '#30a060', '#7060a0', '#c06030',
  '#c04060', '#c04040', '#2870b0', '#c08030', '#a040c0',
];

export function CityPedestrians() {
  const bodyRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const headRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  const peds = useMemo<PedState[]>(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const area = SIDEWALK_AREAS[i % SIDEWALK_AREAS.length];
      const x = area.minX + Math.random() * (area.maxX - area.minX);
      const z = area.minZ + Math.random() * (area.maxZ - area.minZ);
      const isVisitor = i % 3 === 0; // every 3rd ped is a visitor
      return {
        x, z,
        tx: x + (Math.random() - 0.5) * 4,
        tz: z + (Math.random() - 0.5) * 0.3,
        speed: 0.35 + Math.random() * 0.35,
        scale: 1,
        behavior: 'walking',
        timer: Math.random() * 5,
        insideDuration: 2 + Math.random() * 6,
        bobPhase: Math.random() * Math.PI * 2,
        isVisitor,
        entrX: (area.entr as number[])[0],
        entrZ: (area.entr as number[])[1],
        minX: area.minX + 0.5,
        maxX: area.maxX - 0.5,
        minZ: area.minZ,
        maxZ: area.maxZ,
      };
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;

    peds.forEach((ped, i) => {
      const group = groupRefs.current[i];
      if (!group) return;

      if (ped.behavior === 'walking') {
        // Move toward target
        const dx = ped.tx - ped.x;
        const dz = ped.tz - ped.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.1) {
          // Pick new target within bounds
          ped.tx = ped.minX + Math.random() * (ped.maxX - ped.minX);
          ped.tz = ped.minZ + Math.random() * (ped.maxZ - ped.minZ);

          // Visitors: sometimes go to entrance
          if (ped.isVisitor && Math.random() < 0.3) {
            ped.tx = ped.entrX + (Math.random() - 0.5) * 0.5;
            ped.tz = ped.entrZ;
            ped.behavior = 'walking'; // will trigger 'entering' when close to entrance
          }
        } else {
          ped.x += (dx / dist) * ped.speed * delta;
          ped.z += (dz / dist) * ped.speed * delta;
        }

        // Check if visitor near entrance
        if (ped.isVisitor) {
          const de = Math.sqrt((ped.x - ped.entrX) ** 2 + (ped.z - ped.entrZ) ** 2);
          if (de < 0.4) {
            ped.behavior = 'entering';
            ped.timer = 0;
          }
        }

        const bob = Math.sin(time * 6 + ped.bobPhase) * 0.015;
        group.position.set(ped.x, 0.15 + bob, ped.z);
        group.scale.setScalar(ped.scale);

      } else if (ped.behavior === 'entering') {
        ped.scale = Math.max(0, ped.scale - delta * 2.5);
        group.scale.setScalar(ped.scale);
        if (ped.scale <= 0) {
          ped.behavior = 'inside';
          ped.timer = 0;
        }

      } else if (ped.behavior === 'inside') {
        group.scale.setScalar(0);
        ped.timer += delta;
        if (ped.timer >= ped.insideDuration) {
          ped.behavior = 'leaving';
          ped.scale = 0;
          // Reappear at entrance
          ped.x = ped.entrX + (Math.random() - 0.5) * 0.3;
          ped.z = ped.entrZ;
          group.position.set(ped.x, 0.15, ped.z);
        }

      } else if (ped.behavior === 'leaving') {
        ped.scale = Math.min(1, ped.scale + delta * 2.5);
        group.scale.setScalar(ped.scale);
        if (ped.scale >= 1) {
          ped.behavior = 'walking';
          ped.tx = ped.minX + Math.random() * (ped.maxX - ped.minX);
          ped.tz = ped.minZ + Math.random() * (ped.maxZ - ped.minZ);
        }
      }
    });
  });

  return (
    <group>
      {peds.map((ped, i) => {
        const color = PED_COLORS[i % PED_COLORS.length];
        return (
          <group
            key={i}
            ref={el => { groupRefs.current[i] = el; }}
            position={[ped.x, 0.15, ped.z]}
          >
            {/* Body */}
            <mesh ref={el => { bodyRefs.current[i] = el; }} position={[0, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.065, 0.22, 6]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Head */}
            <mesh ref={el => { headRefs.current[i] = el; }} position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.09, 6, 6]} />
              <meshLambertMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
