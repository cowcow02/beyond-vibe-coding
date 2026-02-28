# Isometric City Visualization Design
**Date:** 2026-02-28
**Project:** Beyond Vibe Coding

---

## Concept

A 2.5D isometric city that visualizes the scope of professional software engineering. A single lever toggles between 6 expertise levels (L0 Vibe Coder → L5 Expert). As the level increases, the city grows: floors drop from the sky onto buildings, new buildings rise from empty lots, new districts materialize. The contrast between a sparse L0 village and a dense L5 metropolis communicates the core message instantly.

No fog of war. No progress tracking. Pure visualization.

---

## Architecture

- **Framework:** Next.js (single page, no routing)
- **Rendering:** HTML `<canvas>` with 2D context, isometric projection
- **State:** React — current level (0–5), selected building
- **Animation:** `requestAnimationFrame` loop, spring easing
- **Data:** Static TypeScript file (`data/city.ts`), no backend

---

## City Structure

```
City
 └── District  (skill region, e.g. "Frontend")
      └── Building  (specific skill, e.g. "JavaScript")
           └── Floor  (expertise level, L0 Novice → L5 Expert)
```

**Roads** divide districts. Each district occupies a rectangular block on the isometric grid. Buildings sit on lots within their district's block.

### Districts (visible at each level)

| Level | Districts Visible |
|-------|------------------|
| L0 | Frontend, Backend |
| L1 | + Databases |
| L2 | + DevOps, Testing |
| L3 | + Security, System Design |
| L4 | + Performance, Mobile |
| L5 | + Leadership, Data Science |

### Buildings per District (~4–8 each)

**Frontend:** HTML & CSS, JavaScript, TypeScript, React/Vue, Browser APIs, Build Tools
**Backend:** Node/Python/Go, REST APIs, Auth, Message Queues, Caching
**Databases:** SQL, NoSQL, Schema Design, Query Optimization, Migrations
**DevOps:** Docker, CI/CD, Cloud Platforms, Monitoring, IaC
**Testing:** Unit Testing, Integration Testing, E2E, TDD, Load Testing
**Security:** Auth & AuthZ, OWASP, Secrets Management, Pen Testing
**System Design:** Distributed Systems, CAP Theorem, Microservices, Event-Driven
**Performance:** Profiling, Caching Strategies, CDN, Database Tuning
**Mobile:** React Native, Native APIs, App Store, Offline-First
**Leadership:** Code Review, Mentoring, Technical Writing, Roadmapping
**Data Science:** Statistics, ML Basics, Data Pipelines, Model Deployment

---

## Isometric Rendering

Standard isometric projection — world grid `(col, row)` → screen `(x, y)`:

```
screenX = (col - row) * TILE_W / 2
screenY = (col + row) * TILE_H / 2
```

Draw order: back-to-front (painter's algorithm) so near buildings overlap far buildings correctly.

**Floor box faces:**
- Top face: lightest shade
- Left face: medium shade
- Right face: darkest shade

**Tile types:**
- Road tiles: light grey asphalt
- District ground: warm sand (technical) / cool slate (non-technical)
- Building floors: colored by district, shade varies by floor height

---

## Level Slider

Fixed at bottom of screen. Six labeled stops:

```
[Vibe Coder] ——●—————————————————— [Expert]
      L0        L1    L2    L3    L4    L5
```

Each stop shows level number + role title. Industrial/zoning-board aesthetic. Clicking or dragging triggers city transition animation.

---

## Animation System

**Level increase (e.g. L2 → L3):**
1. New floors drop from ~200px above destination, spring easing with slight overshoot, staggered across buildings (~50ms delay between each)
2. New buildings grow upward from ground (scaleY 0 → 1)
3. New districts fade + scale in from ground level
4. Total duration: ~800ms

**Level decrease (e.g. L3 → L2):**
1. Removed floors lift up and fly off screen
2. Buildings that lose all floors sink into ground
3. Districts that disappear fade out
4. Total duration: ~600ms

---

## Building Interaction

Click a building → panel slides in from right:

```
┌─────────────────────────────────┐
│  JavaScript                     │
│  Frontend District              │
│                                 │
│  ▓ L0  Novice       write loops, basic DOM
│  ▓ L1  Aware        scope, closures, events
│  ▓ L2  Builder      async/await, modules
│  ● L3  Independent  engine internals, perf  ← current level
│  ░ L4  Senior       TC39, spec knowledge
│  ░ L5  Expert       V8 internals, contributes
└─────────────────────────────────┘
```

- Floors at/below current level: filled
- Floors above current level: greyed out (hints at what's beyond)
- Click a floor row → expands to show full skills list
- Click elsewhere → closes panel

---

## Data Model

```ts
interface Floor {
  level: number;        // 0–5
  title: string;        // "Novice", "Aware", etc.
  description: string;  // one line
  skills: string[];     // bullet list of capabilities
}

interface Building {
  id: string;
  name: string;         // "JavaScript"
  gridPos: { col: number; row: number }; // within district
  floors: Floor[];      // always 6 floors
}

interface District {
  id: string;
  name: string;         // "Frontend"
  type: 'technical' | 'non-technical';
  appearsAtLevel: number; // 0–5
  gridOrigin: { col: number; row: number }; // top-left of block
  size: { cols: number; rows: number };
  buildings: Building[];
}
```

---

## File Structure

```
app/
  page.tsx              ← main component, slider state
  components/
    CityCanvas.tsx      ← canvas renderer + animation loop
    BuildingPanel.tsx   ← slide-in info panel
    LevelSlider.tsx     ← bottom lever control
  data/
    city.ts             ← full district/building/floor data
  lib/
    isometric.ts        ← projection math, draw primitives
    animation.ts        ← spring easing, animation queue
  globals.css
```
