// app/components/CityCanvas.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { districts, type District, type Building } from '../data/city';
import {
  TILE_W, TILE_H, FLOOR_H,
  toScreen, drawFloorBox, drawGroundTile,
} from '../lib/isometric';
import {
  springEase, lerp, tickProgress, isAnimating,
  type AnimationState, type FloorAnimation,
  type BuildingAnimation, type DistrictAnimation,
} from '../lib/animation';

// ── Colour palettes per district type ───────────────────────────────────────
const DISTRICT_COLORS: Record<string, { top: string; left: string; right: string; ground: string }> = {
  frontend:      { top: '#60a5fa', left: '#2563eb', right: '#1d4ed8', ground: '#1e3a5f' },
  backend:       { top: '#34d399', left: '#059669', right: '#047857', ground: '#064e3b' },
  databases:     { top: '#a78bfa', left: '#7c3aed', right: '#6d28d9', ground: '#2e1065' },
  devops:        { top: '#fb923c', left: '#ea580c', right: '#c2410c', ground: '#431407' },
  testing:       { top: '#f472b6', left: '#db2777', right: '#be185d', ground: '#500724' },
  security:      { top: '#f87171', left: '#dc2626', right: '#b91c1c', ground: '#450a0a' },
  'system-design': { top: '#38bdf8', left: '#0284c7', right: '#0369a1', ground: '#0c4a6e' },
  performance:   { top: '#fbbf24', left: '#d97706', right: '#b45309', ground: '#451a03' },
  leadership:    { top: '#e879f9', left: '#a21caf', right: '#86198f', ground: '#3b0764' },
};

const ROAD_COLOR   = '#1e293b';
const ROAD_STROKE  = '#334155';
const GROUND_COLOR = '#0f172a';

const DROP_START_Y = -200; // floors drop from this far above

