// app/components/LevelSlider.tsx
'use client';

import { LEVEL_LABELS } from '../data/city';

interface Props {
  level: number;
  onChange: (level: number) => void;
}

export default function LevelSlider({ level, onChange }: Props) {
  const { title, tagline } = LEVEL_LABELS[level];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-6 pt-4"
         style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.95), transparent)' }}>
      {/* Current level label */}
      <div className="mb-4 text-center">
        <div className="text-amber-300 font-mono text-xs tracking-widest uppercase mb-1">
          L{level} · {title}
        </div>
        <div className="text-slate-400 font-mono text-xs">{tagline}</div>
      </div>

      {/* Slider stops */}
      <div className="flex items-center gap-0 w-full max-w-2xl px-8">
        {[0, 1, 2, 3, 4, 5].map(l => (
          <button
            key={l}
            onClick={() => onChange(l)}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            {/* Track segment */}
            <div className="w-full flex items-center">
              {l > 0 && (
                <div className={`flex-1 h-0.5 transition-colors duration-300 ${
                  l <= level ? 'bg-amber-400' : 'bg-slate-700'
                }`} />
              )}
              {/* Node */}
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                l === level
                  ? 'border-amber-400 bg-amber-400 scale-150 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                  : l < level
                  ? 'border-amber-600 bg-amber-600'
                  : 'border-slate-600 bg-slate-900'
              }`} />
              {l < 5 && (
                <div className={`flex-1 h-0.5 transition-colors duration-300 ${
                  l < level ? 'bg-amber-400' : 'bg-slate-700'
                }`} />
              )}
            </div>
            {/* Level label */}
            <span className={`font-mono text-[10px] transition-colors duration-200 ${
              l === level ? 'text-amber-300' : 'text-slate-600 group-hover:text-slate-400'
            }`}>
              L{l}
            </span>
          </button>
        ))}
      </div>

      {/* Endpoint labels */}
      <div className="flex justify-between w-full max-w-2xl px-8 mt-1">
        <span className="font-mono text-[10px] text-slate-500">Vibe Coder</span>
        <span className="font-mono text-[10px] text-slate-500">Expert Leader</span>
      </div>
    </div>
  );
}
