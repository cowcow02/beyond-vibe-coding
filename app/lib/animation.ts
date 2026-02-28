// app/lib/animation.ts

/** Spring easing: t = 0→1, returns eased value with slight overshoot */
export function springEase(t: number): number {
  if (t >= 1) return 1;
  const c = 1.70158 * 1.525; // back easing constant
  const t2 = t / 0.5;
  if (t2 < 1) return 0.5 * (t2 * t2 * ((c + 1) * t2 - c));
  const t3 = t2 - 2;
  return 0.5 * (t3 * t3 * ((c + 1) * t3 + c) + 2);
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface FloorAnimation {
  districtId: string;
  buildingId: string;
  floorIndex: number;   // which floor (0-based)
  startY: number;       // pixels above final position (negative = above)
  progress: number;     // 0→1
  duration: number;     // ms
  startTime: number;    // performance.now() when started
  direction: 'in' | 'out';
}

export interface BuildingAnimation {
  districtId: string;
  buildingId: string;
  progress: number;
  duration: number;
  startTime: number;
  direction: 'in' | 'out';
}

export interface DistrictAnimation {
  districtId: string;
  progress: number;
  duration: number;
  startTime: number;
  direction: 'in' | 'out';
}

export interface AnimationState {
  floors: FloorAnimation[];
  buildings: BuildingAnimation[];
  districts: DistrictAnimation[];
}

/** Returns updated progress for an animation item */
export function tickProgress(item: { startTime: number; duration: number }, now: number): number {
  return Math.min(1, (now - item.startTime) / item.duration);
}

/** Is any animation still running? */
export function isAnimating(state: AnimationState): boolean {
  return (
    state.floors.some(f => f.progress < 1) ||
    state.buildings.some(b => b.progress < 1) ||
    state.districts.some(d => d.progress < 1)
  );
}
