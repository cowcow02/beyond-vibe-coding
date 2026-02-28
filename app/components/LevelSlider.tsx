// app/components/LevelSlider.tsx
'use client';

import { LEVEL_LABELS } from '../data/city';

interface Props {
  level: number;
  onChange: (level: number) => void;
  /** When provided the slider renders in compact (embedded) mode — no HUD chrome. */
  className?: string;
}

function SliderTrack({ level, onChange }: { level: number; onChange: (l: number) => void }) {
  return (
    <>
      <div className="flex items-center w-full">
        {[0, 1, 2, 3, 4, 5].map(l => (
          <button
            key={l}
            onClick={() => onChange(l)}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div className="w-full flex items-center">
              {l > 0 && (
                <div className={`flex-1 h-px transition-colors duration-300 ${
                  l <= level ? 'bg-amber-500' : 'bg-slate-700'
                }`} />
              )}
              <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                l === level
                  ? 'border-amber-400 bg-amber-400 scale-150 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                  : l < level
                  ? 'border-amber-700 bg-amber-700'
                  : 'border-slate-600 bg-slate-900 group-hover:border-slate-500'
              }`} />
              {l < 5 && (
                <div className={`flex-1 h-px transition-colors duration-300 ${
                  l < level ? 'bg-amber-500' : 'bg-slate-700'
                }`} />
              )}
            </div>
            <span className={`font-mono text-[9px] transition-colors duration-200 ${
              l === level ? 'text-amber-400' : 'text-slate-700 group-hover:text-slate-500'
            }`}>
              L{l}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between w-full mt-0.5 px-0.5">
        <span className="font-mono text-[9px] text-slate-600">Vibe Coder</span>
        <span className="font-mono text-[9px] text-slate-600">Expert Leader</span>
      </div>
    </>
  );
}

export default function LevelSlider({ level, onChange, className }: Props) {
  const { title, tagline } = LEVEL_LABELS[level];

  // ── Compact / embedded mode (BuildingOverlay) ────────────────────────────
  if (className !== undefined) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center w-full max-w-xs px-6">
          <SliderTrack level={level} onChange={onChange} />
        </div>
      </div>
    );
  }

  // ── Full bottom HUD (city + district modes) ──────────────────────────────
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(2,6,23,0.96)',
        borderTop: '1px solid rgba(51,65,85,0.35)',
      }}
    >
      <div className="flex items-center gap-8 px-8 py-4 max-w-6xl mx-auto">

        {/* Brand */}
        <div className="shrink-0 w-40">
          <div className="font-mono text-[11px] font-bold tracking-[0.18em] text-amber-300 uppercase">
            Beyond Vibe Coding
          </div>
          <div className="font-mono text-[9px] text-slate-600 mt-0.5 tracking-widest uppercase">
            Engineering depth map
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-slate-800 shrink-0" />

        {/* Slider */}
        <div className="flex-1 flex flex-col items-center">
          <SliderTrack level={level} onChange={onChange} />
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-slate-800 shrink-0" />

        {/* Level info */}
        <div className="shrink-0 w-44 text-right">
          <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-amber-300 uppercase">
            L{level} · {title}
          </div>
          <div className="font-mono text-[9px] text-slate-500 mt-0.5">{tagline}</div>
        </div>

      </div>
    </div>
  );
}
