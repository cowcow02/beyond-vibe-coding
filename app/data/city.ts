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
    originCol: 3, originRow: 2,
    cols: 8, rows: 5,
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
        id: 'javascript', name: 'JavaScript', col: 3, row: 0,
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
        id: 'typescript', name: 'TypeScript', col: 6, row: 0,
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
        id: 'react', name: 'React / Vue', col: 1, row: 3,
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
        id: 'build-tools', name: 'Build Tools', col: 5, row: 3,
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
    originCol: 13, originRow: 2,
    cols: 6, rows: 5,
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
        id: 'server-runtime', name: 'Server Runtime', col: 3, row: 0,
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
        id: 'auth', name: 'Auth & Identity', col: 5, row: 1,
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
        id: 'queues', name: 'Message Queues', col: 2, row: 3,
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
    originCol: 2, originRow: 9,
    cols: 7, rows: 5,
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
        id: 'nosql', name: 'NoSQL', col: 3, row: 0,
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
        id: 'schema-design', name: 'Schema Design', col: 5, row: 2,
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
    originCol: 13, originRow: 9,
    cols: 6, rows: 5,
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
        id: 'cicd', name: 'CI / CD', col: 3, row: 0,
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
        id: 'monitoring', name: 'Monitoring', col: 4, row: 3,
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
    originCol: 2, originRow: 16,
    cols: 6, rows: 4,
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
        id: 'integration-testing', name: 'Integration', col: 3, row: 0,
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
        id: 'e2e', name: 'E2E Testing', col: 4, row: 2,
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
    originCol: 10, originRow: 15,
    cols: 5, rows: 5,
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
        id: 'secrets', name: 'Secrets Mgmt', col: 3, row: 2,
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
    originCol: 21, originRow: 1,
    cols: 5, rows: 6,
    buildings: [
      {
        id: 'distributed', name: 'Distributed Systems', col: 0, row: 1,
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
        id: 'microservices', name: 'Microservices', col: 3, row: 3,
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
    originCol: 21, originRow: 9,
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
        id: 'caching', name: 'Caching', col: 3, row: 1,
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
    originCol: 17, originRow: 18,
    cols: 7, rows: 4,
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
        id: 'tech-strategy', name: 'Tech Strategy', col: 3, row: 0,
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
        id: 'communication', name: 'Communication', col: 5, row: 1,
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
