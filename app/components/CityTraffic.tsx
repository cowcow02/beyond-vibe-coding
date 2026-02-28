// app/components/CityTraffic.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_SEGMENTS, type RoadSegment } from './RoadSystem';

interface CarState {
  segIdx: number;     // index into ROAD_SEGMENTS
  t: number;          // 0→1 progress along segment
  speed: number;      // units/sec
  dir: 1 | -1;        // direction along segment
  laneOff: number;    // perpendicular offset (+0.55 = right lane)
  // Parking state
  parkMode: boolean;
  parkT: number;      // progress toward park spot 0→1
  parkTimer: number;  // time spent parked
  parkDuration: number;
  parkPhase: 'driving' | 'parking' | 'parked' | 'leaving';
}

const CAR_COLORS = [
  '#2a4060', '#3a2820', '#1e3828', '#3e2a3e',
  '#3c381c', '#1c2e3c', '#2e1e1e', '#182838',
];

// 4 parking spots near building entrances (in raw world coords)
const PARK_SPOTS = [
  { x: 8,  z: 6  },
  { x: 22, z: 6  },
  { x: 8,  z: 20 },
  { x: 22, z: 20 },
];

function segLength(seg: RoadSegment): number {
  return Math.sqrt((seg.x2 - seg.x1) ** 2 + (seg.z2 - seg.z1) ** 2);
}

function segPos(seg: RoadSegment, t: number, laneOff: number): [number, number, number] {
  const x = seg.x1 + (seg.x2 - seg.x1) * t + (seg.axis === 'z' ? laneOff : 0);
  const z = seg.z1 + (seg.z2 - seg.z1) * t + (seg.axis === 'x' ? laneOff : 0);
  return [x, 0.14, z];
}

function segRotY(seg: RoadSegment, dir: 1 | -1): number {
  if (seg.axis === 'x') return dir === 1 ? 0 : Math.PI;
  return dir === 1 ? -Math.PI / 2 : Math.PI / 2;
}

export function CityTraffic() {
  const carRefs = useRef<(THREE.Group | null)[]>([]);

  const cars = useMemo<CarState[]>(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const isPark = i < 4;
      const segIdx = isPark ? i % ROAD_SEGMENTS.length : Math.floor(Math.random() * ROAD_SEGMENTS.length);
      return {
        segIdx,
        t: isPark ? 0 : Math.random(),
        speed: 1.0 + Math.random() * 1.2,
        dir: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
        laneOff: Math.random() > 0.5 ? 0.55 : -0.55,
        parkMode: isPark,
        parkT: 0,
        parkTimer: 0,
        parkDuration: 3 + Math.random() * 5,
        parkPhase: isPark ? 'driving' : 'driving',
      };
    });
  }, []);

  useFrame((_, delta) => {
    cars.forEach((car, i) => {
      const mesh = carRefs.current[i];
      if (!mesh) return;

      const seg = ROAD_SEGMENTS[car.segIdx];
      const len = segLength(seg);

      if (car.parkMode) {
        const spot = PARK_SPOTS[i];
        if (!spot) return;

        if (car.parkPhase === 'driving' || car.parkPhase === 'leaving') {
          car.t += (car.dir * car.speed * delta) / len;
          if (car.t > 1) { car.t = 0; }
          if (car.t < 0) { car.t = 1; }

          const [cx, , cz] = segPos(seg, car.t, car.laneOff);
          const distToSpot = Math.sqrt((cx - spot.x) ** 2 + (cz - spot.z) ** 2);

          if (car.parkPhase === 'driving' && distToSpot < 2.5) {
            car.parkPhase = 'parking';
            car.parkT = 0;
          }
          if (car.parkPhase === 'leaving' && distToSpot > 5) {
            car.parkPhase = 'driving';
          }
          mesh.position.set(cx, 0.14, cz);
          mesh.rotation.y = segRotY(seg, car.dir);
        }

        if (car.parkPhase === 'parking') {
          car.parkT = Math.min(1, car.parkT + delta * 0.8);
          const [sx, , sz] = segPos(seg, car.t, car.laneOff);
          mesh.position.set(
            sx + (spot.x - sx) * car.parkT,
            0.14,
            sz + (spot.z - sz) * car.parkT,
          );
          if (car.parkT >= 1) {
            car.parkPhase = 'parked';
            car.parkTimer = 0;
          }
        }

        if (car.parkPhase === 'parked') {
          car.parkTimer += delta;
          if (car.parkTimer >= car.parkDuration) {
            car.parkPhase = 'leaving';
            car.parkDuration = 3 + Math.random() * 5;
          }
        }
      } else {
        // Normal driving
        car.t += (car.speed * delta) / len;
        if (car.t > 1) { car.t = 0; }

        const [px, py, pz] = segPos(seg, car.t, car.laneOff);
        mesh.position.set(px, py, pz);
        mesh.rotation.y = segRotY(seg, car.dir);
      }
    });
  });

  return (
    <group>
      {cars.map((car, i) => {
        const seg = ROAD_SEGMENTS[car.segIdx];
        const [ix, iy, iz] = segPos(seg, car.t, car.laneOff);
        const color = CAR_COLORS[i % CAR_COLORS.length];

        return (
          <group
            key={i}
            ref={el => { carRefs.current[i] = el; }}
            position={[ix, iy, iz]}
            rotation={[0, segRotY(seg, car.dir), 0]}
          >
            {/* Car body */}
            <mesh>
              <boxGeometry args={[0.7, 0.22, 0.38]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Cab */}
            <mesh position={[-0.05, 0.19, 0]}>
              <boxGeometry args={[0.38, 0.18, 0.32]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Headlights */}
            <mesh position={[0.36, 0.0, 0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#fffff0" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.36, 0.0, -0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#fffff0" side={THREE.DoubleSide} />
            </mesh>
            {/* Tail lights */}
            <mesh position={[-0.36, 0.0, 0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#ff2010" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-0.36, 0.0, -0.1]}>
              <planeGeometry args={[0.07, 0.06]} />
              <meshBasicMaterial color="#ff2010" side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
