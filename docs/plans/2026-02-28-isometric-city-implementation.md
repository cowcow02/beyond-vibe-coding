# Isometric City Visualization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current CSS div city with a canvas-based 2.5D isometric city where a level slider (L0–L5) animates the city growing — floors dropping from the sky, buildings rising, new districts appearing.

**Architecture:** Single `<canvas>` element rendered with 2D context using isometric projection math. React holds current level state and selected building. All visual transitions run as frame-by-frame `requestAnimationFrame` animations on canvas. No third-party animation or 3D libraries.

**Tech Stack:** Next.js 15, React 19, TypeScript, HTML Canvas 2D API, Tailwind for UI chrome outside canvas.

**Reference design doc:** `docs/plans/2026-02-28-isometric-city-design.md`

---

## Overview of Tasks

1. Data model (`app/data/city.ts`)
2. Isometric math lib (`app/lib/isometric.ts`)
3. Animation lib (`app/lib/animation.ts`)
4. Canvas renderer (`app/components/CityCanvas.tsx`)
5. Level slider (`app/components/LevelSlider.tsx`)
6. Building info panel (`app/components/BuildingPanel.tsx`)
7. Wire up `app/page.tsx`
8. Delete old files

---

## Task 1: Data Model

**Files:**
- Create: `app/data/city.ts`
- Delete later: `app/data/regions.ts` (Task 8)

### Step 1: Create `app/data/city.ts` with types and full data

