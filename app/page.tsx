// app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import CityCanvas from './components/CityCanvas';
import { StoryScroll } from './components/StoryScroll';
import LevelSlider from './components/LevelSlider';
import { DistrictStrip } from './components/DistrictStrip';
import { BuildingOverlay } from './components/BuildingOverlay';

type Mode = 'city' | 'district' | 'building';
type AppMode = 'story' | 'sandbox';

export default function Home() {
  // App-level mode
  const [appMode, setAppMode] = useState<AppMode>('story');

  // Story state
  const [storyLevel, setStoryLevel] = useState(-1);         // -1=hero, 0-5=levels
  const [cityBrightness, setCityBrightness] = useState(0.2); // hero starts dim

  // Sandbox state
  const [level,            setLevel]            = useState(5); // sandbox always starts at L5
  const [mode,             setMode]             = useState<Mode>('city');
  const [focusedDistrict,  setFocusedDistrict]  = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  // Derived canvas level
  const canvasLevel = appMode === 'story' ? storyLevel : level;

  // --- Story handlers ---

  function handleSectionEnter(lvl: number) {
    setStoryLevel(lvl);
    if (lvl === -1) setCityBrightness(0.2); // hero
  }

  function handlePhaseChange(lvl: number, phase: string) {
    if (phase === 'title')     setCityBrightness(0.2);  // dim during title card
    if (phase === 'reveal')    setCityBrightness(1.0);  // full brightness for city expansion
    if (phase === 'settle')    setCityBrightness(0.35); // dim to texture
    if (phase === 'narrative') setCityBrightness(0.35); // stays dim during reading
  }

  function handleSandboxEnter() {
    setAppMode('sandbox');
    setCityBrightness(1.0);
  }

  // --- Sandbox handlers ---

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
      {/* Canvas — always mounted, always full screen */}
      <CityCanvas
        level={canvasLevel}
        cityBrightness={cityBrightness}
        storyMode={appMode === 'story'}
        onBuildingClick={handleBuildingClick}
        selectedBuilding={selectedBuilding}
        mode={mode}
        focusedDistrictId={focusedDistrict}
        onDistrictClick={handleDistrictClick}
        onBackToCity={handleBackToCity}
      />

      {/* Story overlay — only in story mode */}
      {appMode === 'story' && (
        <StoryScroll
          onLevelChange={handleSectionEnter}
          onPhaseChange={handlePhaseChange}
          onSandboxEnter={handleSandboxEnter}
        />
      )}

      {/* Sandbox UI — only in sandbox mode */}
      {appMode === 'sandbox' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {mode === 'district' && focusedDistrict && (
            <DistrictStrip districtId={focusedDistrict} level={level} onBack={handleBackToCity} />
          )}
          {mode === 'building' && selectedBuilding && (
            <BuildingOverlay
              districtId={selectedBuilding.districtId}
              buildingId={selectedBuilding.buildingId}
              level={level}
              onLevelChange={setLevel}
              onBack={handleBackToDistrict}
            />
          )}
          {mode !== 'building' && <LevelSlider level={level} onChange={handleLevelChange} />}
        </motion.div>
      )}
    </main>
  );
}
