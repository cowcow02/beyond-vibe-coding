// app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import CityCanvas from './components/CityCanvas';
import LevelSlider from './components/LevelSlider';
import { DistrictStrip } from './components/DistrictStrip';
import { BuildingOverlay } from './components/BuildingOverlay';
import { LEVEL_LABELS } from './data/city';

type Mode = 'city' | 'district' | 'building';

export default function Home() {
  const [level,            setLevel]            = useState(0);
  const [mode,             setMode]             = useState<Mode>('city');
  const [focusedDistrict,  setFocusedDistrict]  = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  // Level change — resets to city view when in district mode
  const handleLevelChange = useCallback((newLevel: number) => {
    setLevel(newLevel);
    if (mode === 'district') {
      setMode('city');
      setFocusedDistrict(null);
    }
  }, [mode]);

  // City → District
  const handleDistrictClick = useCallback((districtId: string) => {
    setFocusedDistrict(districtId);
    setMode('district');
  }, []);

  // District → City
  const handleBackToCity = useCallback(() => {
    setMode('city');
    setFocusedDistrict(null);
    setSelectedBuilding(null);
  }, []);

  // Any mode → Building
  const handleBuildingClick = useCallback((districtId: string, buildingId: string) => {
    if (!districtId) return;
    if (mode === 'city') setFocusedDistrict(districtId);
    setSelectedBuilding({ districtId, buildingId });
    setMode('building');
  }, [mode]);

  // Building → District
  const handleBackToDistrict = useCallback(() => {
    setMode('district');
    setSelectedBuilding(null);
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      {/* Canvas city */}
      <CityCanvas
        level={level}
        onBuildingClick={handleBuildingClick}
        selectedBuilding={selectedBuilding}
        mode={mode}
        focusedDistrictId={focusedDistrict}
        onDistrictClick={handleDistrictClick}
      />

      {/* Title — hidden when building overlay is open */}
      {mode !== 'building' && (
        <div
          className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.8), transparent)' }}
        >
          <h1 className="font-mono text-2xl font-bold text-amber-300 tracking-tight">
            Beyond Vibe Coding
          </h1>
          <p className="font-mono text-xs text-slate-500 mt-1">
            {LEVEL_LABELS[level].title} — {LEVEL_LABELS[level].tagline}
          </p>
        </div>
      )}

      {/* District info strip */}
      {mode === 'district' && focusedDistrict && (
        <DistrictStrip
          districtId={focusedDistrict}
          level={level}
          onBack={handleBackToCity}
        />
      )}

      {/* Building overlay — slider is embedded inside */}
      {mode === 'building' && selectedBuilding && (
        <BuildingOverlay
          districtId={selectedBuilding.districtId}
          buildingId={selectedBuilding.buildingId}
          level={level}
          onLevelChange={setLevel}
          onBack={handleBackToDistrict}
        />
      )}

      {/* Level slider — hidden when building overlay owns it */}
      {mode !== 'building' && <LevelSlider level={level} onChange={handleLevelChange} />}
    </main>
  );
}