```ts
// app/data/city.ts

export interface Floor {
  level: number;       // 0–5
  title: string;       // "Novice", "Aware Novice", etc.
  description: string; // one-liner
  skills: string[];
}

export interface Building {
  id: string;
  name: string;
  col: number; // position within district grid (0-indexed)
  row: number;
  floors: Floor[]; // always 6 entries, level 0–5
}

export interface District {
  id: string;
  name: string;
  type: 'technical' | 'non-technical';
  appearsAtLevel: number; // 0–5: when does this district first appear
  originCol: number; // top-left corner of district block in world grid
  originRow: number;
  cols: number;      // width in tiles
  rows: number;      // height in tiles
  buildings: Building[];
}

export const LEVEL_LABELS: Record<number, { title: string; tagline: string }> = {
  0: { title: 'Vibe Coder',          tagline: 'Building with AI, unsure why it works' },
  1: { title: 'Aware Novice',        tagline: 'Starting to understand the foundations' },
  2: { title: 'AI-Assisted Builder', tagline: 'Steering AI with growing confidence' },
  3: { title: 'Independent Engineer',tagline: 'Works without AI, critiques it sharply' },
  4: { title: 'Senior / Staff',      tagline: 'Shapes systems, mentors others' },
  5: { title: 'Expert / Leader',     tagline: 'Defines the field, writes the standards' },
};

// Helper: standard 6-floor template per skill
function makeFloors(overrides: Partial<Floor>[]): Floor[] {
  const defaults: Floor[] = [
    { level: 0, title: 'Vibe Coder',           description: 'Uses AI to produce output without understanding it', skills: [] },
    { level: 1, title: 'Aware Novice',          description: 'Understands the basics, can read and tweak code',   skills: [] },
    { level: 2, title: 'AI-Assisted Builder',   description: 'Understands AI output, iterates with guidance',     skills: [] },
    { level: 3, title: 'Independent Engineer',  description: 'Architects without AI, verifies and critiques it',  skills: [] },
    { level: 4, title: 'Senior / Staff',        description: 'Designs system-wide strategy, mentors',             skills: [] },
    { level: 5, title: 'Expert',                description: 'Pushes boundaries, writes standards others follow', skills: [] },
  ];
  return defaults.map((d, i) => ({ ...d, ...overrides[i] }));
}

export const districts: District[] = [
  // ── L0 districts (visible from the start) ──────────────────────────────
  {
    id: 'frontend',
    name: 'Frontend',
    type: 'technical',
    appearsAtLevel: 0,
    originCol: 2, originRow: 2,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'html-css', name: 'HTML & CSS', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Paste AI-generated markup', 'Basic styling tweaks'] },
          { skills: ['Semantic HTML', 'Box model', 'Flexbox basics'] },
          { skills: ['CSS Grid', 'Responsive design', 'Animations'] },
          { skills: ['Accessibility (a11y)', 'CSS architecture (BEM/Modules)', 'Performance budgets'] },
          { skills: ['Design systems', 'Cross-browser edge cases', 'CSS-in-JS trade-offs'] },
          { skills: ['CSS spec contributions', 'Browser rendering internals', 'New layout primitives'] },
        ]),
      },
      {
        id: 'javascript', name: 'JavaScript', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Copy-paste snippets', 'console.log debugging'] },
          { skills: ['Variables, loops, functions', 'DOM manipulation', 'Events'] },
          { skills: ['Async/await', 'Modules (ESM)', 'Array methods', 'Closures'] },
          { skills: ['Prototype chain', 'Event loop', 'Memory model', 'Performance profiling'] },
          { skills: ['TC39 proposals', 'Language spec reading', 'Engine optimisation hints'] },
          { skills: ['V8 internals', 'Spec contributions', 'New language features authorship'] },
        ]),
      },
      {
        id: 'typescript', name: 'TypeScript', col: 4, row: 0,
        floors: makeFloors([
          { skills: ['Accept AI-typed code', 'Ignore type errors'] },
          { skills: ['Basic types', 'Interfaces', 'Type annotations'] },
          { skills: ['Generics basics', 'Union/intersection types', 'Type narrowing'] },
          { skills: ['Advanced generics', 'Conditional types', 'Declaration files'] },
          { skills: ['Compiler internals', 'Plugin authorship', 'Type-level programming'] },
          { skills: ['TypeScript spec contributions', 'New language feature design'] },
        ]),
      },
      {
        id: 'react', name: 'React / Vue', col: 1, row: 2,
        floors: makeFloors([
          { skills: ['Use AI-generated components', 'Basic JSX edits'] },
          { skills: ['Components, props, state', 'Event handling', 'Lists & keys'] },
          { skills: ['Hooks (useState/useEffect)', 'Context API', 'Component composition'] },
          { skills: ['Virtual DOM reconciliation', 'Custom hooks', 'Performance (memo/callback)'] },
          { skills: ['Concurrent features', 'Micro-frontends', 'Framework internals'] },
          { skills: ['Framework contributions', 'RFC authorship', 'New rendering patterns'] },
        ]),
      },
      {
        id: 'build-tools', name: 'Build Tools', col: 3, row: 2,
        floors: makeFloors([
          { skills: ['Run npm start', 'Follow setup instructions'] },
          { skills: ['npm scripts', 'Basic Webpack/Vite config', 'Env variables'] },
          { skills: ['Code splitting', 'Tree shaking', 'Custom plugins'] },
          { skills: ['Bundle analysis', 'Custom loaders', 'Module federation'] },
          { skills: ['Build system design', 'Monorepo tooling', 'Cross-platform builds'] },
          { skills: ['Bundler internals', 'New tooling standards', 'Open source tooling'] },
        ]),
      },
    ],
  },

  {
    id: 'backend',
    name: 'Backend & APIs',
    type: 'technical',
    appearsAtLevel: 0,
    originCol: 9, originRow: 2,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'rest-apis', name: 'REST APIs', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Use AI to generate endpoints', 'Basic CRUD routes'] },
          { skills: ['HTTP methods', 'Status codes', 'Request/response cycle'] },
          { skills: ['REST conventions', 'Middleware', 'Input validation'] },
          { skills: ['API versioning', 'Rate limiting', 'Pagination patterns'] },
          { skills: ['API design standards', 'SDK generation', 'Contract testing'] },
          { skills: ['Protocol design', 'RFC authorship', 'Industry API standards'] },
        ]),
      },
      {
        id: 'server-runtime', name: 'Server Runtime', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Run AI-generated server code', 'npm start'] },
          { skills: ['Node.js basics', 'Express routing', 'Environment config'] },
          { skills: ['Middleware patterns', 'Error handling', 'Async patterns'] },
          { skills: ['Event loop internals', 'Clustering', 'Memory management'] },
          { skills: ['Runtime tuning', 'Custom runtimes', 'Cross-runtime code'] },
          { skills: ['Runtime contributions', 'New server paradigms'] },
        ]),
      },
      {
        id: 'auth', name: 'Auth & Identity', col: 4, row: 0,
        floors: makeFloors([
          { skills: ['Paste AI auth boilerplate', 'Basic login form'] },
          { skills: ['Sessions vs JWT', 'Password hashing', 'Basic OAuth flow'] },
          { skills: ['OAuth 2.0 / OIDC', 'Token refresh', 'Role-based access'] },
          { skills: ['Zero-trust architecture', 'MFA implementation', 'Token security'] },
          { skills: ['Identity provider design', 'SSO federation', 'Compliance (SOC2)'] },
          { skills: ['Auth protocol design', 'New identity standards'] },
        ]),
      },
      {
        id: 'queues', name: 'Message Queues', col: 1, row: 2,
        floors: makeFloors([
          { skills: ['Use AI-generated queue code'] },
          { skills: ['Producer/consumer model', 'Basic queue setup'] },
          { skills: ['Dead letter queues', 'Retry strategies', 'Idempotency'] },
          { skills: ['Exactly-once semantics', 'Event sourcing', 'CQRS basics'] },
          { skills: ['Kafka internals', 'Stream processing design', 'Back-pressure'] },
          { skills: ['Distributed streaming protocols', 'New messaging paradigms'] },
        ]),
      },
    ],
  },

  // ── L1 district ─────────────────────────────────────────────────────────
  {
    id: 'databases',
    name: 'Databases',
    type: 'technical',
    appearsAtLevel: 1,
    originCol: 2, originRow: 8,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'sql', name: 'SQL', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Run AI-generated queries'] },
          { skills: ['SELECT, INSERT, UPDATE, DELETE', 'Basic JOINs', 'WHERE clauses'] },
          { skills: ['Indexes', 'Transactions', 'Query planning'] },
          { skills: ['Query optimisation', 'Execution plans', 'Window functions'] },
          { skills: ['Database design', 'Replication', 'Partitioning strategies'] },
          { skills: ['DBMS contributions', 'Query language extensions'] },
        ]),
      },
      {
        id: 'nosql', name: 'NoSQL', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Use AI to set up MongoDB/Redis'] },
          { skills: ['Document model', 'Key-value stores', 'Basic CRUD'] },
          { skills: ['Data modelling for NoSQL', 'Aggregation pipelines', 'TTL'] },
          { skills: ['CAP theorem trade-offs', 'Consistency models', 'Sharding'] },
          { skills: ['Multi-model databases', 'Cross-datacenter replication'] },
          { skills: ['Database engine contributions', 'New data models'] },
        ]),
      },
      {
        id: 'schema-design', name: 'Schema Design', col: 4, row: 0,
        floors: makeFloors([
          { skills: ['Accept AI-generated schemas'] },
          { skills: ['Normalisation basics', '1NF/2NF/3NF', 'Foreign keys'] },
          { skills: ['Denormalisation trade-offs', 'Polymorphic relations', 'Migrations'] },
          { skills: ['Event-sourced schemas', 'Multi-tenant design', 'Schema evolution'] },
          { skills: ['Schema registry', 'Data governance', 'Cross-service contracts'] },
          { skills: ['Schema language design', 'Data mesh architecture'] },
        ]),
      },
    ],
  },

  // ── L2 districts ────────────────────────────────────────────────────────
  {
    id: 'devops',
    name: 'DevOps',
    type: 'technical',
    appearsAtLevel: 2,
    originCol: 9, originRow: 8,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'docker', name: 'Containers', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Run AI-generated Dockerfile'] },
          { skills: ['Docker basics', 'Images vs containers', 'docker-compose'] },
          { skills: ['Multi-stage builds', 'Volumes', 'Networking', 'Docker Hub'] },
          { skills: ['Container security', 'Resource limits', 'Kubernetes basics'] },
          { skills: ['K8s operators', 'Service mesh (Istio)', 'eBPF'] },
          { skills: ['Container runtime contributions', 'New orchestration patterns'] },
        ]),
      },
      {
        id: 'cicd', name: 'CI / CD', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Push and hope', 'Follow existing CI config'] },
          { skills: ['GitHub Actions basics', 'Lint + test in CI', 'Secrets'] },
          { skills: ['Pipeline design', 'Artifact management', 'Canary deploys'] },
          { skills: ['Progressive delivery', 'Feature flags', 'Rollback strategies'] },
          { skills: ['Platform engineering', 'Internal developer platforms'] },
          { skills: ['Delivery standards', 'New deployment paradigms'] },
        ]),
      },
      {
        id: 'monitoring', name: 'Monitoring', col: 4, row: 0,
        floors: makeFloors([
          { skills: ['Check logs when broken'] },
          { skills: ['Log levels', 'Basic dashboards', 'Uptime checks'] },
          { skills: ['Structured logging', 'Metrics (Prometheus)', 'Alerting'] },
          { skills: ['Distributed tracing', 'SLOs/SLIs/SLAs', 'On-call design'] },
          { skills: ['Observability platforms', 'Chaos engineering', 'AIOps'] },
          { skills: ['Observability standards', 'OpenTelemetry contributions'] },
        ]),
      },
    ],
  },

  {
    id: 'testing',
    name: 'Testing & QA',
    type: 'technical',
    appearsAtLevel: 2,
    originCol: 2, originRow: 14,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'unit-testing', name: 'Unit Testing', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Ask AI to write tests'] },
          { skills: ['Test anatomy (arrange/act/assert)', 'Jest basics', 'Test runners'] },
          { skills: ['Mocking, stubs, spies', 'Test doubles', 'Coverage basics'] },
          { skills: ['TDD discipline', 'Property-based testing', 'Mutation testing'] },
          { skills: ['Test architecture', 'Flakiness elimination', 'Test suite design'] },
          { skills: ['Testing framework contributions', 'New testing methodologies'] },
        ]),
      },
      {
        id: 'integration-testing', name: 'Integration', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Manual testing only'] },
          { skills: ['API testing (Postman/curl)', 'Basic DB integration tests'] },
          { skills: ['Test containers', 'Contract testing', 'Service stubs'] },
          { skills: ['Consumer-driven contracts', 'Pact', 'Schema validation'] },
          { skills: ['Platform-wide test strategy', 'Test data management'] },
          { skills: ['Testing standards', 'New integration patterns'] },
        ]),
      },
      {
        id: 'e2e', name: 'E2E Testing', col: 4, row: 0,
        floors: makeFloors([
          { skills: ['Click through manually'] },
          { skills: ['Playwright/Cypress basics', 'Record & replay'] },
          { skills: ['Page object model', 'Visual regression', 'CI integration'] },
          { skills: ['Flakiness strategies', 'Parallel execution', 'Trace analysis'] },
          { skills: ['E2E test architecture', 'Cross-browser strategy'] },
          { skills: ['Browser automation contributions', 'New E2E paradigms'] },
        ]),
      },
    ],
  },

  // ── L3 districts ────────────────────────────────────────────────────────
  {
    id: 'security',
    name: 'Security',
    type: 'technical',
    appearsAtLevel: 3,
    originCol: 9, originRow: 14,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'owasp', name: 'OWASP Top 10', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Unaware of vulnerabilities'] },
          { skills: ['Know what XSS/SQLi are', 'Basic input sanitisation'] },
          { skills: ['CSRF tokens', 'Secure headers', 'Dependency scanning'] },
          { skills: ['Threat modelling', 'Pen testing basics', 'SAST/DAST'] },
          { skills: ['Security architecture review', 'Red team leadership'] },
          { skills: ['CVE research', 'Security standard authorship'] },
        ]),
      },
      {
        id: 'secrets', name: 'Secrets Mgmt', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Hardcode secrets in code'] },
          { skills: ['.env files', 'Basic secret rotation', 'Never commit secrets'] },
          { skills: ['Vault / AWS Secrets Manager', 'Secret rotation pipelines'] },
          { skills: ['Zero-secret environments', 'Workload identity', 'SPIFFE'] },
          { skills: ['Secrets governance', 'Enterprise key management'] },
          { skills: ['Cryptographic protocol contributions'] },
        ]),
      },
    ],
  },

  {
    id: 'system-design',
    name: 'System Design',
    type: 'technical',
    appearsAtLevel: 3,
    originCol: 16, originRow: 2,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'distributed', name: 'Distributed Systems', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Follow existing architecture'] },
          { skills: ['Client-server model', 'Load balancers', 'CDNs'] },
          { skills: ['Horizontal scaling', 'Stateless services', 'Database read replicas'] },
          { skills: ['CAP theorem', 'Eventual consistency', 'Distributed transactions'] },
          { skills: ['Global-scale design', 'Multi-region failover', 'Consensus protocols'] },
          { skills: ['Distributed systems research', 'Protocol authorship'] },
        ]),
      },
      {
        id: 'microservices', name: 'Microservices', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Use existing microservices'] },
          { skills: ['Service boundaries', 'REST communication', 'Basic service mesh'] },
          { skills: ['Domain-driven design', 'Event-driven patterns', 'Saga pattern'] },
          { skills: ['Service mesh deep dive', 'Observability across services', 'Chaos engineering'] },
          { skills: ['Platform-wide service design', 'Migration strategies'] },
          { skills: ['Architecture standard authorship', 'Industry patterns'] },
        ]),
      },
    ],
  },

  // ── L4 districts ────────────────────────────────────────────────────────
  {
    id: 'performance',
    name: 'Performance',
    type: 'technical',
    appearsAtLevel: 4,
    originCol: 16, originRow: 8,
    cols: 5, rows: 4,
    buildings: [
      {
        id: 'profiling', name: 'Profiling', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Notice it is slow'] },
          { skills: ['Browser DevTools', 'Network tab', 'Basic flame graphs'] },
          { skills: ['CPU profiling', 'Memory leak hunting', 'Bundle analysis'] },
          { skills: ['Continuous profiling', 'Production profiling', 'Sampling vs tracing'] },
          { skills: ['Performance culture', 'Regression detection systems'] },
          { skills: ['Profiler tooling contributions', 'New measurement standards'] },
        ]),
      },
      {
        id: 'caching', name: 'Caching', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Unaware of caching'] },
          { skills: ['Browser cache', 'Cache-Control headers', 'CDN basics'] },
          { skills: ['Redis', 'Cache invalidation strategies', 'Stale-while-revalidate'] },
          { skills: ['Cache stampede prevention', 'Multi-layer caching', 'Write-through vs write-back'] },
          { skills: ['Cache architecture', 'Global cache design', 'Cost optimisation'] },
          { skills: ['Caching protocol contributions'] },
        ]),
      },
    ],
  },

  // ── L5 districts ────────────────────────────────────────────────────────
  {
    id: 'leadership',
    name: 'Engineering Leadership',
    type: 'non-technical',
    appearsAtLevel: 5,
    originCol: 16, originRow: 14,
    cols: 6, rows: 4,
    buildings: [
      {
        id: 'mentoring', name: 'Mentoring', col: 0, row: 0,
        floors: makeFloors([
          { skills: ['Receive mentorship only'] },
          { skills: ['Share learnings', 'Pair programming', 'Code review feedback'] },
          { skills: ['Regular 1:1 mentoring', 'Career guidance', 'Structured teaching'] },
          { skills: ['Engineering growth frameworks', 'Team learning culture'] },
          { skills: ['Organisation-wide mentoring programs', 'Hiring strategy'] },
          { skills: ['Industry mentoring standards', 'Engineering career research'] },
        ]),
      },
      {
        id: 'tech-strategy', name: 'Tech Strategy', col: 2, row: 0,
        floors: makeFloors([
          { skills: ['Follow existing strategy'] },
          { skills: ['Understand roadmap', 'Contribute to tech planning'] },
          { skills: ['Write RFCs', 'Evaluate trade-offs', 'Build consensus'] },
          { skills: ['Set team technical direction', 'Deprecation strategy'] },
          { skills: ['Org-wide architecture', 'Build-vs-buy decisions', 'Platform strategy'] },
          { skills: ['Industry standard setting', 'Open source strategy', 'VC-level tech advisory'] },
        ]),
      },
      {
        id: 'communication', name: 'Communication', col: 4, row: 0,
        floors: makeFloors([
          { skills: ['Struggle to explain technical decisions'] },
          { skills: ['Write clear PRs', 'Basic technical docs', 'Team standups'] },
          { skills: ['Design docs', 'Cross-team communication', 'Non-technical explanations'] },
          { skills: ['Executive communication', 'Public tech writing', 'Conference talks'] },
          { skills: ['Industry thought leadership', 'Keynote speaking', 'Book/course authorship'] },
          { skills: ['Defining industry narrative', 'Standards body participation'] },
        ]),
      },
    ],
  },
];
```

