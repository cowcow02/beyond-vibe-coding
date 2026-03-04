// app/lib/levelColors.ts
export const LEVEL_ACCENT_COLORS: Record<number, string> = {
  0: '#60a5fa',
  1: '#34d399',
  2: '#fb923c',
  3: '#f87171',
  4: '#fbbf24',
  5: '#e879f9',
};

export function accentColorForLevel(level: number): string {
  return LEVEL_ACCENT_COLORS[level] ?? '#60a5fa';
}
