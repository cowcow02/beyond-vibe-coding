// app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import CityCanvas from './components/CityCanvas';
import LevelSlider from './components/LevelSlider';
import BuildingPanel from './components/BuildingPanel';
import { LEVEL_LABELS } from './data/city';

export default function Home() {
  const [level, setLevel] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  const handleBuildingClick = useCallback((districtId: string, buildingId: string) => {
    if (!districtId) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding({ districtId, buildingId });
    }
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      {/* Canvas city */}
      <CityCanvas
        level={level}
        onBuildingClick={handleBuildingClick}
        selectedBuilding={selectedBuilding}
      />

      {/* Title */}
      <div className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.8), transparent)' }}>
        <h1 className="font-mono text-2xl font-bold text-amber-300 tracking-tight">
          Beyond Vibe Coding
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-1">
          {LEVEL_LABELS[level].title} — {LEVEL_LABELS[level].tagline}
        </p>
      </div>

      {/* Building panel */}
      {selectedBuilding && (
        <BuildingPanel
          districtId={selectedBuilding.districtId}
          buildingId={selectedBuilding.buildingId}
          currentLevel={level}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      {/* Level slider */}
      <LevelSlider level={level} onChange={setLevel} />
    </main>
  );
}
