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

  const unlockedCount = Math.min(level + 1, 6);

  return (
    <div
      className="fixed inset-0 flex"
      style={{ zIndex: 9999, backdropFilter: 'blur(12px)', background: 'rgba(2,6,23,0.92)' }}
    >
      {/* ── Left panel ───────────────────────────────────────────────────── */}
      <div
        className="w-1/2 flex flex-col border-r"
        style={{
          borderColor: 'rgba(51,65,85,0.4)',
          background: 'rgba(4,10,30,0.6)',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(51,65,85,0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
          <button
            onClick={showDetail ? () => setShowDetail(false) : onBack}
            className="font-mono text-[11px] text-slate-500 hover:text-slate-200 transition-colors mb-4 flex items-center gap-1.5 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            {showDetail ? 'all floors' : 'back to district'}
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: colors.accent, fontSize: '8px' }}>■</span>
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.15em]">
                  {district.name}
                </span>
              </div>
              <h2 className="font-mono text-2xl font-bold text-white tracking-tight">{building.name}</h2>
            </div>

            {/* Progress pips */}
            {!showDetail && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px', height: '8px',
                        borderRadius: '2px',
                        background: i < unlockedCount ? colors.accent : 'rgba(51,65,85,0.4)',
                        boxShadow: i < unlockedCount ? `0 0 4px ${colors.accent}66` : 'none',
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px]" style={{ color: `${colors.accent}99` }}>
                  {unlockedCount}/6 unlocked
                </span>
              </div>
            )}
          </div>
        </div>

        {showDetail && activeFloor ? (
          /* ── Detail view ── */
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Large decorative level number */}
            <div className="relative px-6 pt-6 pb-4 overflow-hidden">
              <div
                className="absolute right-4 top-2 font-mono font-bold select-none pointer-events-none"
                style={{ fontSize: '96px', lineHeight: 1, color: `${colors.accent}0e`, letterSpacing: '-0.05em' }}
              >
                L{activeFloor.level}
              </div>
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded font-mono text-xs font-bold mb-3"
                style={{
                  background: `${colors.accent}18`,
                  color: colors.accent,
                  border: `1px solid ${colors.accent}40`,
                  boxShadow: `0 0 12px ${colors.accent}20`,
                }}
              >
                <span>FLOOR {activeFloor.level}</span>
              </div>
              <h3 className="font-mono text-3xl font-bold text-white leading-tight mb-3">
                {activeFloor.title}
              </h3>
              <p className="font-mono text-sm leading-relaxed" style={{ color: 'rgba(148,163,184,0.85)' }}>
                {activeFloor.description}
              </p>
            </div>

            {/* Skills */}
            {activeFloor.skills.length > 0 && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1" style={{ background: `${colors.accent}30` }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: `${colors.accent}80` }}>
                    skills
                  </span>
                  <div className="h-px flex-1" style={{ background: `${colors.accent}30` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFloor.skills.map(skill => (
                    <span
                      key={skill}
                      className="font-mono text-xs px-3 py-1.5 rounded"
                      style={{
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(51,65,85,0.6)',
                        color: 'rgba(226,232,240,0.85)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prev / Next */}
            <div
              className="mt-auto mx-6 mb-6 flex items-center justify-between rounded-lg px-4 py-3"
              style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.4)' }}
            >
              <button
                onClick={goToPrevFloor}
                disabled={selectedFloor === null || selectedFloor <= 0}
                className="font-mono text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-1.5"
                style={{ color: colors.accent }}
              >
                ← L{(selectedFloor ?? 0) - 1}
              </button>
              <div className="flex gap-1">
                {Array.from({ length: unlockedCount }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFloor(i)}
                    className="cursor-pointer"
                    style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: i === selectedFloor ? colors.accent : `${colors.accent}30`,
                      boxShadow: i === selectedFloor ? `0 0 6px ${colors.accent}` : 'none',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={goToNextFloor}
                disabled={selectedFloor === null || selectedFloor >= level || selectedFloor >= 5}
                className="font-mono text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-1.5"
                style={{ color: colors.accent }}
              >
                L{(selectedFloor ?? 0) + 1} →
              </button>
            </div>
          </div>
        ) : (
          /* ── Floor card list ── */
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {building.floors.map(floor => {
              const isUnlocked = floor.level <= level;
              const isActive   = floor.level === selectedFloor;

              return (
                <div
                  key={floor.level}
                  data-active={isActive ? 'true' : undefined}
                  onClick={() => isUnlocked && handleCardClick(floor.level)}
                  style={{
                    borderLeft: isActive
                      ? `3px solid ${colors.accent}`
                      : isUnlocked
                      ? `3px solid ${colors.accent}28`
                      : '3px solid rgba(51,65,85,0.2)',
                    background: isActive
                      ? `${colors.accent}0c`
                      : isUnlocked
                      ? 'rgba(15,23,42,0.5)'
                      : 'rgba(8,12,24,0.3)',
                    boxShadow: isActive ? `inset 0 0 30px ${colors.accent}08` : 'none',
                  }}
                  className={`rounded-r-lg p-3 transition-all duration-200 ${
                    !isUnlocked ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    {/* Level badge */}
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: isActive ? `${colors.accent}25` : 'rgba(15,23,42,0.8)',
                        color: isActive ? colors.accent : isUnlocked ? 'rgba(148,163,184,0.7)' : 'rgba(51,65,85,0.8)',
                        border: `1px solid ${isActive ? colors.accent + '50' : 'rgba(51,65,85,0.4)'}`,
                      }}
                    >
                      L{floor.level}
                    </span>
                    <span className={`font-mono text-sm font-semibold ${
                      isUnlocked ? 'text-slate-100' : 'text-slate-600'
                    }`}>
                      {floor.title}
                    </span>
                    {!isUnlocked && (
                      <span className="ml-auto font-mono text-[10px] text-slate-700 border border-slate-800 px-1.5 py-0.5 rounded">
                        locked
                      </span>
                    )}
                  </div>
                  <p className={`font-mono text-xs leading-relaxed ${
                    isUnlocked ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {floor.description}
                  </p>
                  {isUnlocked && floor.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {floor.skills.map(skill => (
                        <span
                          key={skill}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(51,65,85,0.35)',
                            color: 'rgba(148,163,184,0.6)',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: 3D building mini-canvas + slider ──────────────────────── */}
      <div className="w-1/2 flex flex-col" style={{ background: '#050d1f' }}>
        <div className="flex-1 relative">
          {/* Radial spotlight behind building */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 55%, ${colors.accent}12 0%, transparent 70%)`,
            }}
          />

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
            <color attach="background" args={['#050d1f']} />
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
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <span className="font-mono text-[10px]" style={{ color: 'rgba(51,65,85,0.7)' }}>
              hover a floor · click to explore · scroll to zoom
            </span>
          </div>
        </div>

        {/* Slider */}
        <LevelSlider
          level={level}
          onChange={onLevelChange}
          className="flex flex-col items-center pb-5 pt-3"
        />
      </div>
    </div>
  );
}
