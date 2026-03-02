# Cinematic Scroll Story — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the homepage with a scroll-driven cinematic story (L0→L5) that transitions into the interactive sandbox city.

**Architecture:** The R3F canvas is always full-screen and fixed. Transparent HTML sections scroll over it. Each level section auto-plays a 4-phase animation sequence when scrolled into view. After L5 the sandbox UI fades in and the user is home.

**Tech Stack:** Next.js, React, R3F (existing), Framer Motion (new dep), Tailwind CSS

---

## Experience Flow

```
Hero (empty city, title)
  ↓ scroll
L0 → title typewriter → city reveal → narrative
  ↓ scroll
L1 → title typewriter → city reveal → narrative
  ...
L5 → title typewriter → city reveal → narrative
  ↓ scroll
Sandbox (full UI fades in, interactive mode)
```

Total snap points: 8. Eight scrolls from cold open to full explorer.

---

## Per-Level Animation Phases

Each level section auto-plays through 4 phases once it snaps into view:

| Phase | Duration | What happens |
|---|---|---|
| `title` | ~1.5–2.5s (type speed) + 1.75s hold | Level badge appears. Tagline types out at ~38ms/char. Holds 1.75s. Overlay fades out. |
| `reveal` | 2.0s | City brightens to full. `level` increments — new districts/buildings spring in. Camera drifts to frame new additions. No text. |
| `settle` | 0.7s | City dims to 35% brightness — becomes background texture. |
| `narrative` | ∞ (user-controlled) | Level prose fades in. Subtle "scroll to continue ↓" prompt appears. User scrolls when ready. |

---

## Layout & Z-Stack

```
z-0  R3F Canvas        position: fixed, inset: 0
z-10 Scroll container  position: fixed, inset: 0, overflow-y: scroll, scroll-snap-type: y mandatory
z-20 Story overlays    8 × section (height: 100vh, scroll-snap-align: start)
```

The canvas never scrolls, never remounts. HTML overlays are transparent — the city always shows through.

---

## New Content: Level Narratives

Add a `narrative` field to `LEVEL_LABELS` in `app/data/city.ts`. This is the prose shown during each level's narrative phase — a whole-level "what it feels like" paragraph, distinct from building-level floor prose.

```ts
export const LEVEL_LABELS: Record<number, {
  title: string;
  tagline: string;
  narrative: string;
}> = {
  0: {
    title: 'Vibe Coder',
    tagline: 'Building with AI, unsure why it works',
    narrative: `You have a working app. You don't know exactly how. The AI wrote it, you wired it together, and when users show up it mostly holds. You're faster than anyone expects. What you can't see yet is the city around you — the systems, the craft, the depth — that you're building on top of without knowing.`,
  },
  1: {
    title: 'Aware Novice',
    tagline: 'Starting to understand the foundations',
    narrative: `Something breaks and this time you don't just paste the error back into the chat. You read it. You start to see the shape of things — why the database query is slow, what Git is actually doing when you push. The map is beginning to form. You didn't know it was this big.`,
  },
  2: {
    title: 'AI-Assisted Builder',
    tagline: 'Steering AI with growing confidence',
    narrative: `You know enough to steer. The AI is a tool now, not a crutch — you review what it writes, you catch its mistakes, you know why something shouldn't be done that way. You've shipped things to production and kept them running. The city keeps growing.`,
  },
  3: {
    title: 'Independent Engineer',
    tagline: 'Works without AI, critiques it sharply',
    narrative: `You work without the scaffold. You debug without a net. You've read enough code, broken enough things, and fixed them without help that you trust your own judgment. You've started to see the patterns that hold systems together — and the gaps where they fall apart.`,
  },
  4: {
    title: 'Senior / Staff',
    tagline: 'Shapes systems, mentors others',
    narrative: `You shape the work of others. The decisions you make ripple through the team — the architecture you choose, the standards you set, the engineers you grow. The city is large now. You know most of it. You've learned to say "I don't know" with confidence.`,
  },
  5: {
    title: 'Expert / Leader',
    tagline: 'Defines the field, writes the standards',
    narrative: `The humbling is complete. Not because you've seen everything — but because you now know how much there is to keep learning. You've contributed to the field, shaped teams, made calls that mattered. The city is yours. And you know it keeps growing.`,
  },
};
```

---

## New Components

### `StoryScroll.tsx`

The outermost scroll container. `position: fixed, inset: 0, overflow-y: scroll, scroll-snap-type: y mandatory`. Renders 8 child sections. Uses `IntersectionObserver` on each section to fire `onEnter(sectionIndex)`.

Props:
```ts
interface Props {
  onSectionEnter: (index: number) => void; // 0=hero, 1–6=L0–L5, 7=sandbox
}
```

### `StorySection.tsx`

A single `height: 100vh, scroll-snap-align: start` section. Transparent background. Fires `onEnter` via IntersectionObserver when ≥60% visible.

### `LevelScene.tsx`

Orchestrates the 4-phase animation for one level. Receives `levelIndex: number`, `accentColor: string`, fires `onPhaseChange(phase)` back to parent so the canvas knows when to reveal/dim.

Internal state machine:
```ts
type Phase = 'idle' | 'title' | 'reveal' | 'settle' | 'narrative';
```

Transitions:
- `idle → title`: triggered by `onEnter`
- `title → reveal`: after typewriter completes + 1.75s hold
- `reveal → settle`: after 2.0s
- `settle → narrative`: after 0.7s
- stays at `narrative` until user scrolls

### `TypewriterText.tsx`

```ts
interface Props {
  text: string;
  charDelay?: number; // ms per character, default 38
  onComplete?: () => void;
}
```

Uses `useEffect` with `setInterval` to increment a character count. Renders `text.slice(0, count)` with a blinking cursor `|` appended while typing.

### `HeroSection.tsx`

Full-screen dark overlay. City renders behind it at ~20% brightness (level = -1, i.e., empty — just roads). Shows:
- `BEYOND VIBE CODING` large
- `"How far does it go?"` subtitle
- Animated scroll prompt at bottom

### `SandboxSection.tsx`

The final section. When scrolled into view, fires a callback that triggers:
1. Story overlay fades out completely
2. City brightens to 100%
3. Existing sandbox UI (slider, district labels, back buttons) fades in

---

## City Canvas Changes

### `CityScene.tsx`

Add props:
```ts
interface StoryProps {
  storyMode: boolean;       // true = story, false = sandbox
  cityBrightness: number;   // 0.0–1.0, drives CSS filter
}
```

Wrap the `<Canvas>` in a div with:
```tsx
<div style={{ filter: `brightness(${cityBrightness})`, transition: 'filter 0.7s ease' }}>
  <Canvas ...>
