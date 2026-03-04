# Cinematic Unlock Carousel — Design

**Date:** 2026-03-02
**Branch:** storytelling-enhancement

---

## What We're Building

A full-width horizontal unlock carousel that appears whenever a user enters "explore mode" for a level — either during the story scroll or in sandbox. The carousel shows everything new at that level (new districts, buildings, and floors) as scannable cards with 3D thumbnail previews. The city remains fully interactive above it.

---

## User Journey

### Story Mode (existing)
```
Hero → L0 cinematic → L1 cinematic → … → L5 cinematic → Sandbox
```
Each cinematic: title phase → reveal → narrative → **[Explore button appears]**

### New: Explore Mode (story-locked sandbox)
When the user clicks **Explore** from any level's narrative phase:

1. The story scroll freezes (scroll-snap disabled on that section)
2. City brightens to full (brightness 1.0), fully interactive
3. Unlock carousel slides up from the bottom
4. Card thumbnails develop one by one (polaroid effect)
5. User browses, clicks cards → city camera pans to that item
6. User can click districts/buildings directly in the city too
7. Bottom-right: **"Next: The Apprentice →"** button
8. Pressing it re-enables scroll and snaps to the next level section

### Sandbox Mode (enhanced)
Existing sandbox gains the same carousel at the bottom. It updates whenever the level slider changes. Level slider stays visible above the carousel. Carousel re-expands with new thumbnails each time the level changes.

---

## Mode Summary

| | Story Explore | Sandbox |
|---|---|---|
| Level slider | Hidden | Visible |
| Carousel | Visible, level-locked | Visible, updates with slider |
| "Next level" button | Bottom-right | Hidden |
| City interactive | Yes | Yes |
| Scroll to next section | After clicking Next | N/A |

---

## The Unlock Carousel

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│                [City — full screen, interactive]               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  L1 · THE APPRENTICE · 14 things unlocked      [↓ hide] │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│ ←  [card] [card] [card] [card] [card] [card] [card] [card]  → │
└────────────────────────────────────────────────────────────────┘
```

- **Full viewport width**, fixed to the bottom of the screen
- **~220px tall** when expanded (header row + card row)
- **36px tall** when minimized (just the header strip)
- **Semi-transparent background**: `rgba(2, 6, 23, 0.82)` with a top border in the level's accent color
- Horizontal scroll with hidden scrollbar; arrow buttons at edges for discoverability

### Header Row

```
L1 · THE APPRENTICE · 14 things unlocked                [↓ hide]
```

- Level badge, level title, item count on the left
- Minimize toggle (↓) on the right — collapses to the 36px strip
- Minimized strip shows: `14 unlocks at L1  [↑ show]`
- Re-expands on the next level transition automatically

### Cards

Each card is **160px wide × 160px tall**, spaced 12px apart, horizontally scrollable.

```
┌──────────────────┐
│                  │  ← 100px: 3D thumbnail (screenshot)
│   [3D render]    │
│                  │
├──────────────────┤
│ DISTRICT         │  ← type badge in accent color, 10px monospace
│ The Craft        │  ← name, 13px, white
│ Real tools,      │  ← tagline, 11px, slate-400, 2-line clamp
│ picked up out…   │
└──────────────────┘
```

**Type badges:**
- `DISTRICT` — level accent color
- `BUILDING` — white/50%
- `FLOOR ↑` — slate-400 (indicates a floor added to an existing building)

**Active state** (hovered or camera-focused): card gets a 1px accent-color border + subtle scale(1.03).

**Card ordering within the carousel:**
1. New districts (most significant — lead the carousel)
2. New buildings (ordered by district)
3. New floors (ordered by building, labeled with building name)

---

## 3D Thumbnail Capture

### Approach: Per-card screenshot, captured on level entry

When explore mode activates for a level:

1. A `ThumbnailCapture` component mounts alongside the main canvas
2. It iterates through each unlock item sequentially
3. For each item it temporarily repositions an orthographic camera to frame that district/building from the standard isometric angle
4. Calls `renderer.domElement.toDataURL('image/webp', 0.85)` at 160×100px
5. Stores each as a data URL in a `Map<itemId, string>` held in React state
6. Cards render a grey shimmer placeholder until their thumbnail arrives, then crossfade in

**Sequencing:** ~80ms between captures (one per frame). 14 items = ~1.1 seconds total. Cards "develop" left to right as captures complete — this is the intentional "polaroid" reveal effect.

**Camera framing per item type:**
- **District**: frame the full district bounds (use district `originCol/Row + cols/rows`)
- **Building**: frame the building at 1.5× zoom from standard isometric angle
- **Floor**: same as building (the floor is not separately positionable — the building is the visual)

### Reuse between story and sandbox

Thumbnails are cached by `levelIndex` in a module-level `Map`. The capture only runs once per level per session. Navigating back and forth in the story reuses cached thumbnails instantly.

---

## Unlock Data Layer

A new pure function in `app/lib/unlocks.ts`:

```typescript
export interface UnlockItem {
  id: string;           // unique: `district:${id}`, `building:${id}`, `floor:${buildingId}:${level}`
  type: 'district' | 'building' | 'floor';
  name: string;
  subtitle: string;     // district tagline | building rationale (know field L0) | "Floor added to [Building]"
  districtId: string;   // for camera framing
  buildingId?: string;  // for camera framing + floor items
  floorLevel?: number;  // for floor items
}