### Step 2: Verify TypeScript compiles

```bash
cd /Users/cowcow02/Repo/beyond-vibe-coding
npx tsc --noEmit
```

Expected: no errors (or only errors from old files, not city.ts).

### Step 3: Commit

```bash
git add app/data/city.ts
git commit -m "feat: add isometric city data model (districts/buildings/floors)"
```

---

## Task 2: Isometric Math Library

**Files:**
- Create: `app/lib/isometric.ts`

### Step 1: Create the file

```ts
// app/lib/isometric.ts

export const TILE_W = 64;  // width of one isometric tile
export const TILE_H = 32;  // height of one isometric tile
export const FLOOR_H = 24; // visual height of one building floor

export interface ScreenPos {
  x: number;
  y: number;
}

/** Convert world grid (col, row) → canvas screen (x, y) for the tile's top-left corner */
export function toScreen(col: number, row: number): ScreenPos {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/** Draw a single isometric floor box at world position (col, row), at height floorIndex */
export function drawFloorBox(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  floorIndex: number,
  colorTop: string,
  colorLeft: string,
  colorRight: string,
  alpha = 1,
) {
  const { x, y } = toScreen(col, row);
  const yBase = y - floorIndex * FLOOR_H; // move up by floor height

  ctx.save();
  ctx.globalAlpha = alpha;

  // Top face (diamond)
  ctx.beginPath();
  ctx.moveTo(x,               yBase - TILE_H / 2);
  ctx.lineTo(x + TILE_W / 2, yBase);
  ctx.lineTo(x,               yBase + TILE_H / 2);
  ctx.lineTo(x - TILE_W / 2, yBase);
  ctx.closePath();
  ctx.fillStyle = colorTop;
  ctx.fill();

  // Left face
  ctx.beginPath();
  ctx.moveTo(x - TILE_W / 2, yBase);
  ctx.lineTo(x,               yBase + TILE_H / 2);
  ctx.lineTo(x,               yBase + TILE_H / 2 + FLOOR_H);
  ctx.lineTo(x - TILE_W / 2, yBase + FLOOR_H);
  ctx.closePath();
  ctx.fillStyle = colorLeft;
  ctx.fill();

  // Right face
  ctx.beginPath();
  ctx.moveTo(x + TILE_W / 2, yBase);
  ctx.lineTo(x,               yBase + TILE_H / 2);
  ctx.lineTo(x,               yBase + TILE_H / 2 + FLOOR_H);
  ctx.lineTo(x + TILE_W / 2, yBase + FLOOR_H);
  ctx.closePath();
  ctx.fillStyle = colorRight;
  ctx.fill();

  ctx.restore();
}

/** Draw a flat isometric tile (road, district ground) */
export function drawGroundTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  fillColor: string,
  strokeColor?: string,
) {
  const { x, y } = toScreen(col, row);

  ctx.beginPath();
  ctx.moveTo(x,               y - TILE_H / 2);
  ctx.lineTo(x + TILE_W / 2, y);
  ctx.lineTo(x,               y + TILE_H / 2);
  ctx.lineTo(x - TILE_W / 2, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

/** Bounding box check: did a click at (px, py) land on tile (col, row)? */
export function hitTestTile(
  px: number, py: number,
  col: number, row: number,
  originX: number, originY: number,
): boolean {
  const { x, y } = toScreen(col, row);
  const tx = px - (originX + x);
  const ty = py - (originY + y);
  // isometric rhombus hit test
  return Math.abs(tx / (TILE_W / 2)) + Math.abs(ty / (TILE_H / 2)) <= 1;
}
```

