'use client';

import { useState } from 'react';
import LevelScene from './LevelScene';
import { HeroSection } from './HeroSection';
import { StorySection } from './StorySection';
import { SandboxSection } from './SandboxSection';
import { accentColorForLevel } from '../lib/levelColors';

type Phase = 'idle' | 'title' | 'reveal' | 'settle' | 'narrative';

interface Props {
  onLevelChange: (level: number) => void;
  onPhaseChange: (level: number, phase: Phase) => void;
  onSandboxEnter: () => void;
}

export function StoryScroll({ onLevelChange, onPhaseChange, onSandboxEnter }: Props) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
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
            accentColor={accentColorForLevel(i)}
          />
        </StorySection>
      ))}

      {/* Sandbox section */}
      <SandboxSection onEnter={handleSandboxEnter} />
    </div>
  );
}
