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
type AppMode = 'story' | 'sandbox';

export default function Home() {
  // App-level mode
  const [appMode, setAppMode] = useState<AppMode>('story');

  // Story state
  const [storyLevel, setStoryLevel] = useState(5);           // hero shows final city
  const [cityBrightness, setCityBrightness] = useState(0.4); // hero: visible but dim
  const [cityBrightnessInstant, setCityBrightnessInstant] = useState(false);
  const pendingLevelRef = useRef<number>(5);                 // level to apply on reveal
  const storyScrollRef  = useRef<StoryScrollHandle>(null);

  // Sandbox state
  const [level,            setLevel]            = useState(5); // sandbox always starts at L5
  const [mode,             setMode]             = useState<Mode>('city');
  const [focusedDistrict,  setFocusedDistrict]  = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  // Carousel state (shared between sandbox + story explore)
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [focusedItemDistrictId, setFocusedItemDistrictId] = useState<string | null>(null);
  const [focusedItemBuildingId, setFocusedItemBuildingId] = useState<string | null>(null);

  // Story explore state
  const [storyExploreLevel, setStoryExploreLevel] = useState<number | null>(null);
  const [storyBuildingOverlay, setStoryBuildingOverlay] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  // Derived unlock items
  const sandboxUnlockItems = useMemo(() => getUnlocksForLevel(level, webCity), [level]);
  const storyExploreItems  = useMemo(
    () => storyExploreLevel != null ? getUnlocksForLevel(storyExploreLevel, webCity) : [],
    [storyExploreLevel]
  );

  // Derived canvas level
  const canvasLevel = appMode === 'story' ? storyLevel : level;

  // --- Story handlers ---

  function handleSectionEnter(lvl: number) {
    // Only reset explore mode when navigating to a DIFFERENT section
    // (IntersectionObserver can re-fire on the same section when scrollSnapType changes)
    setStoryExploreLevel(prev => (prev != null && prev === lvl ? prev : null));
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

  function handleExplore(lvl: number) {
    setStoryExploreLevel(lvl);
    setStoryBuildingOverlay(null);
    setCityBrightness(1.0);
    setActiveItemId(null);
    setFocusedItemDistrictId(null);
    setFocusedItemBuildingId(null);
  }

  const handleCarouselItemClick = useCallback((item: UnlockItem) => {
    setActiveItemId(item.id);
    setFocusedItemDistrictId(item.districtId);
    setFocusedItemBuildingId(item.buildingId ?? null);
    // Only open the detail overlay in sandbox mode (via the buildingId path below)
    // In story explore mode, clicking just pans the camera to the building
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
        onBuildingClick={appMode === 'story' ? () => {} : handleBuildingClick}
        selectedBuilding={selectedBuilding}
        mode={mode}
        focusedDistrictId={focusedDistrict}
        onDistrictClick={handleDistrictClick}
        onBackToCity={handleBackToCity}
        focusedItemDistrictId={focusedItemDistrictId}
        focusedItemBuildingId={focusedItemBuildingId}
      />

      {/* Story overlay — only in story mode */}
      {appMode === 'story' && (
        <StoryScroll
          ref={storyScrollRef}
          onLevelChange={handleSectionEnter}
          onPhaseChange={handlePhaseChange}
          onSandboxEnter={handleSandboxEnter}
          onExplore={handleExplore}
          frozen={storyExploreLevel !== null}
        />
      )}

      {/* Building detail overlay — triggered from carousel in both story explore and sandbox */}
      {storyBuildingOverlay && (
        <BuildingOverlay
          districtId={storyBuildingOverlay.districtId}
          buildingId={storyBuildingOverlay.buildingId}
          level={appMode === 'story' ? (storyExploreLevel ?? 0) : level}
          onLevelChange={appMode === 'sandbox' ? setLevel : () => {}}
          onBack={() => setStoryBuildingOverlay(null)}
        />
      )}

      {/* Story explore mode — carousel + Next button */}
      <AnimatePresence>
        {appMode === 'story' && storyExploreLevel !== null && (
          <UnlockCarousel
              level={storyExploreLevel}
              items={storyExploreItems}
              accentColor={accentColorForLevel(storyExploreLevel)}
              activeItemId={activeItemId}
              onItemClick={handleCarouselItemClick}
              nextLabel={storyExploreLevel < 5
                ? `Next: ${LEVEL_LABELS[storyExploreLevel + 1]?.title} →`
                : 'Enter Sandbox →'}
              onNext={() => {
                const nextIndex = storyExploreLevel != null ? storyExploreLevel + 2 : 1;
                setStoryExploreLevel(null);
                setCityBrightness(0.35);
                setActiveItemId(null);
                setFocusedItemDistrictId(null);
                setFocusedItemBuildingId(null);
                storyScrollRef.current?.scrollToSection(nextIndex);
              }}
            />
        )}
      </AnimatePresence>

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

      {/* Sandbox carousel — sits above the LevelSlider */}
      <AnimatePresence>
        {appMode === 'sandbox' && mode !== 'building' && (
          <UnlockCarousel
            level={level}
            items={sandboxUnlockItems}
            accentColor={accentColorForLevel(level)}
            activeItemId={activeItemId}
            onItemClick={handleCarouselItemClick}
            bottomOffset={76}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