export function getUnlocksForLevel(level: number, city: City): UnlockItem[]
```

**Derivation logic:**
- **Districts**: `city.districts.filter(d => d.appearsAtLevel === level)`
- **Buildings**: all buildings across all districts where `building.appearsAtLevel === level`
- **Floors**: all buildings where `building.appearsAtLevel < level` and `building.floorStartLevel === level` (floor added to a pre-existing building)

---

## Component Map

### New components

| Component | File | Purpose |
|---|---|---|
| `UnlockCarousel` | `app/components/UnlockCarousel.tsx` | Full carousel — header, card list, minimize logic |
| `UnlockCard` | `app/components/UnlockCard.tsx` | Individual card with thumbnail + metadata |
| `ThumbnailCapture` | `app/components/ThumbnailCapture.tsx` | Captures 3D screenshots, populates thumbnail cache |
| `getUnlocksForLevel` | `app/lib/unlocks.ts` | Pure data function — derives unlock list for a level |

### Modified components

| Component | Change |
|---|---|
| `LevelScene.tsx` | Add new `explore` phase; emit `onPhaseChange('explore')`; show "Explore" hint button during `narrative` phase |
| `StoryScroll.tsx` | Handle `explore` phase from `LevelScene`; pass camera focus callbacks to carousel |
| `page.tsx` | Add `storyExplore` app mode; wire "Next level" button; hide slider in explore mode; show carousel in both explore and sandbox modes |
| `CityWorld.tsx` | Expose `focusOnItem(districtId, buildingId?)` imperative handle via `useImperativeHandle` so carousel can trigger camera movement |

---

## Interaction Flow

### Clicking a card (story explore or sandbox)

1. Card becomes active (highlighted border)
2. `focusOnItem(districtId, buildingId?)` called on `CityWorld`
3. Camera smoothly pans/zooms to frame that district or building
4. If user then clicks the building in the 3D city → existing `BuildingOverlay` opens as normal

### "Next: The Apprentice →" button (story explore only)

- Fixed, bottom-right, above the carousel
- Styled: monospace, small, accent color, subtle arrow
- On click: collapses carousel, re-enables scroll-snap, programmatically scrolls to next section

### Explore button (story narrative phase)

- Appears after the narrative text, below "scroll to continue ↓"
- Styled: ghost button, `[ Explore this level ]`
- On click: triggers explore phase in `LevelScene`, which calls `onPhaseChange('explore')` → `page.tsx` activates carousel

---

## Visual Design Notes

- Carousel background uses the same `rgba(2,6,23,...)` dark as the rest of the UI overlays
- Top border of carousel: 1px solid in the level's accent color (ties it to the level identity)
- Card thumbnails: slight vignette overlay to blend with the dark card background
- "Developing" placeholder: animated shimmer in `rgba(255,255,255,0.05)`
- Accent colors per level already defined in `StoryScroll.tsx` — pass through to carousel

---

## What's Explicitly Out of Scope

- Audio / sound effects on card reveal
- Animated camera tours (user drives the camera, not auto-tour)
- Persistent unlock history across sessions
- Mobile-specific layout (carousel scrolls touch-natively; no further mobile work)
