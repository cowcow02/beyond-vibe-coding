// app/page.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
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
  const [storyLevel, setStoryLevel] = useState(5);           // hero shows final city
  const [cityBrightness, setCityBrightness] = useState(0.4); // hero: visible but dim
  const pendingLevelRef = useRef<number>(5);                 // level to apply on reveal

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
    // Store the pending level — don't apply it yet.
    // The city keeps showing the PREVIOUS level during the title card.
    // storyLevel is only updated once the title has fully faded out (in handlePhaseChange).
    if (lvl < 0) {
      // Hero: show full city
      pendingLevelRef.current = 5;
      setStoryLevel(5);
      setCityBrightness(0.4);
    } else {
      pendingLevelRef.current = lvl;
    }
  }

  function handlePhaseChange(lvl: number, phase: string) {
    if (phase === 'title') {
      setCityBrightness(0.2); // dim the existing city during title card
    }
    if (phase === 'reveal') {
      // Title overlay exit animation takes ~500ms — wait for it to finish,
      // then apply the new level so buildings grow in on a clean screen.
      setTimeout(() => {
        const target = pendingLevelRef.current;
        if (target === 0) {
          // L0: keep the full city — the narrative is "what you can't see yet
          // is the city around you." Showing the full city during L0 is intentional.
          setCityBrightness(1.0);
        } else {
          setStoryLevel(target);
          setCityBrightness(1.0);
        }
      }, 500);
    }
    if (phase === 'settle')    setCityBrightness(0.35);
    if (phase === 'narrative') setCityBrightness(0.35);
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
