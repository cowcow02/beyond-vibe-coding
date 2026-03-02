// app/components/CityTraffic.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { GeneratedSegment } from '../lib/cityLayoutGenerator';

type RoadSegment = GeneratedSegment;

interface Props {
  segments: GeneratedSegment[];
}

interface CarState {
  segIdx: number;
  t: number;
  speed: number;
  dir: 1 | -1;
  laneOff: number;
  // Parking state
  parkMode: boolean;
  parkT: number;
  parkTimer: number;
  parkDuration: number;
  parkPhase: 'driving' | 'parking' | 'parked' | 'leaving';
  // Turning state
  turning: boolean;
  turnP: number;
  turnDur: number;
  bp0x: number; bp0z: number;
  bp1x: number; bp1z: number;
  bp2x: number; bp2z: number;
  bp3x: number; bp3z: number;
  turnStartRotY: number;
  turnEndRotY: number;
  nextSegIdx: number;
  nextDir: 1 | -1;
  nextT: number;
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

const TURN_DUR     = 0.35;  // seconds for a 90° turn arc
const TURN_TANGENT = 0.35;  // bezier control-point tangent length

// ── Pure helpers (defined outside component for stability) ────────────────────

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

function headingDxDz(seg: RoadSegment, dir: 1 | -1): [number, number] {
  return seg.axis === 'x' ? [dir, 0] : [0, dir];
}

function rotYFromDxDz(dx: number, dz: number): number {
  return Math.atan2(-dz, dx);
}

/** Lerp two angles, taking the shortest path through ±π wrap. */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

function cubicBezier1D(
  p0: number, p1: number, p2: number, p3: number, t: number,
): number {
  const u = 1 - t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
}

function coordKey(x: number, z: number): string {
  return `${x.toFixed(2)}_${z.toFixed(2)}`;
}

// ── Adjacency map ─────────────────────────────────────────────────────────────

type AdjEntry = { segIdx: number; end: 'start' | 'end' };
type Adjacency = Map<string, AdjEntry[]>;

function buildAdjacency(segments: RoadSegment[]): Adjacency {
  const map: Adjacency = new Map();
  segments.forEach((seg, idx) => {
    const k1 = coordKey(seg.x1, seg.z1);
    const k2 = coordKey(seg.x2, seg.z2);
    if (!map.has(k1)) map.set(k1, []);
    if (!map.has(k2)) map.set(k2, []);
    map.get(k1)!.push({ segIdx: idx, end: 'start' });
    map.get(k2)!.push({ segIdx: idx, end: 'end' });
  });
  return map;
}

// ── Segment-end handler (graph traversal + turn initiation) ───────────────────

function handleSegmentEnd(
  car: CarState,
  seg: RoadSegment,
  arrivalEnd: 'start' | 'end',
  adjacency: Adjacency,
  segments: RoadSegment[],
): void {
  const arrX = arrivalEnd === 'end' ? seg.x2 : seg.x1;
  const arrZ = arrivalEnd === 'end' ? seg.z2 : seg.z1;
  const connections = adjacency.get(coordKey(arrX, arrZ)) ?? [];

  // All exits from this node except the one we arrived on
  const options = connections.filter(c => c.segIdx !== car.segIdx);

  if (options.length === 0) {
    // Dead end — U-turn on the same segment
    car.dir = (car.dir * -1) as 1 | -1;
    return;
  }

  const chosen  = options[Math.floor(Math.random() * options.length)];
  const nextSeg = segments[chosen.segIdx];
  const newDir: 1 | -1 = chosen.end === 'start' ? 1 : -1;
  const newT             = chosen.end === 'start' ? 0 : 1;

  if (seg.axis !== nextSeg.axis) {
    // ── 90° turn: animate a cubic Bezier arc ─────────────────────────────
    const arrivalT        = arrivalEnd === 'end' ? 1 : 0;
    const [sx, , sz]      = segPos(seg, arrivalT, car.laneOff);
    const [ex, , ez]      = segPos(nextSeg, newT, car.laneOff);
    const [hdx, hdz]      = headingDxDz(seg, car.dir);
    const [ndx, ndz]      = headingDxDz(nextSeg, newDir);

    car.turning       = true;
    car.turnP         = 0;
    car.turnDur       = TURN_DUR;
    car.bp0x = sx;                          car.bp0z = sz;
    car.bp1x = sx + hdx * TURN_TANGENT;    car.bp1z = sz + hdz * TURN_TANGENT;
    car.bp2x = ex - ndx * TURN_TANGENT;    car.bp2z = ez - ndz * TURN_TANGENT;
    car.bp3x = ex;                          car.bp3z = ez;
    car.turnStartRotY = rotYFromDxDz(hdx, hdz);
    car.turnEndRotY   = rotYFromDxDz(ndx, ndz);
    car.nextSegIdx    = chosen.segIdx;
    car.nextDir       = newDir;
    car.nextT         = newT;
  } else {
    // ── Same axis: straight continuation or inline U-turn — snap directly ─
    car.segIdx = chosen.segIdx;
    car.dir    = newDir;
    car.t      = newT;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CityTraffic({ segments }: Props) {
  const carRefs = useRef<(THREE.Group | null)[]>([]);

  const adjacency = useMemo(() => buildAdjacency(segments), [segments]);

  const cars = useMemo<CarState[]>(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const isPark = i < 4;
      const segIdx = segments.length > 0
        ? (isPark ? i % segments.length : Math.floor(Math.random() * segments.length))
        : 0;
      return {
        segIdx,
        t:            isPark ? 0 : Math.random(),
        speed:        1.0 + Math.random() * 1.2,
        dir:          (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
        laneOff:      Math.random() > 0.5 ? 0.55 : -0.55,
        parkMode:     isPark,
        parkT:        0,
        parkTimer:    0,
        parkDuration: 3 + Math.random() * 5,
        parkPhase:    'driving',
        turning:      false,
        turnP:        0,
        turnDur:      TURN_DUR,
        bp0x: 0, bp0z: 0,
        bp1x: 0, bp1z: 0,
        bp2x: 0, bp2z: 0,
        bp3x: 0, bp3z: 0,
        turnStartRotY: 0,
        turnEndRotY:   0,
        nextSegIdx:    0,
        nextDir:       1,
        nextT:         0,
      };
    });
  }, [segments]); // re-initialize cars when road segments change (level change)

  useFrame((_, delta) => {
    cars.forEach((car, i) => {
      const mesh = carRefs.current[i];
      if (!mesh) return;

      // ── Parking cars (behaviour unchanged) ─────────────────────────────────
      if (car.parkMode) {
        const seg  = segments[car.segIdx];
        if (!seg) return;
        const len  = segLength(seg);
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
            car.parkPhase  = 'leaving';
            car.parkDuration = 3 + Math.random() * 5;
          }
        }
        return;
      }

      // ── Turning (Bezier arc) ────────────────────────────────────────────────
      if (car.turning) {
        car.turnP = Math.min(1, car.turnP + delta / car.turnDur);
        const p  = easeInOut(car.turnP);
        const bx = cubicBezier1D(car.bp0x, car.bp1x, car.bp2x, car.bp3x, p);
        const bz = cubicBezier1D(car.bp0z, car.bp1z, car.bp2z, car.bp3z, p);
        mesh.position.set(bx, 0.14, bz);
        mesh.rotation.y = lerpAngle(car.turnStartRotY, car.turnEndRotY, p);

        if (car.turnP >= 1) {
          car.turning = false;
          car.segIdx  = car.nextSegIdx;
          car.dir     = car.nextDir;
          car.t       = car.nextT;
        }
        return;
      }

      // ── Normal driving ──────────────────────────────────────────────────────
      const seg = segments[car.segIdx];
      if (!seg) return;
      const len = segLength(seg);
      car.t += (car.dir * car.speed * delta) / len;

      if (car.dir === 1 && car.t >= 1) {
        car.t = 1;
        handleSegmentEnd(car, seg, 'end', adjacency, segments);
        if (!car.turning) {
          // Same-axis snap: update mesh immediately
          const ns = segments[car.segIdx];
          if (ns) {
            const [px, py, pz] = segPos(ns, car.t, car.laneOff);
            mesh.position.set(px, py, pz);
            mesh.rotation.y = segRotY(ns, car.dir);
          }
        }
      } else if (car.dir === -1 && car.t <= 0) {
        car.t = 0;
        handleSegmentEnd(car, seg, 'start', adjacency, segments);
        if (!car.turning) {
          const ns = segments[car.segIdx];
          if (ns) {
            const [px, py, pz] = segPos(ns, car.t, car.laneOff);
            mesh.position.set(px, py, pz);
            mesh.rotation.y = segRotY(ns, car.dir);
          }
        }
      } else {
        const [px, py, pz] = segPos(seg, car.t, car.laneOff);
        mesh.position.set(px, py, pz);
        mesh.rotation.y = segRotY(seg, car.dir);
      }
    });
  });

  return (
    <group>
      {cars.map((car, i) => {
        const seg = segments[car.segIdx] ?? segments[0];
        if (!seg) return null;
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
