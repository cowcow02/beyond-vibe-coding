// app/page.tsx
'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CityCanvas from './components/CityCanvas';
import { StoryScroll } from './components/StoryScroll';
import type { StoryScrollHandle } from './components/StoryScroll';
import LevelSlider from './components/LevelSlider';
import { DistrictStrip } from './components/DistrictStrip';
import { BuildingOverlay } from './components/BuildingOverlay';
import { UnlockCarousel } from './components/UnlockCarousel';
import { getUnlocksForLevel } from './lib/unlocks';
import type { UnlockItem } from './lib/unlocks';
import { accentColorForLevel } from './lib/levelColors';
import { webCity, LEVEL_LABELS } from './data/city';

type Mode = 'city' | 'district' | 'building';
type AppMode = 'story' | 'explore' | 'sandbox';

export default function Home() {
  // App-level mode
  const [appMode, setAppMode] = useState<AppMode>('story');

  // Story state
  const [storyLevel, setStoryLevel] = useState(5);           // hero shows final city
  const [cityBrightness, setCityBrightness] = useState(0.4); // hero: visible but dim
  const [cityBrightnessInstant, setCityBrightnessInstant] = useState(false);
  const pendingLevelRef = useRef<number>(5);                 // level to apply on reveal
  const storyScrollRef  = useRef<StoryScrollHandle>(null);

  // Shared city state (used in explore + sandbox)
  const [level,            setLevel]            = useState(5);
  const [mode,             setMode]             = useState<Mode>('city');
  const [focusedDistrict,  setFocusedDistrict]  = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  // Carousel state (shared across explore + sandbox)
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [focusedItemDistrictId, setFocusedItemDistrictId] = useState<string | null>(null);
  const [focusedItemBuildingId, setFocusedItemBuildingId] = useState<string | null>(null);

  // Derived unlock items
  const unlockItems = useMemo(() => getUnlocksForLevel(level, webCity), [level]);

  // Derived canvas level
  const canvasLevel = appMode === 'story' ? storyLevel : level;

  // --- Story handlers ---

  function handleSectionEnter(lvl: number) {
    // Only exit explore mode when navigating to a DIFFERENT section.
    // IntersectionObserver re-fires on the same section when scrollSnapType changes
    // (frozen toggles), so we must guard against that here.
    if (appMode === 'explore' && lvl !== level) {
      setAppMode('story');
      setMode('city');
      setFocusedDistrict(null);
    }
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
    // level stays at its current value (last explore level or default 5)
  }

  function handleExplore(lvl: number) {
    setLevel(lvl);           // lock to this story level
    setAppMode('explore');
    setMode('city');
    setCityBrightness(1.0);
    setActiveItemId(null);
    setFocusedItemDistrictId(null);
    setFocusedItemBuildingId(null);
  }

  const handleCarouselItemClick = useCallback((item: UnlockItem) => {
    setActiveItemId(item.id);
    setFocusedItemDistrictId(item.districtId);
    setFocusedItemBuildingId(item.buildingId ?? null);
  }, []);

  // --- Sandbox handlers ---

  const handleLevelChange = useCallback((newLevel: number) => {
    setLevel(newLevel);
    setActiveItemId(null);
    setFocusedItemDistrictId(null);
    setFocusedItemBuildingId(null);
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
        onBuildingClick={appMode === 'sandbox' ? handleBuildingClick : () => {}}
        selectedBuilding={selectedBuilding}
        mode={mode}
        focusedDistrictId={focusedDistrict}
        onDistrictClick={handleDistrictClick}
        onBackToCity={handleBackToCity}
        focusedItemDistrictId={focusedItemDistrictId}
        focusedItemBuildingId={focusedItemBuildingId}
      />

      {/* Story overlay — only in story/explore mode (scroll UI) */}
      {appMode !== 'sandbox' && (
        <StoryScroll
          ref={storyScrollRef}
          onLevelChange={handleSectionEnter}
          onPhaseChange={handlePhaseChange}
          onSandboxEnter={handleSandboxEnter}
          onExplore={handleExplore}
          frozen={appMode === 'explore'}
        />
      )}

      {/* Carousel — shown in explore and sandbox modes */}
      <AnimatePresence>
        {appMode !== 'story' && mode !== 'building' && (
          <UnlockCarousel
            level={level}
            items={unlockItems}
            accentColor={accentColorForLevel(level)}
            activeItemId={activeItemId}
            onItemClick={handleCarouselItemClick}
            bottomOffset={appMode === 'sandbox' ? 76 : 0}
            nextLabel={appMode === 'explore'
              ? (level < 5
                  ? `Next: ${LEVEL_LABELS[level + 1]?.title} →`
                  : 'Enter Sandbox →')
              : undefined}
            onNext={appMode === 'explore' ? () => {
              const nextIndex = level + 2;
              setAppMode('story');
              setMode('city');
              setFocusedDistrict(null);
              setCityBrightness(0.35);
              setActiveItemId(null);
              setFocusedItemDistrictId(null);
              setFocusedItemBuildingId(null);
              storyScrollRef.current?.scrollToSection(nextIndex);
            } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Sandbox UI — level slider + district/building overlays */}
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