### Step 2: Verify TypeScript

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add app/lib/isometric.ts
git commit -m "feat: isometric projection math and draw primitives"
```

---

## Task 3: Animation Library

**Files:**
- Create: `app/lib/animation.ts`

### Step 1: Create the file

```ts
// app/lib/animation.ts

/** Spring easing: t = 0→1, returns eased value with slight overshoot */
export function springEase(t: number): number {
  if (t >= 1) return 1;
  const c = 1.70158 * 1.525; // back easing constant
  const t2 = t / 0.5;
  if (t2 < 1) return 0.5 * (t2 * t2 * ((c + 1) * t2 - c));
  const t3 = t2 - 2;
  return 0.5 * (t3 * t3 * ((c + 1) * t3 + c) + 2);
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface FloorAnimation {
  districtId: string;
  buildingId: string;
  floorIndex: number;   // which floor (0-based)
  startY: number;       // pixels above final position (negative = above)
  progress: number;     // 0→1
  duration: number;     // ms
  startTime: number;    // performance.now() when started
  direction: 'in' | 'out';
}

export interface BuildingAnimation {
  districtId: string;
  buildingId: string;
  progress: number;
  duration: number;
  startTime: number;
  direction: 'in' | 'out';
}

export interface DistrictAnimation {
  districtId: string;
  progress: number;
  duration: number;
  startTime: number;
  direction: 'in' | 'out';
}

export interface AnimationState {
  floors: FloorAnimation[];
  buildings: BuildingAnimation[];
  districts: DistrictAnimation[];
}

/** Returns updated progress for an animation item */
export function tickProgress(item: { startTime: number; duration: number }, now: number): number {
  return Math.min(1, (now - item.startTime) / item.duration);
}

/** Is any animation still running? */
export function isAnimating(state: AnimationState): boolean {
  return (
    state.floors.some(f => f.progress < 1) ||
    state.buildings.some(b => b.progress < 1) ||
    state.districts.some(d => d.progress < 1)
  );
}
```

### Step 2: Verify TypeScript

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add app/lib/animation.ts
git commit -m "feat: animation utilities (spring easing, animation state types)"
```

---

## Task 4: CityCanvas Component

This is the largest task — the main canvas renderer with full animation loop.

**Files:**
- Create: `app/components/CityCanvas.tsx`

### Step 1: Create the component

```tsx
// app/components/CityCanvas.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { districts, type District, type Building } from '../data/city';
import {
  TILE_W, TILE_H, FLOOR_H,
  toScreen, drawFloorBox, drawGroundTile,
} from '../lib/isometric';
import {
  springEase, lerp, tickProgress, isAnimating,
  type AnimationState, type FloorAnimation,
  type BuildingAnimation, type DistrictAnimation,
} from '../lib/animation';

// ── Colour palettes per district type ───────────────────────────────────────
const DISTRICT_COLORS: Record<string, { top: string; left: string; right: string; ground: string }> = {
  frontend:      { top: '#60a5fa', left: '#2563eb', right: '#1d4ed8', ground: '#1e3a5f' },
  backend:       { top: '#34d399', left: '#059669', right: '#047857', ground: '#064e3b' },
  databases:     { top: '#a78bfa', left: '#7c3aed', right: '#6d28d9', ground: '#2e1065' },
  devops:        { top: '#fb923c', left: '#ea580c', right: '#c2410c', ground: '#431407' },
  testing:       { top: '#f472b6', left: '#db2777', right: '#be185d', ground: '#500724' },
  security:      { top: '#f87171', left: '#dc2626', right: '#b91c1c', ground: '#450a0a' },
  'system-design': { top: '#38bdf8', left: '#0284c7', right: '#0369a1', ground: '#0c4a6e' },
  performance:   { top: '#fbbf24', left: '#d97706', right: '#b45309', ground: '#451a03' },
  leadership:    { top: '#e879f9', left: '#a21caf', right: '#86198f', ground: '#3b0764' },
};

const ROAD_COLOR   = '#1e293b';
const ROAD_STROKE  = '#334155';
const GROUND_COLOR = '#0f172a';

const DROP_START_Y = -200; // floors drop from this far above

interface Props {
  level: number;            // 0–5
  onBuildingClick: (districtId: string, buildingId: string) => void;
  selectedBuilding: { districtId: string; buildingId: string } | null;
}

export default function CityCanvas({ level, onBuildingClick, selectedBuilding }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const stateRef  = useRef<AnimationState>({ floors: [], buildings: [], districts: [] });
  const levelRef  = useRef(level);
  const originRef = useRef({ x: 0, y: 0 }); // canvas offset to centre city

  // ── Trigger animations when level changes ──────────────────────────────
  useEffect(() => {
    const prevLevel = levelRef.current;
    levelRef.current = level;
    const now = performance.now();
    const newAnim: AnimationState = { floors: [], buildings: [], districts: [] };
    const dir: 'in' | 'out' = level > prevLevel ? 'in' : 'out';
    let delay = 0;

    districts.forEach(district => {
      const wasVisible = district.appearsAtLevel <= prevLevel;
      const isVisible  = district.appearsAtLevel <= level;

      if (!wasVisible && isVisible) {
        // Whole district appears
        newAnim.districts.push({
          districtId: district.id,
          progress: 0, duration: 600,
          startTime: now + delay,
          direction: 'in',
        });
        delay += 120;
      } else if (wasVisible && !isVisible) {
        newAnim.districts.push({
          districtId: district.id,
          progress: 0, duration: 400,
          startTime: now,
          direction: 'out',
        });
      }

      if (wasVisible || isVisible) {
        district.buildings.forEach(building => {
          const prevFloors = Math.min(prevLevel + 1, 6);
          const newFloors  = Math.min(level + 1, 6);

          if (dir === 'in') {
            for (let f = prevFloors; f < newFloors; f++) {
              newAnim.floors.push({
                districtId: district.id,
                buildingId: building.id,
                floorIndex: f,
                startY: DROP_START_Y,
                progress: 0, duration: 500,
                startTime: now + delay,
                direction: 'in',
              });
              delay += 30;
            }
            if (prevFloors === 0 && newFloors > 0) {
              newAnim.buildings.push({
                districtId: district.id, buildingId: building.id,
                progress: 0, duration: 400,
                startTime: now + delay,
                direction: 'in',
              });
            }
          } else {
            for (let f = newFloors; f < prevFloors; f++) {
              newAnim.floors.push({
                districtId: district.id, buildingId: building.id,
                floorIndex: f,
                startY: DROP_START_Y,
                progress: 0, duration: 400,
                startTime: now,
                direction: 'out',
              });
            }
          }
        });
      }
    });

    stateRef.current = {
      floors:    [...stateRef.current.floors,    ...newAnim.floors],
      buildings: [...stateRef.current.buildings, ...newAnim.buildings],
      districts: [...stateRef.current.districts, ...newAnim.districts],
    };
  }, [level]);

  // ── Main draw loop ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const anim = stateRef.current;

    // Tick all animations
    anim.floors.forEach(f => {
      f.progress = tickProgress(f, now);
    });
    anim.buildings.forEach(b => {
      b.progress = tickProgress(b, now);
    });
    anim.districts.forEach(d => {
      d.progress = tickProgress(d, now);
    });

    // Remove completed animations
    stateRef.current = {
      floors:    anim.floors.filter(f => f.progress < 1 || f.direction === 'in'),
      buildings: anim.buildings.filter(b => b.progress < 1),
      districts: anim.districts.filter(d => d.progress < 1),
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = originRef.current.x;
    const oy = originRef.current.y;
    ctx.save();
    ctx.translate(ox, oy);

    // Draw back-to-front: collect all tiles, sort by draw order
    const visibleDistricts = districts.filter(d => d.appearsAtLevel <= level);

    // 1. Ground tiles
    visibleDistricts.forEach(district => {
      const distAnim = anim.districts.find(a => a.districtId === district.id);
      const alpha = distAnim?.direction === 'in'
        ? lerp(0, 1, springEase(distAnim.progress))
        : distAnim?.direction === 'out'
        ? lerp(1, 0, distAnim.progress)
        : 1;

      const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];

      for (let c = 0; c < district.cols; c++) {
        for (let r = 0; r < district.rows; r++) {
          ctx.globalAlpha = alpha;
          drawGroundTile(
            ctx,
            district.originCol + c,
            district.originRow + r,
            colors.ground,
            '#1e293b',
          );
        }
      }

      // Road tiles around the district (1-tile border)
      ctx.globalAlpha = 1;
    });

    // 2. Buildings (floor boxes)
    visibleDistricts.forEach(district => {
      const colors = DISTRICT_COLORS[district.id] ?? DISTRICT_COLORS['frontend'];
      const numFloors = level + 1;

      district.buildings.forEach(building => {
        const bCol = district.originCol + building.col;
        const bRow = district.originRow + building.row;

        for (let f = 0; f < numFloors && f < 6; f++) {
          // Check if this floor has an animation
          const floorAnim = anim.floors.find(
            a => a.districtId === district.id &&
                 a.buildingId === building.id &&
                 a.floorIndex === f
          );

          let yOffset = 0;
          let alpha = 1;

          if (floorAnim) {
            const eased = springEase(floorAnim.progress);
            if (floorAnim.direction === 'in') {
              yOffset = lerp(DROP_START_Y, 0, eased);
              alpha = lerp(0.2, 1, eased);
            } else {
              yOffset = lerp(0, DROP_START_Y, floorAnim.progress);
              alpha = lerp(1, 0, floorAnim.progress);
            }
          }

          const isSelected =
            selectedBuilding?.districtId === district.id &&
            selectedBuilding?.buildingId === building.id;

          const highlight = isSelected ? 1.4 : 1;

          ctx.save();
          ctx.translate(0, yOffset);
          drawFloorBox(
            ctx, bCol, bRow, f,
            shadeColor(colors.top,   highlight),
            shadeColor(colors.left,  highlight),
            shadeColor(colors.right, highlight),
            alpha,
          );
          ctx.restore();
        }

        // Building label at ground level
        if (numFloors > 0) {
          const { x, y } = toScreen(bCol, bRow);
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(building.name, x, y + TILE_H / 2 + 10);
          ctx.restore();
        }
      });
    });

    ctx.restore();

    animRef.current = requestAnimationFrame(draw);
  }, [level, selectedBuilding]);

  // Start loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Centre the city roughly
      originRef.current = {
        x: canvas.width  * 0.5,
        y: canvas.height * 0.3,
      };
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Click handling
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - originRef.current.x;
    const py = e.clientY - rect.top  - originRef.current.y;

    // Simple hit test: find building whose ground tile contains the click
    for (const district of districts) {
      if (district.appearsAtLevel > level) continue;
      for (const building of district.buildings) {
        const bCol = district.originCol + building.col;
        const bRow = district.originRow + building.row;
        const { x, y } = toScreen(bCol, bRow);
        // Rough rhombus hit test
        const dx = Math.abs(px - x) / (TILE_W / 2);
        const dy = Math.abs(py - y) / (TILE_H / 2);
        if (dx + dy <= 1.2) {
          onBuildingClick(district.id, building.id);
          return;
        }
      }
    }
    onBuildingClick('', ''); // deselect
  }, [level, onBuildingClick]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ cursor: 'pointer', background: GROUND_COLOR }}
      onClick={handleClick}
    />
  );
}

/** Multiply RGB brightness */
function shadeColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r * factor)}, ${Math.min(255, g * factor)}, ${Math.min(255, b * factor)})`;
}
```

### Step 2: Verify TypeScript

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add app/components/CityCanvas.tsx
git commit -m "feat: isometric canvas renderer with animation loop"
```