```

### `CityWorld.tsx`

For the hero section, city needs to render at `level = -1` — just roads, no buildings. Add guard:
```ts
const effectiveLevel = level < 0 ? -1 : level;
// districts.filter(d => d.appearsAtLevel <= effectiveLevel)
```

---

## Page Composition (`app/page.tsx`)

```tsx
type AppMode = 'story' | 'sandbox';

// Story state
const [appMode,         setAppMode]         = useState<AppMode>('story');
const [storyLevel,      setStoryLevel]       = useState(-1);  // -1 = hero (empty city)
const [cityBrightness,  setCityBrightness]   = useState(0.2);

// Sandbox state (existing)
const [level, setLevel] = useState(5); // unlocked at L5 when sandbox opens
// ... existing district/building state

function handleSectionEnter(index: number) {
  if (index === 0) { setStoryLevel(-1); setCityBrightness(0.2); }       // hero
  else if (index <= 6) { /* level scenes handle their own brightness */ }
  else { setAppMode('sandbox'); }                                        // sandbox
}
```

The canvas is always mounted. Only the overlay changes.

---

## Dependency

Add Framer Motion for the fade/slide transitions on text overlays:
```bash
npm install framer-motion
```

The typewriter, phase timing, and city brightness are plain React + CSS — no Framer needed there. Framer is used only for the `motion.div` fade-in/out of text layers.

---

## Files to Create

- `app/components/StoryScroll.tsx`
- `app/components/StorySection.tsx`
- `app/components/LevelScene.tsx`
- `app/components/TypewriterText.tsx`
- `app/components/HeroSection.tsx`
- `app/components/SandboxSection.tsx`

## Files to Modify

- `app/page.tsx` — compose new story + sandbox modes
- `app/data/city.ts` — add `narrative` to `LEVEL_LABELS`
- `app/components/CityScene.tsx` — accept `cityBrightness` prop
- `app/components/CityWorld.tsx` — handle `level = -1` (empty city)

---

## Verification

1. Load page → hero section shows, city renders roads-only at low brightness
2. Scroll to L0 → typewriter types tagline, pauses, fades → city brightens + Frontend/Backend buildings spring in → city dims → narrative prose fades in
3. Scroll through L1–L5 → each level shows correct new districts and narrative
4. Scroll past L5 → story overlay gone, full city, interactive UI visible, slider works
5. Interacting with slider in sandbox doesn't re-trigger story
6. Mobile: snap scroll works, city visible throughout
