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
  const [cityBrightnessInstant, setCityBrightnessInstant] = useState(false);
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
      if (lvl === 0) {
        // L0: drop to black INSTANTLY so the spring collapse from L5→-1 is invisible.
        setCityBrightnessInstant(true);
        setCityBrightness(0);
        setStoryLevel(-1);
      } else {
        setCityBrightnessInstant(false);
        setCityBrightness(0.2);
      }
    }
    if (phase === 'reveal') {
      // Wait for title overlay to finish fading (~500ms), then reveal the city.
      // For L0: restore smooth brightness transition and set level=0 simultaneously.
      // The 0.7s CSS brightness transition naturally masks the early spring phase —
      // roads/cars are invisible at brightness=0 and only become visible as the city
      // brightens, by which point buildings are already partway through their spring.
      setTimeout(() => {
        setCityBrightnessInstant(false);
        setCityBrightness(1.0);
        if (lvl === 0) setStoryLevel(0);
        else setStoryLevel(pendingLevelRef.current);
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

  const handleLevelChange = useCallback((newLevel: number) => {
    setLevel(newLevel);
    if (mode === 'district') {
      setMode('city');
      setFocusedDistrict(null);
    }
  }, [mode]);

  const handleDistrictClick = useCallback((districtId: string) => {
    setFocusedDistrict(districtId);
    setMode('district');
  }, []);

  const handleBackToCity = useCallback(() => {
    setMode('city');
    setFocusedDistrict(null);
    setSelectedBuilding(null);
  }, []);

  const handleBuildingClick = useCallback((districtId: string, buildingId: string) => {
    if (!districtId) return;
    if (mode === 'city') setFocusedDistrict(districtId);
    setSelectedBuilding({ districtId, buildingId });
    setMode('building');
  }, [mode]);

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
        cityBrightnessInstant={cityBrightnessInstant}
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
