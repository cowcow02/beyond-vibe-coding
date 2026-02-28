// app/components/BuildingPanel.tsx
'use client';

import { useState } from 'react';
import { districts } from '../data/city';

interface Props {
  districtId: string;
  buildingId: string;
  currentLevel: number;
  onClose: () => void;
}

export default function BuildingPanel({ districtId, buildingId, currentLevel, onClose }: Props) {
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null);

  const district = districts.find(d => d.id === districtId);
  const building = district?.buildings.find(b => b.id === buildingId);

  if (!district || !building) return null;

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col"
      style={{ background: 'rgba(2,6,23,0.95)', borderLeft: '1px solid rgba(51,65,85,0.8)' }}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="font-mono text-xs text-slate-500 mb-1 uppercase tracking-widest">
          {district.name}
        </div>
        <div className="flex items-start justify-between">
          <h2 className="text-white font-mono text-lg font-bold">{building.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white font-mono text-sm ml-4 mt-0.5"
          >
            ✕
          </button>
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400">
          {Math.min(currentLevel + 1, 6)} of 6 floors visible at L{currentLevel}
        </div>
      </div>

      {/* Floor list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {building.floors.map(floor => {
          const isUnlocked = floor.level <= currentLevel;
          const isCurrent  = floor.level === currentLevel;
          const isExpanded = expandedFloor === floor.level;

          return (
            <div
              key={floor.level}
              onClick={() => isUnlocked && setExpandedFloor(isExpanded ? null : floor.level)}
              className={`rounded border transition-all duration-200 ${
                isUnlocked ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'
              } ${
                isCurrent
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : isUnlocked
                  ? 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                  : 'border-slate-800 bg-slate-900/30'
              }`}
            >
              <div className="px-3 py-2 flex items-center gap-3">
                <span className={`font-mono text-xs font-bold w-6 ${
                  isCurrent ? 'text-amber-400' : isUnlocked ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  L{floor.level}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`font-mono text-xs font-semibold truncate ${
                    isUnlocked ? 'text-slate-200' : 'text-slate-600'
                  }`}>
                    {floor.title}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 truncate">
                    {floor.description}
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-amber-400 text-xs">●</span>
                )}
                {!isUnlocked && (
                  <span className="text-slate-700 text-xs">🔒</span>
                )}
              </div>

              {/* Expanded skills */}
              {isExpanded && isUnlocked && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-800">
                  <ul className="space-y-1">
                    {floor.skills.map(skill => (
                      <li key={skill} className="font-mono text-[10px] text-slate-400 flex items-start gap-1.5">
                        <span className="text-amber-600 mt-0.5">·</span>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="p-4 border-t border-slate-800">
        <p className="font-mono text-[10px] text-slate-600 text-center">
          Move the level slider to unlock more floors
        </p>
      </div>
    </div>
  );
}
