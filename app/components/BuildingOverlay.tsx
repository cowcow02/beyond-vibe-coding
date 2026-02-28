// app/components/BuildingOverlay.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR_HEIGHT, TILE_SIZE } from '../lib/cityLayout';
import { districts } from '../data/city';
import { CityBuilding } from './CityBuilding';
import { DISTRICT_COLORS, DISTRICT_STYLES } from './CityWorld';
import LevelSlider from './LevelSlider';

interface Props {
  districtId: string;
  buildingId: string;
  level: number;
  onLevelChange: (level: number) => void;
  onBack: () => void;
}

// ── Mini canvas: one building with slow auto-rotation ───────────────────────

function RotatingBuilding({
  districtId,
  buildingId,
  level,
  selectedFloor,
  hoveredFloor,
  onFloorClick,
  onFloorHover,
}: {
  districtId: string;
  buildingId: string;
  level: number;
  selectedFloor: number | null;
  hoveredFloor: number | null;
  onFloorClick: (floor: number) => void;
  onFloorHover: (floor: number | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rotating = useRef(true);

  const district = districts.find(d => d.id === districtId)!;
  const building = district.buildings.find(b => b.id === buildingId)!;
  const colors   = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend'];
  const dStyle   = DISTRICT_STYLES[districtId] ?? DISTRICT_STYLES['frontend'];

  // Pause rotation while hovering or when a floor is focused
  useFrame((_, delta) => {
    if (!groupRef.current || !rotating.current || selectedFloor !== null) return;
    groupRef.current.rotation.y += 0.2 * delta;
  });

  const FLOOR_W = TILE_SIZE * 0.82;
  const labelFloor = hoveredFloor ?? selectedFloor;
  const labelData  = labelFloor !== null ? building.floors[labelFloor] : null;
  const labelY     = labelFloor !== null ? labelFloor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 : 0;

  return (
    <>
      <ambientLight intensity={1.2} color="#d8eaff" />
      <directionalLight position={[30, 60, 20]} intensity={2.0} color="#fff5e0" />
      <directionalLight position={[-20, 30, -20]} intensity={0.5} color="#c8e8ff" />

      <group
        ref={groupRef}
        onPointerEnter={() => { rotating.current = false; }}
        onPointerLeave={() => { rotating.current = true; onFloorHover(null); }}
      >
        <CityBuilding
          building={building}
          district={district}
          level={level}
          accentColor={colors.accent}
          districtStyle={dStyle}
          isSelected={false}
          onBuildingClick={() => {}}
          worldX={0}
          worldZ={0}
          facing="south"
          selectedFloor={selectedFloor ?? undefined}
          hoveredFloor={hoveredFloor ?? undefined}
          onFloorClick={onFloorClick}
          onFloorHover={onFloorHover}
          showLabel={false}
        />
      </group>

      {/* Floor label — outside the rotating group so it stays in place */}
      {labelData && (
        <Html position={[FLOOR_W / 2 + 0.2, labelY, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '18px', height: '1px', background: colors.accent, opacity: 0.8 }} />
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              background: 'rgba(2,6,23,0.85)',
              border: `1px solid ${colors.accent}55`,
              borderRadius: '4px',
              padding: '2px 7px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ color: colors.accent, fontSize: '10px', fontWeight: 'bold' }}>
                L{labelFloor}
              </span>
              <span style={{ color: '#e2e8f0' }}>{labelData.title}</span>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

// ── Main overlay ─────────────────────────────────────────────────────────────

export function BuildingOverlay({ districtId, buildingId, level, onLevelChange, onBack }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(level);
  const [hoveredFloor,  setHoveredFloor]  = useState<number | null>(null);
  const [showDetail,    setShowDetail]    = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const district = districts.find(d => d.id === districtId);
  const building = district?.buildings.find(b => b.id === buildingId);
  const colors   = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend'];

  // When level changes, update selected floor and exit detail view
  useEffect(() => {
    setSelectedFloor(level);
    setShowDetail(false);
  }, [level]);

  // Auto-scroll active floor card into view (list mode only)
  useEffect(() => {
    if (!showDetail && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFloor, showDetail]);

  const handleFloorClick = useCallback((floor: number) => {
    if (!building) return;
    const floorData = building.floors.find(f => f.level === floor);
    if (!floorData || floorData.level > level) return; // locked
    setSelectedFloor(floor);
    setShowDetail(true);
  }, [building, level]);

  const handleCardClick = useCallback((floor: number) => {
    setSelectedFloor(floor);
    setShowDetail(true);
  }, []);

  const goToPrevFloor = useCallback(() => {
    if (selectedFloor === null || selectedFloor <= 0) return;
    const prev = selectedFloor - 1;
    if (prev <= level) { setSelectedFloor(prev); }
  }, [selectedFloor, level]);

  const goToNextFloor = useCallback(() => {
    if (selectedFloor === null) return;
    const next = selectedFloor + 1;
    if (next <= level && next <= 5) { setSelectedFloor(next); }
  }, [selectedFloor, level]);

  if (!district || !building) return null;

  const activeFloor = selectedFloor !== null
    ? building.floors.find(f => f.level === selectedFloor)
    : null;

  return (
    <div
      className="fixed inset-0 flex"
      style={{ zIndex: 9999, backdropFilter: 'blur(8px)', background: 'rgba(2,6,23,0.90)' }}
    >
      {/* ── Left panel ───────────────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>

        {/* Header — always visible */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
          <button
            onClick={showDetail ? () => setShowDetail(false) : onBack}
            className="font-mono text-xs text-slate-400 hover:text-white transition-colors mb-3 flex items-center gap-1.5"
          >
            {showDetail ? '← All floors' : '← Back to district'}
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: colors.accent, fontSize: '10px' }}>●</span>
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              {district.name}
            </span>
          </div>
          <h2 className="font-mono text-xl font-bold text-white">{building.name}</h2>
          {!showDetail && (
            <p className="font-mono text-xs text-slate-500 mt-1">
              {Math.min(level + 1, 6)} of 6 floors unlocked
            </p>
          )}
        </div>

        {showDetail && activeFloor ? (
          /* ── Detail view ── */
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Level badge */}
            <div className="mb-4">
              <span
                className="font-mono text-xs font-bold px-2 py-1 rounded"
                style={{ background: `${colors.accent}22`, color: colors.accent, border: `1px solid ${colors.accent}44` }}
              >
                L{activeFloor.level}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-mono text-3xl font-bold text-white mb-4 leading-tight">
              {activeFloor.title}
            </h3>

            {/* Description */}
            <p className="font-mono text-sm text-slate-300 leading-relaxed mb-6">
              {activeFloor.description}
            </p>

            {/* Skills */}
            {activeFloor.skills.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                  Skills at this level
                </p>
                <ul className="space-y-2">
                  {activeFloor.skills.map(skill => (
                    <li key={skill} className="font-mono text-sm text-slate-200 flex items-start gap-3">
                      <span style={{ color: colors.accent }} className="mt-0.5 text-base leading-none">·</span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="mt-auto pt-6 flex items-center justify-between border-t" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
              <button
                onClick={goToPrevFloor}
                disabled={selectedFloor === null || selectedFloor <= 0}
                className="font-mono text-xs text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                ← L{(selectedFloor ?? 0) - 1}
              </button>
              <span className="font-mono text-[10px] text-slate-600">
                {(selectedFloor ?? 0) + 1} / {Math.min(level + 1, 6)}
              </span>
              <button
                onClick={goToNextFloor}
                disabled={selectedFloor === null || selectedFloor >= level || selectedFloor >= 5}
                className="font-mono text-xs text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                L{(selectedFloor ?? 0) + 1} →
              </button>
            </div>
          </div>
        ) : (
          /* ── Floor card list ── */
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {building.floors.map(floor => {
              const isUnlocked = floor.level <= level;
              const isActive   = floor.level === selectedFloor;

              return (
                <div
                  key={floor.level}
                  data-active={isActive ? 'true' : undefined}
                  onClick={() => isUnlocked && handleCardClick(floor.level)}
                  className={`rounded-lg border p-3 transition-all duration-200 ${
                    !isUnlocked
                      ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-900/30'
                      : isActive
                      ? 'cursor-pointer border-amber-500/70 bg-amber-500/10'
                      : 'cursor-pointer border-slate-700 bg-slate-900/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`font-mono text-xs font-bold w-6 ${
                      isActive ? 'text-amber-400' : isUnlocked ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      L{floor.level}
                    </span>
                    <span className={`font-mono text-sm font-semibold ${
                      isUnlocked ? 'text-slate-100' : 'text-slate-600'
                    }`}>
                      {floor.title}
                    </span>
                    {!isUnlocked && <span className="text-slate-700 text-xs ml-auto">🔒</span>}
                    {isActive && isUnlocked && (
                      <span className="text-amber-400 text-xs ml-auto">●</span>
                    )}
                  </div>
                  <p className={`font-mono text-xs mb-2 ${
                    isUnlocked ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {floor.description}
                  </p>
                  {isUnlocked && floor.skills.length > 0 && (
                    <ul className="space-y-0.5">
                      {floor.skills.map(skill => (
                        <li key={skill} className="font-mono text-[10px] text-slate-500 flex items-start gap-1.5">
                          <span style={{ color: colors.accent }} className="mt-0.5">·</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: 3D building mini-canvas + slider ──────────────────────── */}
      <div className="w-1/2 flex flex-col" style={{ background: '#0a1628' }}>
        {/* Canvas grows to fill remaining space */}
        <div className="flex-1 relative">
          <Canvas
            style={{ width: '100%', height: '100%' }}
            orthographic
            camera={{
              position: [40, 28, 40],
              zoom: 70,
              near: 0.1,
              far: 500,
              up: [0, 1, 0],
            }}
          >
            <color attach="background" args={['#0a1628']} />
            <RotatingBuilding
              districtId={districtId}
              buildingId={buildingId}
              level={level}
              selectedFloor={selectedFloor}
              hoveredFloor={hoveredFloor}
              onFloorClick={handleFloorClick}
              onFloorHover={setHoveredFloor}
            />
            <OrbitControls
              enableRotate={false}
              enableZoom={true}
              enablePan={false}
              minZoom={8}
              maxZoom={150}
              target={[0, 1.5, 0]}
            />
          </Canvas>

          {/* Hint */}
          <div className="absolute top-3 left-0 right-0 text-center pointer-events-none">
            <span className="font-mono text-[10px] text-slate-700">
              hover a floor · click to explore · scroll to zoom
            </span>
          </div>
        </div>

        {/* Slider below the canvas */}
        <LevelSlider
          level={level}
          onChange={onLevelChange}
          className="flex flex-col items-center pb-5 pt-3"
        />
      </div>
    </div>
  );
}
