// app/components/BuildingOverlay.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { districts } from '../data/city';
import { CityBuilding } from './CityBuilding';
import { DISTRICT_COLORS, DISTRICT_STYLES } from './CityWorld';

interface Props {
  districtId: string;
  buildingId: string;
  level: number;
  onBack: () => void;
}

// ── Mini canvas: one building with slow auto-rotation ───────────────────────

function RotatingBuilding({
  districtId,
  buildingId,
  level,
  selectedFloor,
}: {
  districtId: string;
  buildingId: string;
  level: number;
  selectedFloor: number | null;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const hovering  = useRef(false);

  const district  = districts.find(d => d.id === districtId)!;
  const building  = district.buildings.find(b => b.id === buildingId)!;
  const colors    = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend'];
  const dStyle    = DISTRICT_STYLES[districtId] ?? DISTRICT_STYLES['frontend'];

  useFrame((_, delta) => {
    if (!groupRef.current || hovering.current) return;
    groupRef.current.rotation.y += 0.2 * delta;
  });

  return (
    <>
      <ambientLight intensity={1.2} color="#d8eaff" />
      <directionalLight position={[30, 60, 20]} intensity={2.0} color="#fff5e0" />
      <directionalLight position={[-20, 30, -20]} intensity={0.5} color="#c8e8ff" />

      <group
        ref={groupRef}
        onPointerEnter={() => { hovering.current = true; }}
        onPointerLeave={() => { hovering.current = false; }}
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
        />
      </group>
    </>
  );
}

// ── Main overlay ─────────────────────────────────────────────────────────────

export function BuildingOverlay({ districtId, buildingId, level, onBack }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(level);
  const listRef = useRef<HTMLDivElement>(null);

  const district = districts.find(d => d.id === districtId);
  const building = district?.buildings.find(b => b.id === buildingId);
  const colors   = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend'];

  // When level changes, point selected floor at current level
  useEffect(() => {
    setSelectedFloor(level);
  }, [level]);

  // Auto-scroll active floor card into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFloor]);

  if (!district || !building) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(2,6,23,0.82)' }}
    >
      {/* ── Left: floor list ─────────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
          <button
            onClick={onBack}
            className="font-mono text-xs text-slate-400 hover:text-white transition-colors mb-3 flex items-center gap-1.5"
          >
            ← Back to district
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: colors.accent, fontSize: '10px' }}>●</span>
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              {district.name}
            </span>
          </div>
          <h2 className="font-mono text-xl font-bold text-white">{building.name}</h2>
          <p className="font-mono text-xs text-slate-500 mt-1">
            {Math.min(level + 1, 6)} of 6 floors unlocked
          </p>
        </div>

        {/* Floor cards */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {building.floors.map(floor => {
            const isUnlocked = floor.level <= level;
            const isActive   = floor.level === selectedFloor;

            return (
              <div
                key={floor.level}
                data-active={isActive ? 'true' : undefined}
                onClick={() => isUnlocked && setSelectedFloor(floor.level)}
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

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
          <p className="font-mono text-[10px] text-slate-600 text-center">
            Drag the level slider to unlock more floors
          </p>
        </div>
      </div>

      {/* ── Right: 3D building mini-canvas ───────────────────────────────── */}
      <div className="w-1/2 relative">
        <Canvas
          orthographic
          camera={{
            position: [40, 28, 40],
            zoom: 22,
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
          />
          <OrbitControls
            enableRotate={true}
            enableZoom={true}
            enablePan={false}
            minZoom={8}
            maxZoom={60}
          />
        </Canvas>

        {/* Hint overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="font-mono text-[10px] text-slate-600">
            drag to rotate · scroll to zoom
          </span>
        </div>
      </div>
    </div>
  );
}
