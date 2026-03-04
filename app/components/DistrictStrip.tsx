// app/components/DistrictStrip.tsx
'use client';

import { districts } from '../data/city';
import { DISTRICT_COLORS } from './CityWorld';

interface Props {
  districtId: string;
  level: number;
  onBack: () => void;
}

export function DistrictStrip({ districtId, level, onBack }: Props) {
  const district = districts.find(d => d.id === districtId);
  if (!district) return null;

  const accent = (DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS['frontend']).accent;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: 'linear-gradient(to bottom, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.85) 70%, transparent 100%)',
      }}
    >
      <div
        className="flex items-center gap-4 px-6 py-3 border-b"
        style={{ borderColor: 'rgba(51,65,85,0.5)' }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="font-mono text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          ← Back to city
        </button>

        <div className="w-px h-4 bg-slate-700 shrink-0" />

        {/* District identity */}
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: accent, fontSize: '10px' }}>●</span>
          <span
            className="font-mono text-xs font-bold tracking-widest uppercase"
            style={{ color: accent }}
          >
            {district.name}
          </span>
        </div>

        {/* Tagline */}
        <span className="font-mono text-xs text-slate-400 italic truncate hidden sm:block">
          &ldquo;{district.tagline}&rdquo;
        </span>

        {/* Count */}
        <span className="hidden sm:inline font-mono text-[10px] text-slate-500 shrink-0 ml-auto">
          {district.buildings.length} buildings · unlocked at L{district.appearsAtLevel}
        </span>
        <span className="sm:hidden font-mono text-[10px] text-slate-500 shrink-0 ml-auto">
          {district.buildings.length} bldgs
        </span>
      </div>
    </div>
  );
}