---

## Task 5: Level Slider Component

**Files:**
- Create: `app/components/LevelSlider.tsx`

### Step 1: Create the file

```tsx
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
```

### Step 2: Verify TypeScript

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add app/components/LevelSlider.tsx
git commit -m "feat: level slider component with 6 stops"
```

---

## Task 6: Building Info Panel

**Files:**
- Create: `app/components/BuildingPanel.tsx`

### Step 1: Create the file

```tsx
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
```

### Step 2: Verify TypeScript

```bash
npx tsc --noEmit
```

### Step 3: Commit

```bash
git add app/components/BuildingPanel.tsx
git commit -m "feat: building info panel with floor breakdown"
```

---

## Task 7: Wire Up page.tsx

**Files:**
- Modify: `app/page.tsx` (full rewrite)

### Step 1: Replace `app/page.tsx`

```tsx
// app/page.tsx
'use client';

import { useState, useCallback } from 'react';
import CityCanvas from './components/CityCanvas';
import LevelSlider from './components/LevelSlider';
import BuildingPanel from './components/BuildingPanel';
import { LEVEL_LABELS } from './data/city';

export default function Home() {
  const [level, setLevel] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    districtId: string;
    buildingId: string;
  } | null>(null);

  const handleBuildingClick = useCallback((districtId: string, buildingId: string) => {
    if (!districtId) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding({ districtId, buildingId });
    }
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      {/* Canvas city */}
      <CityCanvas
        level={level}
        onBuildingClick={handleBuildingClick}
        selectedBuilding={selectedBuilding}
      />

      {/* Title */}
      <div className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.8), transparent)' }}>
        <h1 className="font-mono text-2xl font-bold text-amber-300 tracking-tight">
          Beyond Vibe Coding
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-1">
          {LEVEL_LABELS[level].title} — {LEVEL_LABELS[level].tagline}
        </p>
      </div>

      {/* Building panel */}
      {selectedBuilding && (
        <BuildingPanel
          districtId={selectedBuilding.districtId}
          buildingId={selectedBuilding.buildingId}
          currentLevel={level}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      {/* Level slider */}
      <LevelSlider level={level} onChange={setLevel} />
    </main>
  );
}
```

### Step 2: Run dev server and visually verify

```bash
npm run dev
```

Open http://localhost:3000 and check:
- [ ] Dark canvas renders
- [ ] Isometric tiles are visible
- [ ] Level slider at bottom has 6 stops
- [ ] Moving slider triggers animation (floors drop in)
- [ ] Clicking a building opens the side panel
- [ ] Title and tagline update with level

### Step 3: Commit

```bash
git add app/page.tsx
git commit -m "feat: wire up isometric city page with slider and panel"
```

---

## Task 8: Clean Up Old Files

**Files:**
- Delete: `app/data/regions.ts`
- Delete: (any doc files the previous agent created that are now obsolete)

### Step 1: Remove old data file

```bash
rm /Users/cowcow02/Repo/beyond-vibe-coding/app/data/regions.ts
```

### Step 2: Verify no imports remain

```bash
grep -r "regions" app/ --include="*.ts" --include="*.tsx"
```

Expected: no results.

### Step 3: Build check

```bash
npm run build
```

Expected: successful build, no errors.

### Step 4: Commit

```bash
git add -A
git commit -m "chore: remove old CSS-based city files, clean up regions.ts"
```

---

## Visual Verification Checklist

After all tasks complete, verify in browser:

- [ ] L0: Only 2 districts visible (Frontend, Backend), tiny 1-floor buildings
- [ ] L1: Databases district appears with animation
- [ ] L2: DevOps and Testing districts appear
- [ ] L3: Security and System Design appear
- [ ] L4: Performance district appears, buildings are 5 floors tall
- [ ] L5: Leadership district appears, city feels dense and tall
- [ ] Floors animate dropping when moving slider forward
- [ ] Floors animate rising when moving slider backward
- [ ] Clicking a building shows the info panel
- [ ] Panel shows floors locked above current level
- [ ] Expanding a floor shows its skills list