interface Props {
  level: number;            // 0–5
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

export default function CityCanvas({ level, onBuildingClick, selectedBuilding }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const stateRef  = useRef<AnimationState>({ floors: [], buildings: [], districts: [] });
  const levelRef  = useRef(level);
  const originRef = useRef({ x: 0, y: 0 }); // canvas offset to centre city

  // ── Trigger animations when level changes ──────────────────────────────
  useEffect(() => {
    const prevLevel = levelRef.current;
    levelRef.current = level;
    const now = performance.now();
    const newAnim: AnimationState = { floors: [], buildings: [], districts: [] };
    const dir: 'in' | 'out' = level > prevLevel ? 'in' : 'out';
    let delay = 0;

    districts.forEach(district => {
      const wasVisible = district.appearsAtLevel <= prevLevel;
      const isVisible  = district.appearsAtLevel <= level;

      if (!wasVisible && isVisible) {
        // Whole district appears
        newAnim.districts.push({
          districtId: district.id,
          progress: 0, duration: 600,
          startTime: now + delay,
          direction: 'in',
        });
        delay += 120;
      } else if (wasVisible && !isVisible) {
        newAnim.districts.push({
          districtId: district.id,
          progress: 0, duration: 400,
          startTime: now,
          direction: 'out',
        });
      }

      if (wasVisible || isVisible) {
        district.buildings.forEach(building => {
          const prevFloors = Math.min(prevLevel + 1, 6);
          const newFloors  = Math.min(level + 1, 6);

          if (dir === 'in') {
            for (let f = prevFloors; f < newFloors; f++) {
              newAnim.floors.push({
                districtId: district.id,
                buildingId: building.id,
                floorIndex: f,
                startY: DROP_START_Y,
                progress: 0, duration: 500,
                startTime: now + delay,
                direction: 'in',
              });
              delay += 30;
            }
            if (prevFloors === 0 && newFloors > 0) {
              newAnim.buildings.push({
                districtId: district.id, buildingId: building.id,
                progress: 0, duration: 400,
                startTime: now + delay,
                direction: 'in',
              });
            }
          } else {
            for (let f = newFloors; f < prevFloors; f++) {
              newAnim.floors.push({
                districtId: district.id, buildingId: building.id,
                floorIndex: f,
                startY: DROP_START_Y,
                progress: 0, duration: 400,
                startTime: now,
                direction: 'out',
              });
            }
          }
        });
      }
    });

    stateRef.current = {
      floors:    [...stateRef.current.floors,    ...newAnim.floors],
      buildings: [...stateRef.current.buildings, ...newAnim.buildings],
      districts: [...stateRef.current.districts, ...newAnim.districts],
    };
  }, [level]);

  // ── Main draw loop ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const anim = stateRef.current;

    // Tick all animations
    anim.floors.forEach(f => {
      f.progress = tickProgress(f, now);
    });
    anim.buildings.forEach(b => {
      b.progress = tickProgress(b, now);
    });
    anim.districts.forEach(d => {
      d.progress = tickProgress(d, now);
    });

    // Remove completed animations
    stateRef.current = {
      floors:    anim.floors.filter(f => f.progress < 1 || f.direction === 'in'),
      buildings: anim.buildings.filter(b => b.progress < 1),
      districts: anim.districts.filter(d => d.progress < 1),
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = originRef.current.x;
    const oy = originRef.current.y;
    ctx.save();
    ctx.translate(ox, oy);

    // Draw back-to-front: collect all tiles, sort by draw order
    const visibleDistricts = districts.filter(d => d.appearsAtLevel <= level);

    // 1. Ground tiles
    visibleDistricts.forEach(district => {
      const distAnim = anim.districts.find(a => a.districtId === district.id);
      const alpha = distAnim?.direction === 'in'
        ? lerp(0, 1, springEase(distAnim.progress))
        : distAnim?.direction === 'out'
        ? lerp(1, 0, distAnim.progress)
        : 1;

      const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];

      for (let c = 0; c < district.cols; c++) {
        for (let r = 0; r < district.rows; r++) {
          ctx.globalAlpha = alpha;
          drawGroundTile(
            ctx,
            district.originCol + c,
            district.originRow + r,
            colors.ground,
            '#1e293b',
          );
        }
      }

      // Road tiles around the district (1-tile border)
      ctx.globalAlpha = 1;
    });

    // 2. Buildings (floor boxes)
    visibleDistricts.forEach(district => {
      const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
      const numFloors = level + 1;

      district.buildings.forEach(building => {
        const bCol = district.originCol + building.col;
        const bRow = district.originRow + building.row;

        for (let f = 0; f < numFloors && f < 6; f++) {
          // Check if this floor has an animation
          const floorAnim = anim.floors.find(
            a => a.districtId === district.id &&
                 a.buildingId === building.id &&
                 a.floorIndex === f
          );

          let yOffset = 0;
          let alpha = 1;

          if (floorAnim) {
            const eased = springEase(floorAnim.progress);
            if (floorAnim.direction === 'in') {
              yOffset = lerp(DROP_START_Y, 0, eased);
              alpha = lerp(0.2, 1, eased);
            } else {
              yOffset = lerp(0, DROP_START_Y, floorAnim.progress);
              alpha = lerp(1, 0, floorAnim.progress);
            }
          }

          const isSelected =
            selectedBuilding?.districtId === district.id &&
            selectedBuilding?.buildingId === building.id;

          const highlight = isSelected ? 1.4 : 1;

          ctx.save();
          ctx.translate(0, yOffset);
          drawFloorBox(
            ctx, bCol, bRow, f,
            shadeColor(colors.top,   highlight),
            shadeColor(colors.left,  highlight),
            shadeColor(colors.right, highlight),
            alpha,
          );
          ctx.restore();
        }

        // Building label at ground level
        if (numFloors > 0) {
          const { x, y } = toScreen(bCol, bRow);
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(building.name, x, y + TILE_H / 2 + 10);
          ctx.restore();
        }
      });
    });

    ctx.restore();

    animRef.current = requestAnimationFrame(draw);
  }, [level, selectedBuilding]);

  // Start loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Centre the city roughly
      originRef.current = {
        x: canvas.width  * 0.5,
        y: canvas.height * 0.3,
      };
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Click handling
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - originRef.current.x;
    const py = e.clientY - rect.top  - originRef.current.y;

    // Hit test: check full building height (ground tile + all stacked floors)
    const numFloors = level + 1;
    const buildingHeight = numFloors * FLOOR_H;

    for (const district of districts) {
      if (district.appearsAtLevel > level) continue;
      for (const building of district.buildings) {
        const bCol = district.originCol + building.col;
        const bRow = district.originRow + building.row;
        const { x, y } = toScreen(bCol, bRow);
        const dx = Math.abs(px - x);
        const yTop    = y - buildingHeight - TILE_H / 2;
        const yBottom = y + TILE_H / 2 + FLOOR_H;
        if (dx <= TILE_W / 2 + 4 && py >= yTop && py <= yBottom) {
          onBuildingClick(district.id, building.id);
          return;
        }
      }
    }
    onBuildingClick('', ''); // deselect
  }, [level, onBuildingClick]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ cursor: 'pointer', background: GROUND_COLOR }}
      onClick={handleClick}
    />
  );
}

/** Multiply RGB brightness */
function shadeColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r * factor)}, ${Math.min(255, g * factor)}, ${Math.min(255, b * factor)})`;
}
