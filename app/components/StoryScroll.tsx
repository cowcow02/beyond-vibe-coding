'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import LevelScene from './LevelScene';
import { HeroSection } from './HeroSection';
import { StorySection } from './StorySection';
import { SandboxSection } from './SandboxSection';
import { accentColorForLevel } from '../lib/levelColors';

type Phase = 'idle' | 'title' | 'reveal' | 'settle' | 'narrative' | 'explore';

interface Props {
  onLevelChange: (level: number) => void;
  onPhaseChange: (level: number, phase: Phase) => void;
  onSandboxEnter: () => void;
  onExplore: (level: number) => void;
  frozen: boolean;
}

export interface StoryScrollHandle {
  scrollToSection: (sectionIndex: number) => void;
}

export const StoryScroll = forwardRef<StoryScrollHandle, Props>(
function StoryScroll({ onLevelChange, onPhaseChange, onSandboxEnter, onExplore, frozen }, ref) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToSection(index: number) {
      const el = containerRef.current;
      if (!el) return;
      const section = el.querySelector(`[data-section-index="${index}"]`) as HTMLElement;
      section?.scrollIntoView({ behavior: 'smooth' });
    },
  }));

  function handleLevelEnter(level: number) {
    setActiveLevel(level);
    onLevelChange(level);
  }

  function handleSandboxEnter() {
    setActiveLevel(null);
    onSandboxEnter();
  }

  return (
    <div
      ref={containerRef}
      data-story-scroll
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        overflowY: frozen ? 'hidden' : 'scroll',
        scrollSnapType: frozen ? 'none' : 'y mandatory',
        pointerEvents: frozen ? 'none' : 'auto',
      }}
    >
      {/* Hero section (index 0) */}
      <StorySection sectionIndex={0} onEnter={() => handleLevelEnter(-1)}>
        <HeroSection />
      </StorySection>

      {/* Level sections (indices 1–6) */}
      {([0, 1, 2, 3, 4, 5] as const).map((i) => (
        <StorySection
          key={i}
          sectionIndex={i + 1}
          onEnter={() => handleLevelEnter(i)}
        >
          <LevelScene
            levelIndex={i}
            active={activeLevel === i}
            onPhaseChange={(phase: Phase) => onPhaseChange(i, phase)}
            onExplore={() => onExplore(i)}
            accentColor={accentColorForLevel(i)}
          />
        </StorySection>
      ))}

      {/* Sandbox section */}
      <SandboxSection onEnter={handleSandboxEnter} />
    </div>
  );
});
