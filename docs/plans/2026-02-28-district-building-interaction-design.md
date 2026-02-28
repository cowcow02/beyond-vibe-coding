# District & Building Interaction Design

**Goal:** Replace the flat district ground + simple slide-in panel with a rich three-mode navigation experience: full city → district zoom + info strip → building overlay with live 3D mini-canvas.

**Date:** 2026-02-28

---

## Navigation Modes

Three modes form a linear drill-down hierarchy:

```
city  →  district  →  building
         ↑ back          ↑ back
```

### State (page.tsx)

```ts
mode: 'city' | 'district' | 'building'
focusedDistrict: string | null       // set in district + building modes
selectedBuilding: { districtId: string; buildingId: string } | null
```

### Transitions

| Action | From | To |
|---|---|---|
| Click district label | city | district |
| Click building mesh | district | building |
| "← Back" in overlay | building | district |
| "← Back" in strip | district | city |
| Click empty space (optional) | district | city |

Camera never rotates. A `DistrictZoom` component (modelled after `AutoZoom`) smoothly pans + zooms to frame the focused district block when entering `district` mode, and zooms back out to fit all active blocks when returning to `city` mode.

---

## District Labels

Rendered inside `DistrictGround.tsx` as `<Html>` overlays (same pattern as `BuildingLabel.tsx`), centered on the district block.

**Anatomy:**
```
  ● FRONTEND
  5 buildings
```

- District name in accent color, bold monospace caps
- Colored dot matching accent color
- Subtitle: `N buildings` in muted slate
- Pointer cursor, hover: subtle CSS translateY(-2px)
- Gated by `district.appearsAtLevel <= level`

**Mode-aware styling:**
- `city` mode: full opacity, normal scale
- `district` mode: focused district scales up 1.1×; other district labels dim to 40% opacity
- `building` mode: all district labels hidden (overlay owns the screen)

**Props added to DistrictGround:** `onDistrictClick: (districtId: string) => void`

---

## District Info Strip

Visible only when `mode === 'district'`. Fixed position below the title header, slides down from behind it on entry.

**Layout (left → right, single row):**
```
← Back to city    ● FRONTEND DISTRICT    "Where browsers meet ambition"    5 buildings · unlocked at L0
```

- `← Back to city` button: resets `mode → 'city'`, `focusedDistrict → null`
- Accent dot + district name in caps
- Italic tagline (new `tagline` field on `District` type in `city.ts`)
- Muted count: `N buildings · unlocked at L{district.appearsAtLevel}`
- Font: monospace throughout
- Animation: `translate-y-0` → slides in from `translate-y-[-100%]`

**New field needed in city.ts:**
```ts
interface District {
  // ... existing fields
  tagline: string;  // e.g. "Where browsers meet ambition"
}
```

---

## Building Overlay

Visible only when `mode === 'building'`. Full-screen lightbox over the frosted city.

**Backdrop:** `backdrop-blur-md bg-slate-950/80`

**50/50 split layout:**

```
┌─────────────────────┬─────────────────────┐
│  ← Back             │                     │
│                     │                     │
│  ● FRONTEND         │  [3D Building       │
│  JavaScript         │   Mini Canvas]      │
│                     │                     │
│  ┌───────────────┐  │  - same isometric   │
│  │ L0 Vibe Coder │  │    angle (45°/35°)  │
│  │  full desc    │  │  - slow auto-rotate │
│  │  ▸ skills...  │  │  - OrbitControls    │
│  └───────────────┘  │  - selected floor   │
│  ┌───────────────┐  │    glows amber      │
│  │ L1  ···       │  │                     │
│  └───────────────┘  │                     │
└─────────────────────┴─────────────────────┘
        [  level slider  ]
```

### Left Column

- `← Back` button: `mode → 'district'`, `selectedBuilding → null`
- District accent dot + name header, building name below
- Floor cards: full description always visible (no truncation), skills list expands on click
- Clicking a floor card sets `selectedFloor: number` state — syncs with 3D view
- Current level's floor: amber highlight ring
- Locked floors: visible but dimmed, locked icon, non-interactive
- Active floor card auto-scrolls into view when level changes

### Right Column

- Separate `<Canvas orthographic>` with same 45°/35° isometric camera
- Renders a single `<CityBuilding>` wired to current `level` prop
- `selectedFloor` prop: that floor's mesh brightens (emissive amber glow)
- Slow auto-rotation via `useFrame` (0.2 rad/s on Y axis), pauses on pointer enter
- `OrbitControls` enabled for free spin/zoom
- Consistent lighting: same ambient + directional setup as main scene

### Level Slider Interaction

The slider stays mounted at the bottom (`z-index` above overlay).

- Moving slider updates global `level`
- Mini canvas building responds immediately (floors stack/appear)
- Floor list updates: newly unlocked cards animate in, locked cards transition to unlocked state
- Active floor card (matching `level`) auto-scrolls into view with amber ring
- Feels like scrubbing through the building's growth layer by layer

---

## Component Changes Summary

| File | Change |
|---|---|
| `app/page.tsx` | Add `mode`, `focusedDistrict` state; wire new callbacks |
| `app/data/city.ts` | Add `tagline: string` to `District` type + data |
| `app/components/DistrictGround.tsx` | Add `<Html>` district label + `onDistrictClick` prop |
| `app/components/CityWorld.tsx` | Add `DistrictZoom` component; pass `focusedDistrict` + mode-aware label dimming |
| `app/components/BuildingPanel.tsx` | Replace with new `BuildingOverlay.tsx` (50/50, mini canvas) |
| `app/components/CityScene.tsx` | Pass `mode` + `focusedDistrict` down |
| `app/components/CityBuilding.tsx` | Add `selectedFloor` prop for amber glow on focused floor |
| NEW: `app/components/DistrictStrip.tsx` | District info strip UI |
| NEW: `app/components/BuildingOverlay.tsx` | Full overlay with split layout + mini canvas |
