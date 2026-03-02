// app/data/city.ts

export interface Floor {
  level:  number;
  know:   string;   // what you can do at this level
  assume: string;   // what you wrongly believe — the heart of the humbling
  learn:  string;   // what's coming next
  prose:  string;   // "a day in the life" — expanded view
}

export interface Building {
  id:              string;
  name:            string;
  col:             number;  // position within district grid (0-indexed)
  row:             number;
  appearsAtLevel:  number;  // when this building fades in (defaults to district.appearsAtLevel)
  floorStartLevel: number;  // first floor with meaningful content; floors array starts here
  floors:          Floor[];  // entries from floorStartLevel to 5 only
}

export interface District {
  id:             string;
  name:           string;
  tagline:        string;
  type:           'technical' | 'non-technical';
  appearsAtLevel: number;
  originCol:      number;
  originRow:      number;
  cols:           number;
  rows:           number;
  buildings:      Building[];
}

export interface City {
  id:        string;
  name:      string;
  tagline:   string;
  districts: District[];
}

export const LEVEL_LABELS: Record<number, { title: string; tagline: string; narrative: string }> = {
  0: { title: 'The Magician',    tagline: 'You type words and software appears',                       narrative: `You have magic. You described an app to the AI and an app appeared. Every part of The Build feels the same from the outside: you ask, and the thing arrives. The city hasn't separated into neighborhoods yet because you haven't had a reason to distinguish between them. The wall is out there somewhere, invisible, and you haven't walked into it yet.` },
  1: { title: 'The Apprentice',  tagline: 'Something broke. The magic stopped working',                narrative: `Something broke in a way that re-prompting couldn't fix. The error message sat there and for the first time you read it. The defining shift: you stop treating the AI's output as a finished product and start treating it as a starting point you need to understand. You learn to read before you prompt. You give the agent direction instead of hope.` },
  2: { title: 'The Builder',     tagline: 'Shipping to real strangers changes everything',             narrative: `You ship consistently to real strangers. The code has to keep working for people who are not you, on infrastructure you don't fully control, after a deploy you can no longer manually reverse. Testing enters the picture not from discipline but from pain: you broke the same thing twice and wrote a test so it wouldn't happen a third time.` },
  3: { title: 'The Engineer',    tagline: 'Designing before building',                                 narrative: `You design before you build. You sketch the data model before writing the route. You think about failure modes before they occur. The AI is a tool with known limitations — you know when to use it and when its output needs significant revision.` },
  4: { title: 'The Founder',     tagline: "You woke up and realized this isn't a project anymore",    narrative: `You woke up and the project had become a system. Other people depend on it. Decisions you make ripple through a team. The architecture you chose shapes what others can build. You've started to say "I don't know" with confidence — because knowing what you don't know is how you stop making expensive mistakes.` },
  5: { title: 'The Leader',      tagline: 'The system has to work without you',                       narrative: `The humbling is complete. Not because you've seen everything — but because you now know how much there is to keep learning. You've shaped teams, contributed to standards, made calls that mattered. The city is yours. And you know it keeps growing.` },
};

const LEVEL_TITLES = [
  'The Magician', 'The Apprentice', 'The Builder',
  'The Engineer', 'The Founder', 'The Leader',
];

// Generate placeholder floors from floorStartLevel to 5
// Pass overrides as an array indexed from 0 (= floorStartLevel)
function makeFloors(
  floorStartLevel: number,
  overrides: Partial<Floor>[] = [],
): Floor[] {
  const floors: Floor[] = [];
  for (let i = floorStartLevel; i <= 5; i++) {
    const idx = i - floorStartLevel;
    floors.push({
      level:  i,
      know:   `[know — L${i} ${LEVEL_TITLES[i]}]`,
      assume: `[assume — L${i}]`,
      learn:  `[learn — L${i}]`,
      prose:  `[prose — L${i}]`,
      ...overrides[idx],
    });
  }
  return floors;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB / FULL-STACK CITY
// ─────────────────────────────────────────────────────────────────────────────

export const webCity: City = {
  id:      'web',
  name:    'Web / Full-Stack',
  tagline: 'From browser to database — the full stack',
  districts: [

    // ── L0 ──────────────────────────────────────────────────────────────────

    {
      id: 'the-build',
      name: 'The Build',
      tagline: 'Everything a working app needs, conjured in a weekend.',
      type: 'technical',
      appearsAtLevel: 0,
      originCol: 2, originRow: 2,
      cols: 14, rows: 6,
      buildings: [

        // ── Frontend (UI Components) ─────────────────────────────────────────
        {
          id: 'frontend', name: 'Frontend',
          col: 0, row: 0, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `You can prompt the AI to generate complete page layouts, navigation bars, card grids, modals, and forms. You describe the interface in plain English and it appears. You can iterate: change the color, round the corners, swap the icons.`,
              assume: `Components are visual blocks the AI arranges for you. Code that looks right is right. The files behind the interface are implementation details you don't need to open.`,
              learn:  `The first time state needs to pass between two components that aren't adjacent, the AI starts producing conflicting answers — because you've never looked at how data moves through the component tree.`,
              prose:  `You prompted the AI to build a dashboard with a sidebar, a header, and a card grid, and sixty seconds later it was on your screen. You tweaked the accent color twice, asked for rounded corners, and swapped the icon library. When a friend asks how you built it, you shrug and say you described it. The code lives in files you've never opened.`,
            },
            {
              // L1 — The Apprentice
              know:   `You understand that layout breaks for specific reasons — a missing flex property, a fixed width that doesn't scale, a z-index conflict. You can open the browser inspector, select an element, and see what CSS rules are applied.`,
              assume: `If you can see the problem in the browser, you understand it. Layout bugs are CSS typos — small, isolated mistakes.`,
              learn:  `Layout is a system. The box model, document flow, and stacking context determine where elements end up — and changing one property without understanding the system produces a different problem in a different place.`,
              prose:  `The sidebar overlapped the content on mobile. You opened the inspector for the first time and saw the element had position: absolute with a hardcoded pixel width. You described what you saw to the AI: "this element has position absolute and a width of 320px, and it's covering the content on small screens." It explained and suggested a fix. The sidebar moved. Then the footer disappeared. You were still playing whack-a-mole — but at least you were reading the board.`,
            },
            {
              // L2 — The Builder (placeholder — not in doc)
              know:   `[know — L2 The Builder]`,
              assume: `[assume — L2]`,
              learn:  `[learn — L2]`,
              prose:  `[prose — L2]`,
            },
            {
              // L3 — The Engineer
              know:   `Understand the browser security model — Content Security Policy headers, subresource integrity, the same-origin policy and exactly what it does and does not protect. Evaluate a frontend architecture for data exposure.`,
              assume: `Securing the API is enough — if the backend validates and authorizes correctly, it doesn't matter what the frontend exposes.`,
              learn:  `The frontend is a published document. Anything you ship to the browser is readable: API keys baked into the build, internal route structures, feature flag logic, and business rules encoded in client-side validation.`,
              prose:  `You spend an afternoon locking down the API — rate limiting, RBAC at the resource level, contract tests in CI. Then a colleague opens the network tab during a demo and shows you that every API response includes internal user IDs, creation timestamps, and two fields marked "internal_only" in the database schema. The frontend isn't doing anything wrong with them. But they're there, in every response, readable to anyone who can open DevTools.`,
            },
            {
              // L4 — The Founder (placeholder — not in doc)
              know:   `[know — L4 The Founder]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              // L5 — The Architect (placeholder — not in doc)
              know:   `[know — L5 The Architect]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]`,
            },
          ]),
        },

        // ── JavaScript ───────────────────────────────────────────────────────
        {
          id: 'javascript', name: 'JavaScript',
          col: 4, row: 0, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `You can prompt the AI to add any behavior: click handlers, form validation, data fetching. You know JavaScript is "the language of the web" and that it runs in the browser somewhere inside the files you've never opened.`,
              assume: `JavaScript is one thing — a single language that behaves the same everywhere. Errors are prompting problems, not code problems. If the behavior works when you click through the app, the code is correct.`,
              learn:  `An error appears referencing a "promise" or "undefined is not a function," and the AI offers three different fixes that each break something else. There is a layer beneath "it works when I click it."`,
              prose:  `You asked the AI to make the Save button write the form data and display a success toast. It did. You asked it to show a loading spinner during the save. It did that too. You have no idea whether the code uses async/await or callbacks. The test is: you clicked the button and it worked. You ran it once.`,
            },
            {
              // L1 — The Apprentice
              know:   `You can read code the AI wrote and follow the basic flow — functions, variables, conditionals, loops. You have encountered async/await and understand at a surface level that some operations take time.`,
              assume: `If you can read the code line by line, you understand what it does. That await means "wait for this to finish" and that is the complete story.`,
              learn:  `JavaScript has hidden mechanics — the event loop, closures, reference versus value semantics — that determine behavior in ways you cannot see by reading linearly.`,
              prose:  `The data was always one step behind. You clicked a button, nothing happened, you clicked again, and the previous result appeared. You learned to describe the symptom precisely: "the state is stale after the async call — I'm always seeing the previous value." That description alone was enough for the agent to identify a closure bug and fix it in one pass.`,
            },
            {
              // L2 — The Builder
              know:   `Write async/await code correctly without common pitfalls, work with ES modules and named exports confidently, and compose data transformations with built-in array methods.`,
              assume: `You understand closures because you use them — that familiarity is the same as comprehension.`,
              learn:  `The JavaScript memory model, the event loop in depth beyond the conceptual diagram, and how the engine optimizes hot code paths.`,
              prose:  `I write async code that actually works. I chain .map() and .filter() without thinking twice. But I just spent two hours on a bug where a variable inside a loop held the wrong value across iterations — a closure had captured it by reference, not by value. I described the bug to the AI and it fixed it, but I still couldn't fully explain why it happened.`,
            },
            {
              // L3 — The Engineer
              know:   `Understand the event loop deeply enough to diagnose why a specific pattern blocks rendering, why a microtask queue can starve macrotasks. Read a memory profile and identify a leak.`,
              assume: `Understanding async/await means understanding concurrency — that if the code doesn't have race conditions in tests, it doesn't have them in production.`,
              learn:  `The event loop is deterministic in isolation and non-deterministic under load. Leak patterns — closures holding references, event listeners that outlive their components — only manifest at scale.`,
              prose:  `You profile the server-side rendering path and find it clean. Median response time is 80ms. Then load testing shows that at 500 concurrent requests, p99 climbs to 4 seconds. You attach a memory profiler and find a closure inside a request handler holding a reference to a parsed configuration object — instantiated fresh on every request, never released, growing the heap until the GC pauses long enough to be visible in tail latency.`,
            },
            {
              // L4 — The Founder (placeholder — not in doc)
              know:   `[know — L4 The Founder]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              // L5 — The Architect
              know:   `Understand V8 engine internals — how the JIT compiler optimizes, how GC pressure affects tail latency at scale. Read the ECMAScript specification. Evaluate TC39 proposals — not just their usefulness but their ecosystem readiness, tooling compatibility, and team adoption cost.`,
              assume: `Deep language knowledge directly translates to better team output. JavaScript's well-documented quirks are the primary technical risk in a large JavaScript codebase.`,
              learn:  `The biggest risk in a large JavaScript codebase is not the language itself — it is the ecosystem churn surrounding it. Bundlers, transpilers, frameworks, and tooling change faster than the language does.`,
              prose:  `A TC39 proposal hits Stage 3 and the team is energized. You read the full specification text, prototype it against your actual codebase, and find an edge case with the current bundler version that produces silent incorrect output under a specific transform. You write a two-page internal note: "We will adopt this in Q3 when tooling stabilizes. Here is what to use in the meantime, and here is exactly what to watch for when we migrate." Nobody on the team has to make that decision themselves. Nobody discovers the edge case at midnight before a release.`,
            },
          ]),
        },

        // ── REST API ─────────────────────────────────────────────────────────
        {
          id: 'rest-api', name: 'REST API',
          col: 8, row: 0, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `You can prompt the AI to create endpoints — "make a route that returns the user's projects" or "add a POST endpoint for creating a new item." You know the frontend calls URLs and that the AI wired the two sides together.`,
              assume: `APIs are plumbing the AI handles uniformly. Security, input validation, and error handling are things the AI takes care of automatically. If the frontend gets what it needs, the API is finished.`,
              learn:  `You add a delete-user feature and realize there is nothing stopping an unauthenticated request from calling that endpoint. The plumbing has no locks, and the AI scaffolded it without mentioning that locks were your responsibility.`,
              prose:  `You described to the AI what your app needed to do and it scaffolded twelve endpoints in under a minute. You have never opened a REST client, never sent a request directly to an endpoint, never asked what happens if someone submits malformed JSON. The data arrives, the page populates, and it works.`,
            },
            {
              // L1 — The Apprentice
              know:   `You can read an HTTP error response and understand what the status code means. You know 404 is "not found," 401 is "unauthorized," and 500 is "something broke on the server." You give the AI specific direction about what is wrong rather than pasting the full error back.`,
              assume: `Understanding status codes means you understand how APIs work. That every API failure is a backend bug. That the request itself is probably correct.`,
              learn:  `Many API failures are about request shape, not server behavior — wrong headers, missing auth tokens, malformed payloads. The client is frequently the source of the problem.`,
              prose:  `The app returned a blank screen. You opened the network tab for the first time and saw a 401 on the API request. You didn't paste it back into the chat. You told the agent: "the auth token is not being sent in the request header." That was the first time you diagnosed the category of a problem before asking for help.`,
            },
            {
              // L2 — The Builder
              know:   `Follow REST conventions rigorously, write middleware for cross-cutting concerns, validate inputs with schemas, and return consistent error shapes across all endpoints.`,
              assume: `REST is always the right choice — that every data access problem is a request/response problem.`,
              learn:  `API versioning strategies, rate limiting patterns, cursor-based pagination, and the specific classes of problems where GraphQL or another pattern is a better fit than REST.`,
              prose:  `My API is predictable and my errors have structure. Consumers can rely on consistent shapes. But I have never versioned an endpoint — when the mobile app needed a different payload shape than the web app, I added a query parameter and hoped nobody noticed.`,
            },
            {
              // L3 — The Engineer
              know:   `Implement rate limiting with per-consumer quotas, cursor-based pagination that handles concurrent mutations, and contract tests that catch breaking changes before they reach CI. Generate client SDKs from an OpenAPI spec.`,
              assume: `A well-documented, well-tested API is a stable API — that contract tests and rate limiting are sufficient to keep the system healthy under real consumer behavior.`,
              learn:  `APIs are social contracts. The hardest problems are not technical: they are the versioning strategy when you have 50 consumers, the deprecation timeline your sales team promised, and the undocumented query parameter three mobile clients depend on from a hotfix two years ago.`,
              prose:  `You add per-consumer rate limiting after a partner integration hammers the API at ten times projected volume. You write contract tests. You generate TypeScript and Python SDKs automatically from the spec. It feels bulletproof. Then the same partner ships a new version of their client that retries every 429 with no backoff and a retry interval of one second. Your rate limiter becomes the signal that coordinates a synchronized retry storm.`,
            },
            {
              // L4 — The Founder (placeholder — not in doc)
              know:   `[know — L4 The Founder]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              // L5 — The Architect (placeholder — not in doc)
              know:   `[know — L5 The Architect]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]`,
            },
          ]),
        },

        // ── Server Runtime ───────────────────────────────────────────────────
        {
          id: 'server-runtime', name: 'Server Runtime',
          col: 11, row: 0, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `You know your app runs somewhere — npm run dev on your laptop, or deployed to Vercel or Railway after following the AI's one-command instructions. The terminal said "ready on localhost:3000" and that's your server.`,
              assume: `The server is just "on" or "off." Local and production are the same environment — if it works on your machine, it works everywhere.`,
              learn:  `The app crashes in production with an error about environment variables or memory, and you realize the server is not your laptop. It is a process running somewhere else, with different rules, different secrets, and different constraints.`,
              prose:  `You ran npm run dev and saw "ready on localhost:3000." You deployed to Vercel because the AI told you to run one command. You have a live URL. You've never SSH'd into a machine, never looked at what a process actually is, never considered what would happen if a hundred people loaded your app simultaneously. Right now four people have, and it's fine.`,
            },
            {
              // L1 — The Apprentice
              know:   `You understand that the server is a running process. You know it can crash, that it produces logs, and you have read a log file to find a specific error message.`,
              assume: `If the server starts, it is healthy. That crashes are random and require restarting.`,
              learn:  `Servers crash for specific, traceable reasons — unhandled exceptions, memory leaks, port conflicts, missing environment variables. Logs record exactly what happened.`,
              prose:  `The server crashed at 2am. You restarted it. It crashed again. This time you read the log. The message said "EADDRINUSE: port 3000." You described it to the AI. It told you another process was already holding the port. You ran lsof -i :3000, killed the zombie process, and the server stayed up. It was the first time you fixed something without asking the AI to fix it for you.`,
            },
            {
              // L2 — The Builder (placeholder — not in doc)
              know:   `[know — L2 The Builder]`,
              assume: `[assume — L2]`,
              learn:  `[learn — L2]`,
              prose:  `[prose — L2]`,
            },
            {
              // L3 — The Engineer
              know:   `Run clustered processes with graceful shutdown sequences that drain in-flight requests before exiting. Instrument health checks that distinguish between a process that is alive and a process that is healthy.`,
              assume: `Clustering and graceful restarts make the runtime resilient — that if a worker dies and the others keep serving traffic, the system is handling failure correctly.`,
              learn:  `Redundancy is not resilience. A half-dead process that passes health checks is more dangerous than a crashed one, because it receives traffic it cannot serve.`,
              prose:  `You configure four workers behind the cluster module. One crashes on an unhandled rejection and restarts within two seconds. The other three keep serving traffic. Then you notice the crashed worker held 200 WebSocket connections, and all 200 clients reconnected simultaneously. The reconnection storm overwhelms the newly restarted worker. It crashes again. Within ninety seconds, all four workers are cycling. Your redundancy created the failure condition.`,
            },
            {
              // L4 — The Founder (placeholder — not in doc)
              know:   `[know — L4 The Founder]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              // L5 — The Architect (placeholder — not in doc)
              know:   `[know — L5 The Architect]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]`,
            },
          ]),
        },

        // ── Database ─────────────────────────────────────────────────────────
        {
          id: 'database', name: 'Database',
          col: 1, row: 3, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `You can prompt the AI to store and retrieve any kind of data. It chose a database, generated a schema, and your app can now create, read, update, and delete records. Data survives when you close the browser.`,
              assume: `The database is just a save file for the app. The AI designed the schema so the schema is correct. You don't need to think about it any more than you think about the filesystem when you save a Word document.`,
              learn:  `You try to add a feature that relates users to projects and the AI generates a schema migration that drops your existing data. Or the page starts loading slowly and you learn the table has no indexes. The save file has internal structure you never looked at.`,
              prose:  `You told the AI to store the user's projects in a database and it created tables you've never seen. When you click Save a row appears; when you load the dashboard the rows come back. You've never opened a database console. You have fourteen rows. It's working.`,
            },
            {
              // L1 — The Apprentice
              know:   `You have read SQL for the first time. You understand what SELECT, FROM, and WHERE do at a basic level. You have looked at the schema and understood that a table has columns and rows.`,
              assume: `The database is just a place where data goes. If the ORM is working, the underlying queries must be fine.`,
              learn:  `The schema is a contract. Changing it without a migration plan breaks running applications. The shape of your data determines what your application can and cannot do efficiently.`,
              prose:  `The app was slow. You opened the database GUI for the first time and looked at the users table — 50,000 rows. The AI had written a query that loaded all of them to find one matching record. You added a WHERE clause yourself, directed by the AI. It was the first SQL you had ever written intentionally. The page loaded in 200ms instead of 12 seconds.`,
            },
            {
              // L2 — The Builder
              know:   `Create indexes based on actual query patterns, write transactions for multi-step operations, and read query execution plans before deploying new queries to production.`,
              assume: `Adding an index is always a safe, net-positive optimization — more indexes, more speed.`,
              learn:  `Write amplification — the cost of indexes on INSERT and UPDATE operations. That schema changes on large tables are operational risks that require careful migration strategies.`,
              prose:  `I check execution plans before deploying new queries. I add indexes with a reason rather than as a precaution. But I've never thought about write amplification — that every index I add slows down every INSERT on that table. My latest migration added a column to a table with 2 million rows during peak traffic hours.`,
            },
            {
              // L3 — The Engineer
              know:   `You can read a query execution plan and know what you are looking at: sequential scans versus index scans, join strategies, estimated versus actual row counts. You create indexes based on measured access patterns, not intuition.`,
              assume: `Indexes solve performance problems — that once the slow query has an index and the execution plan looks clean, the database is healthy.`,
              learn:  `Indexes have write costs. Every index on a table is updated on every INSERT, UPDATE, and DELETE. Query plans change as data distribution changes. The discipline is understanding access patterns holistically, not optimizing one query at a time.`,
              prose:  `You run EXPLAIN ANALYZE on the slow query and find a sequential scan on a two-million-row table. You add a composite index and the query drops from four seconds to twelve milliseconds. A month later, write throughput has dropped thirty percent. You investigate and find the table now has nine indexes — three added in the last quarter, two of which the planner never selects. You optimized one read. You degraded every write.`,
            },
            {
              // L4 — The Founder
              know:   `Design for replication at scale: route read-heavy workloads to read replicas, manage connection pool sizing across multiple application instances, and understand the trade-off between eventual consistency on replicas and strong consistency on the primary.`,
              assume: `A well-indexed database scales indefinitely. If the query plan is good and the indexes are correct, the database can handle anything.`,
              learn:  `At scale, the database is a shared resource with physical limits: maximum connections, I/O throughput, and lock contention. Connection exhaustion and replication lag are the failures that well-indexed queries do not prevent.`,
              prose:  `My primary database was hitting 80% CPU during peak hours. I added a read replica and routed all analytics queries to it. The primary recovered. Two days later, a customer opened a support ticket saying they'd been double-charged — they could see two payments in their dashboard. One of them was a payment that had settled but hadn't yet replicated to the replica they were reading from. I had learned the difference between eventual and strong consistency in production, with a real customer's money.`,
            },
            {
              // L5 — The Architect
              know:   `Set data architecture strategy across the organization — when to use relational versus document versus graph, how schemas evolve safely across service boundaries, when denormalization is a feature and when it is a liability. Define the canonical data models for core domain concepts — user, organization, order, event.`,
              assume: `A clear, well-documented data architecture strategy prevents teams from making independently bad data decisions. That data modeling is a competency every team can apply independently to their own domain.`,
              learn:  `The hardest data problem at scale is not technical — it is organizational. Two teams with divergent data models for the same business concept will eventually produce a consistency crisis that no migration tool can fully resolve.`,
              prose:  `Two product teams independently modeled the concept of "user" — one has a single flat table, the other split user identity from profile. Both shipped. Both work in isolation. Now a third team needs to join across both datasets to build a cross-product feature. You sit in a room for two hours with both data owners and come out with a canonical user model, a migration plan, and an honest six-month timeline. The migration is painful — more painful than anything in the spec. But it is less painful than what happens when a fourth team ships a third model without knowing the other two exist.`,
            },
          ]),
        },

        // ── Auth ─────────────────────────────────────────────────────────────
        {
          id: 'auth', name: 'Auth',
          col: 5, row: 3, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `You can prompt the AI to add login and signup. It wired up an auth provider or built a basic email/password flow. Users can create accounts, log in, and see their own data. There is a page that only appears after authentication.`,
              assume: `Auth is a feature you bolt on, and the AI handles it the same way it handles any other feature. If users can log in and the dashboard only appears after login, authentication is complete.`,
              learn:  `You realize you never checked what happens when someone changes the user ID in a URL directly. Or that the "protected" dashboard is only protected in the browser — the API endpoint behind it returns data to anyone who sends a request.`,
              prose:  `You told the AI to add authentication and it set up a GitHub OAuth flow in about four minutes. You can log in, your name appears in the corner, and the dashboard only shows up after login. Your mental model of security is: when you log out, the dashboard disappears. So far, for you, it always does.`,
            },
            {
              // L1 — The Apprentice
              know:   `You understand that your app has a login system and that something is wrong with how it was set up. You have started to learn the difference between sessions and tokens.`,
              assume: `If users can log in and log out successfully, auth is working correctly. That functional login means secure login.`,
              learn:  `Auth has invisible failure modes — tokens that never expire, sessions that aren't invalidated on logout, cookies without security flags.`,
              prose:  `You logged out of your own app. Then you opened an incognito window, pasted the old URL with the token still in the address bar, and you were still logged in. The token had no expiry. The AI hadn't added one. You realized you would not have caught it if you had not tested it yourself.`,
            },
            {
              // L2 — The Builder
              know:   `Implement secure cookie-based sessions, hash passwords with bcrypt at the correct cost factor, and articulate the difference between authentication and authorization.`,
              assume: `Implementing an OAuth flow means they understand identity — that copying a working integration is equivalent to understanding the protocol.`,
              learn:  `The full OAuth 2.0 and OIDC flows, token refresh strategies, and role-based access control implemented as an enforcement layer rather than a check at the call site.`,
              prose:  `Passwords are hashed. Sessions use HttpOnly cookies. The basics are sound. But I described the OAuth flow to the AI and wired up what it produced without reading the spec — it works, but I couldn't explain why. My admin check is user.role === "admin" in every endpoint that needs it, with no centralised enforcement layer.`,
            },
            {
              // L3 — The Engineer
              know:   `Implement the full OAuth 2.0 and OIDC flows — authorization code with PKCE, token refresh with rotation, revocation endpoints — and enforce authorization at the resource level, not only at the route level.`,
              assume: `A correct OAuth implementation means auth is done — that the protocol is comprehensive enough to handle the edge cases.`,
              learn:  `The hard problems are in the session lifecycle: tokens that outlive the device that holds them, refresh tokens that can be replayed if intercepted, and revocation that only works if every client actually calls the endpoint when it should.`,
              prose:  `You implement the full OAuth dance — authorization code flow with PKCE, silent refresh, a revocation endpoint. It passes every test. Then a user reports they can still access their account from a tablet they returned to their employer two weeks ago. Token: thirty-day expiry, issued to the tablet's client ID. Revocation only works if the client calls it. A returned device never does.`,
            },
            {
              // L4 — The Founder
              know:   `Harden authentication at scale: implement brute-force protection, rate-limit login attempts, enforce session expiration and rotation policies, and audit authentication events to detect anomalous access patterns.`,
              assume: `Authentication is solved once it's built correctly — a well-implemented JWT flow or OAuth integration doesn't need ongoing attention.`,
              learn:  `Authentication is an ongoing operational concern, not a one-time implementation. Credential stuffing attacks, session fixation, and token leakage through logs are not theoretical — they are the specific ways real systems get compromised.`,
              prose:  `I woke up to an email from a user saying their account had been accessed from an IP address they didn't recognize. I had no audit log, no login event history, no anomaly detection. I couldn't tell them what happened, when it happened, or how many other accounts might be affected. I spent three days adding authentication event logging, rate limiting on login endpoints, automatic session invalidation on password change, and writing to every user about what I knew and what I didn't. That email was the hardest thing I'd written in a year.`,
            },
            {
              // L5 — The Architect
              know:   `Design identity systems across products and organizational boundaries. Set auth standards for the organization — how tokens are issued, scoped, rotated, and revoked. Evaluate identity protocols — OAuth 2.1, passkeys, FIDO2, SAML — and make adoption decisions based on security posture, UX impact, and team capability.`,
              assume: `A unified, well-designed identity platform solves auth for the organization. If the primitives are cryptographically sound and well-documented, the implementations built on top of them will be secure by default.`,
              learn:  `Auth failures are almost never cryptographic. They are integration failures — the gap between what the identity platform was designed to do and what the product team understood about how to use it.`,
              prose:  `A product team accidentally exposes user session tokens in URL parameters during an OAuth redirect flow. Your identity platform is sound — this is an integration mistake, not a platform vulnerability. You fix the immediate issue and then build a CI linter that catches common token exposure patterns. You add a section to the internal auth guide titled "What not to do with tokens," using this incident — anonymized — as the worked example. The platform was never the problem. The space between the platform and the people who use it was.`,
            },
          ]),
        },

        // ── Debugging ────────────────────────────────────────────────────────
        {
          id: 'debugging', name: 'Debugging',
          col: 9, row: 3, appearsAtLevel: 0, floorStartLevel: 0,
          floors: makeFloors(0, [
            {
              // L0 — The Magician
              know:   `When something breaks, you can paste the error message into the AI and receive a fix. You describe the symptoms in plain English and the AI suggests changes. You have a loop: break, paste, patch, continue.`,
              assume: `Debugging is re-prompting until the error goes away. If the AI can't fix something in a few attempts, the right move is to rewrite that section. Error messages are raw material you feed the AI — reading them yourself wouldn't add anything.`,
              learn:  `You hit a bug where the AI cycles through fixes and each one introduces a new error. For the first time, you read the error message yourself — fully, slowly — and it tells you exactly what is wrong. The AI was generating guesses. The error message was a precise description of the failure all along.`,
              prose:  `The page went blank. You copied the red text from the browser console and pasted it into the AI. It said to change the import. You did. New error. You pasted that one too. Third patch, it worked. You don't know what was actually wrong — only that the red text is gone. Your debugging workflow is: describe the symptom, apply the patch, check whether the red disappears. Today it took five prompts and about eight minutes.`,
            },
            {
              // L1 — The Apprentice
              know:   `You can read an error message and understand what category of problem it describes — a syntax error, a null reference, a network failure, a missing dependency.`,
              assume: `Debugging is about finding the one broken line. That errors are isolated incidents. That the stack trace points to the source of the problem.`,
              learn:  `Most bugs are symptoms of a deeper misunderstanding. The error is on line 47, but the decision that caused it was made on line 12.`,
              prose:  `The error said "Cannot read properties of undefined." You used to paste that directly into the chat. This time you read the stack trace. It pointed to a function that expected a user object, but the API call above it had failed silently and returned nothing. You told the agent: "the API call on line 12 is not returning data, so the function on line 47 crashes." It fixed both issues in one response.`,
            },
            {
              // L2 — The Builder (placeholder — not in doc)
              know:   `[know — L2 The Builder]`,
              assume: `[assume — L2]`,
              learn:  `[learn — L2]`,
              prose:  `[prose — L2]`,
            },
            {
              // L3 — The Engineer
              know:   `Practice systematic root cause analysis: reproduce before you hypothesize, use profilers and distributed traces rather than log archaeology, and distinguish between the symptom, the proximate cause, and the root cause.`,
              assume: `Finding and fixing the root cause means the bug is resolved — that understanding why it broke is equivalent to preventing it from breaking again.`,
              learn:  `The root cause is often a missing guardrail. The complete fix is not the patch; it is the test that would have caught it, the alert that would have surfaced it earlier, and the process or architectural change that eliminates the class of failure.`,
              prose:  `A user reports data corruption — two records merged where they should have been separate. You pull the traces, reproduce it locally, and find a race condition in the cache invalidation path. You fix the timing with a lock, write a regression test, and close the ticket. Two weeks later, the same corruption report comes in from a different part of the system — a different cache path, the same structural assumption about read-modify-write being atomic. You fixed the bug. You left the pattern intact.`,
            },
            {
              // L4 — The Founder
              know:   `Trace requests across distributed services using correlation IDs and structured logs. Debug failures that only manifest under load or in specific timing windows. Write post-mortems that identify systemic causes rather than the individual decision that triggered the failure.`,
              assume: `Any bug can be reproduced with enough effort — if you can't reproduce it locally, you haven't tried hard enough.`,
              learn:  `Some bugs only exist at production scale, under real timing conditions, in the interaction of two services that each work correctly in isolation. The skill at L4 is building enough observability that you can diagnose a failure from the traces it left behind.`,
              prose:  `A user reported that checkout failed "sometimes." No error message, no pattern, just sometimes. I couldn't reproduce it. I added distributed tracing with correlation IDs across the inventory and payment services and waited three days. I caught it: a race condition that only triggered when both services responded within two milliseconds of each other — a window that existed constantly in production and never in my local environment. I fixed it with an optimistic lock. I would never have found it with a debugger.`,
            },
            {
              // L5 — The Architect (placeholder — not in doc)
              know:   `[know — L5 The Architect]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]`,
            },
          ]),
        },

      ],
    },
// ── L1 ──────────────────────────────────────────────────────────────────────

    {
      id: 'the-craft',
      name: 'The Craft',
      tagline: 'Real tools, picked up out of necessity.',
      type: 'technical',
      appearsAtLevel: 1,
      originCol: 2, originRow: 9,
      cols: 9, rows: 5,
      buildings: [
        {
          id: 'version-control', name: 'Version Control',
          col: 0, row: 0, appearsAtLevel: 1, floorStartLevel: 1,
          floors: makeFloors(1, [
            {
              know:   'You can commit, push, and create a branch — mostly through a GUI or by following step-by-step instructions from the AI. You know that something called a "history" exists and that it\'s supposed to be useful.',
              assume: 'That Git is a save button. You commit when it feels right, not because the commit represents a coherent, isolated change. You assume "undo" in Git works like Ctrl-Z.',
              learn:  'What a commit actually records. What a branch isolates. Why reverting in Git is a specific, deliberate operation — not a simple undo — and why that distinction matters when your main branch is broken.',
              prose:  'You were working on two features at the same time. One broke the other. You lost an afternoon trying to reconstruct what changed. Someone told you to use Git. Now you commit before every significant change — not because you understand the graph, but because you learned the hard way that work disappears if you don\'t.',
            },
            {
              know:   'Create branches for features and fixes, write commit messages that describe what changed, resolve merge conflicts without fear, and open pull requests with enough context for a reviewer.',
              assume: 'That rebasing and merging are interchangeable — two ways of combining branches that produce equivalent results with different aesthetics.',
              learn:  'The difference between rebase and merge and when each is appropriate, interactive rebase for cleaning up a branch before it is reviewed, and the reflog as a recovery mechanism.',
              prose:  'You work in branches and review your own diff before pushing. Merge conflicts don\'t make you panic anymore. But your commit history reads "fix", "fix 2", "actually fix" — when you need to find which commit introduced a bug, `git log` is useless.',
            },
            {
              know:   'Enforce code review as a gate before merge, protect the main branch from direct pushes, and establish conventions — commit message formats, branch naming schemes, PR templates — that make a growing team\'s history navigable.',
              assume: 'That good process prevents bad merges — that if reviews are required and main is protected, the codebase will stay clean.',
              learn:  'Process without culture is theater. The PR that gets an approving comment in thirty seconds was not reviewed. The branch protection that every senior engineer can bypass with an admin override is not protection.',
              prose:  'You set up branch protection on main, require two approvals before merge, and add a PR template with a testing checklist. The first month is disciplined — reviewers leave substantive comments. By the third month, PRs are getting two approvals in under two minutes. The checklist is checked before the description is finished. Main is protected. The protection is not.',
            },
            {
              know:   `[know — L4 Senior / Staff]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              know:   'Define the branching strategy and release culture for the organization. Make the call between trunk-based development and feature branches based on team size, release cadence, deployment confidence, and the maturity of the test suite — not based on what the latest blog post recommends.',
              assume: 'That the correct branching model is a universal best practice. That trunk-based development is always technically superior to feature branches.',
              learn:  'Branching strategy is a reflection of team trust and release confidence, not a cause of it. The organization that cannot do trunk-based development has a testing problem or a deployment confidence problem — not a Git problem.',
              prose:  `A team maintains long-lived feature branches that take three to four weeks to merge. You could mandate trunk-based development as policy. Instead you ask why the branches stay open so long. The answer: CI takes forty-five minutes, rebasing against main is operationally painful, and merging with a broken test suite visible to everyone feels embarrassing. You fix the pipeline first — parallel test execution, better caching, twelve-minute runs. You add a flaky-test badge so broken tests are acknowledged rather than hidden. Trunk-based development becomes the natural behavior three weeks after the pipeline improves. Nobody needed a new policy. They needed a fast build and a safe place to fail.`,
            },
          ]),
        },
        {
          id: 'terminal', name: 'Terminal & Shell',
          col: 4, row: 0, appearsAtLevel: 1, floorStartLevel: 1,
          floors: makeFloors(1, [
            {
              know:   'You can open a terminal, run commands the AI told you to run, navigate directories, and read output. You know `cd`, `ls`, `npm install`, `npm run dev`. You can tell when a command succeeded and when it failed.',
              assume: 'That the terminal is just a text version of clicking buttons — that anything important has a graphical interface somewhere. That pasting a command and running it means you understand what the command did.',
              learn:  'That the terminal is where real debugging happens. Logs, running processes, environment variables, file permissions — none of this has a reliable GUI. The terminal is not a preference. It is where the machine tells you what it is actually doing.',
              prose:  `The AI said run this command. You described the situation and it gave you the command. You ran it. It failed. The error mentioned a missing environment variable, but you didn't know what that meant because you had never looked at a .env file. You opened the terminal for real that day — not to paste a command, but to look.`,
            },
            {
              know:   `[know — L2 AI-Assisted Builder]`,
              assume: `[assume — L2]`,
              learn:  `[learn — L2]`,
              prose:  `[prose — L2]`,
            },
            {
              know:   'Write shell scripts that are defensible: they use `set -euo pipefail`, they validate inputs before acting on them, they handle the case where the file doesn\'t exist or the command fails.',
              assume: 'That shell scripts that work locally are shell scripts that work in CI — that if the command runs correctly in your terminal, it will run correctly everywhere.',
              learn:  'Shell scripts accumulate assumptions: that a command is on PATH, that a file exists, that a variable is set, that the exit code means what you think it means. Defensive scripting is not paranoia — it is the difference between an automation that runs and an automation that runs correctly.',
              prose:  `You write a deployment script that archives the build artifacts, uploads them to the storage bucket, and notifies the monitoring service. It works perfectly in your terminal. You commit it and it runs in CI — until a new runner image doesn't have the archiving tool on PATH. The script fails silently on the archive step because you piped the output to a log file and swallowed the exit code. The upload runs anyway with a zero-byte artifact. The notification fires. The deploy reports success. Nothing was deployed.`,
            },
            {
              know:   `[know — L4 Senior / Staff]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              know:   'Build the internal tooling and automation that other engineers rely on every day — deployment helpers, data migration utilities, environment setup scripts, service scaffolding generators. Your scripts are the connective tissue between systems. You write CLI tools that fail informatively, validate their own inputs, and protect against the most common operational mistakes.',
              assume: 'That a well-documented CLI tool does not need good error messages — the README covers the edge cases. That engineers will read documentation before running commands in an unfamiliar environment.',
              learn:  'Internal tools are production software. A cryptic error message at 2am during an active incident is a production bug with a human cost.',
              prose:  `You wrote an internal deployment script that the team runs fifty times a week. It works reliably until someone passes a service name with a minor typo and receives "exit code 1" as the complete error message. You add input validation, fuzzy matching for service names against the known service registry, and a --dry-run flag. The next engineer who fat-fingers a service name sees: "Did you mean 'payments-service'? Run with --dry-run to preview." Internal tooling deserves the same design care as the software you ship to customers. Your colleagues are your users.`,
            },
          ]),
        },
        {
          id: 'code-quality', name: 'Code Quality',
          col: 2, row: 3, appearsAtLevel: 1, floorStartLevel: 1,
          floors: makeFloors(1, [
            {},
            {},
            {},
            {},
            {
              know:   'Shape the organization\'s code quality culture — what gets enforced in CI, what lives in the linter, what is codified in review guidelines, and what is left to team judgment. Know the difference between style (enforce automatically, argue about never) and design (review carefully, argue about productively).',
              assume: 'That a strict, well-configured linting and formatting setup produces a high-quality codebase over time. That once standards are codified and enforced, the quality culture sustains itself.',
              learn:  'Code quality culture requires active maintenance. Standards drift, enforcement gaps accumulate, and new engineers internalize the actual norms — not the documented ones — from the code they read on day one.',
              prose:  `The linter is configured, the formatter runs on save, the review guidelines are published. Six months later, a new engineer's PR reveals a pattern of deeply nested conditional logic that is technically correct and passes all checks, but is impossible to reason about under time pressure. You trace it through the codebase and find it in forty files — all written in the last six months, all reviewed and approved. You add "control flow legibility" to the review checklist with two examples — one showing the pattern, one showing the refactored version. The next month's PRs look different.`,
            },
          ]),
        },
      ],
    },

    {
      id: 'security',
      name: 'Security',
      tagline: `Security hits before you're ready.`,
      type: 'technical',
      appearsAtLevel: 1,
      originCol: 12, originRow: 9,
      cols: 8, rows: 6,
      buildings: [
        {
          id: 'vulnerabilities', name: 'Vulnerabilities',
          col: 0, row: 0, appearsAtLevel: 1, floorStartLevel: 1,
          floors: makeFloors(1, [
            {
              know:   'You have heard of security vulnerabilities as a concept. You may have seen `npm audit` output. You know that AI-generated code is sometimes described as insecure, but you don\'t know how to identify which code is unsafe.',
              assume: 'That the AI would not generate insecure code. That if the code works, it is safe. That security is something you add later, as a deliberate feature.',
              learn:  'That AI-generated code routinely ships XSS, SQL injection, and missing authorization checks. The AI optimizes for code that runs, not code that is safe.',
              prose:  `You ran \`npm audit\` and saw 14 high-severity vulnerabilities. You didn't know what any of them meant. Then a friend showed you that the search page reflected user input directly into the HTML — they typed a script tag and an alert box appeared. The AI built the feature. You shipped it. Nobody checked.`,
            },
            {
              know:   'Run dependency audits as part of the build pipeline. Triage CVEs by actual exploitability in your context, not by severity score alone.',
              assume: 'That running audits means the codebase is secure — that if `npm audit` reports zero high-severity findings, the dependency surface is clean.',
              learn:  'Audits find what is in the database. A zero-day is not in the database yet. Transitive dependencies are often audited less carefully than direct ones.',
              prose:  `You add \`npm audit --audit-level=high\` to the CI pipeline. It blocks on the first run — four high-severity findings. You upgrade three, accept a temporary exception on the fourth. The pipeline goes green. Three weeks later, a security researcher posts about a remote code execution vulnerability in a transitive dependency that wasn't in your direct audit scope.`,
            },
            {
              know:   'Run dependency audits as part of the build pipeline. Triage CVEs by actual exploitability in your context. Know the difference between a critical vulnerability in a library you use on a hot path and one in a dev dependency that never runs in production.',
              assume: 'That running audits means the codebase is secure — that if the scanner reports zero high-severity findings, the dependency surface is clean.',
              learn:  'Audits find what is in the database. A zero-day is not in the database yet. Transitive dependencies — the dependencies of your dependencies — are often audited less carefully than direct ones.',
              prose:  `You add \`npm audit --audit-level=high\` to the CI pipeline and it starts blocking on the first run. You upgrade three findings, accept a temporary exception on the fourth. The pipeline goes green. Three weeks later, a security researcher posts about a remote code execution vulnerability in a transitive dependency — one of your dependencies depends on it, and it is not in your direct audit scope. Your audit was clean. Your exposure was not.`,
            },
            {
              know:   'Conduct structured vulnerability assessments of your production surface. Understand which CVEs are theoretical and which are exploitable in your specific configuration. Reason about the business impact of specific vulnerability classes in terms of what an attacker gains access to.',
              assume: 'That vulnerability scanning is compliance theater — real attacks happen to large targets, and small products are not worth the effort of a sophisticated attacker.',
              learn:  'Automated attacks do not target large products — they scan the entire internet for known patterns. A known vulnerability in an unpatched dependency is a door that automated scanners will find regardless of how prominent your product is.',
              prose:  `Your dependency audit flagged a critical CVE in an image processing library. You'd seen the warning for six weeks and deprioritized it. A security researcher emailed you on a Thursday: they'd found a path traversal vulnerability in the same library that let an authenticated user read arbitrary files from the server. The avatar upload endpoint was the vector. You patched within four hours, rotated all server credentials, and wrote a disclosure to affected users. You enabled automated dependency update PRs the same day.`,
            },
            {
              know:   'Own the vulnerability management strategy for the organization: how CVEs are discovered, triaged, prioritized, and remediated. Define the patch policy — what severity requires what response time — and the escalation path when a critical vulnerability is discovered in a system with no clear owner.',
              assume: 'That a good vulnerability management program means applying patches promptly and systematically. That high-severity CVEs always require immediate remediation regardless of context.',
              learn:  'Vulnerability severity scores are context-free. A critical CVE in a library that handles network input is a five-alarm emergency. The same CVE in a library used only in a build-time code generator that never touches production input is a medium-priority backlog item.',
              prose:  `A critical CVE is published in a logging library used in forty services across the organization. The security team opens forty tickets simultaneously and marks them all urgent. You convene a thirty-minute triage call. Fifteen of the forty services use the affected code path with untrusted input — those get patched today. Twenty use it only with internal, already-validated data — those get scheduled for the next sprint. Five use an older version where the vulnerability does not apply — those get closed. Forty tickets become three categories and a clear priority ordering.`,
            },
          ]),
        },
        {
          id: 'secrets', name: 'Secrets & Env Vars',
          col: 4, row: 0, appearsAtLevel: 1, floorStartLevel: 1,
          floors: makeFloors(1, [
            {
              know:   'You know that API keys exist and should not be shared. You have moved a key into a `.env` file after someone told you to. You understand the mechanical step.',
              assume: 'That putting a key in `.env` makes it safe. That the AI knows where secrets should go and will handle them correctly. That `.gitignore` is automatically set up for you.',
              learn:  'That `.env` files can be committed to Git if `.gitignore` is not configured correctly. That Git records every version of every file — including files you deleted — and that history is permanent unless explicitly purged.',
              prose:  `The app stopped working in production. Someone had rotated the API key. You checked the repository and found the original key sitting in a commit from three weeks ago — the AI had placed it inline in the code, and you had moved it to .env later, but Git remembered. That was the day you learned that Git never forgets.`,
            },
            {
              know:   'Use a secrets manager or encrypted environment configuration. Understand which services touch which secrets and what the blast radius is if any one of them is compromised.',
              assume: 'That secrets in environment variables that aren\'t checked into version control are adequately protected.',
              learn:  'Environment variables are readable to every process running in the same environment. Rotation is only useful if you can do it faster than an attacker can act on a leaked credential.',
              prose:  `You move all secrets from the .env file into the deployment platform's environment configuration — encrypted at rest, injected at runtime, never committed. Then a security audit asks what the rotation schedule is for the database credentials. The credentials were set at initial deployment. The last rotation was never. You've never tested rotation and don't know if the application handles a credential change without a restart.`,
            },
            {
              know:   'Secrets have a lifecycle: created, distributed, rotated, and revoked. You know which services touch which secrets and what the blast radius is if any one of them is compromised.',
              assume: 'That secrets in environment variables that aren\'t checked into version control are adequately protected. That rotation is something you do when a secret is compromised, not before.',
              learn:  'Environment variables are readable to every process running in the same environment. Rotation is only useful if you can do it faster than an attacker can act on a leaked credential — which means rotation has to be practiced before the incident.',
              prose:  `You move all secrets into the deployment platform's environment configuration — encrypted at rest, injected at runtime, never committed. A security audit asks what the rotation schedule is for the database credentials. You realize the credentials were set at initial deployment and the last rotation was never. You also realize you have never tested rotation — you don't know if the application handles a credential change without a restart, and you don't know which services would break in what order.`,
            },
            {
              know:   `[know — L4 Senior / Staff]`,
              assume: `[assume — L4]`,
              learn:  `[learn — L4]`,
              prose:  `[prose — L4]`,
            },
            {
              know:   'Design the secrets management infrastructure for the organization — the vaults, the rotation policies, the audit trails, the access control models. Make the secure path the easy path: secrets should be harder to mishandle than to handle correctly, through tooling rather than policy.',
              assume: 'That a centralized secrets vault, properly configured and documented, solves the secrets management problem. That engineers who have been trained on secrets hygiene will apply that training consistently.',
              learn:  'The vault is not the hard problem. The hard problem is the gap between the vault and every engineer who needs to provision, rotate, and reference secrets in their service.',
              prose:  `A departing engineer's personal API key is discovered — six months after their offboarding — as the only credential authenticating a production payment integration. The vault did not cause this. The process did not prevent it. You build an automated inventory: every secret in the vault tagged to a human owner, with an alert when that owner's employment status changes. You add service-identity-based authentication to the payment integration so no human credential is ever the single point of failure again. The vault was always a good lock on the wrong door.`,
            },
          ]),
        },
        {
          id: 'threat-modeling', name: 'Threat Modeling',
          col: 2, row: 3, appearsAtLevel: 3, floorStartLevel: 3,
          floors: makeFloors(3, [
            {
              know:   'You can look at a system before it is built and enumerate what could go wrong. You identify who the adversaries are, what they want, and which surfaces are exposed. You draw trust boundaries and ask what happens if an adversary controls what arrives at that boundary.',
              assume: 'That threat modeling is a one-time exercise — that if you identify the risks at the design stage, you have handled security. That the diagram you drew last quarter still reflects the system you\'re running today.',
              learn:  'The threat surface changes every time you ship. New features create new attack vectors. A new integration adds a new trust boundary. Threat modeling is not a deliverable; it is a recurring practice.',
              prose:  `You sit down before the sprint starts and draw the trust boundaries. You find it immediately: the webhook endpoint accepts unsigned payloads, the admin panel is one misconfigured proxy rule away from the open internet, and the file upload service has no size limit. You file tickets for all three. Three sprints later, two are still open marked "icebox," and the team has shipped a new third-party integration with its own unaudited input paths that nobody ran through the same exercise.`,
            },
            {
              know:   'Conduct a structured threat model for your product: enumerate the assets worth protecting, identify the most plausible adversary types, map the paths an attacker might take through your system, and document the mitigations that address the highest-impact threats first.',
              assume: 'That security is about adding defenses — more auth checks, more encryption, more firewalls. Threat modeling is for teams with dedicated security engineers.',
              learn:  'Security resources are finite and the threat surface is infinite. Threat modeling is the practice of deciding where a limited defense budget has the highest expected value.',
              prose:  `You spend an afternoon drawing the data flows of your application — where user data entered, where it was stored, where it crossed a service boundary, where it left your control. You asked: if you wanted to extract the most sensitive data in this system, where would you start? The answer was a webhook receiver that accepted unsigned payloads from an external service and wrote directly to the database. Any attacker who knew the endpoint URL could write to your database unauthenticated. You added signature verification in an afternoon. The threat model took three hours and found the most serious vulnerability in the system.`,
            },
            {
              know:   'You have made threat modeling a team practice rather than a specialist skill. Every RFC has a security considerations section. Engineers draw data flow diagrams, identify trust boundaries, and reason about abuse cases as naturally as they reason about API design.',
              assume: 'That a systematic threat modeling practice, consistently applied, catches the significant security risks in new systems. That once teams have internalized the methodology, they will apply it reliably as the system evolves.',
              learn:  'A threat model is accurate at the moment it is written. Systems are not static. Threat model drift is invisible until someone asks "wait — does this model account for the admin portal we added in Q2?"',
              prose:  `Every new service goes through the threat modeling workshop before a line of production code is written. Then an intern, reviewing documentation for a different purpose, points out that the threat model for the core data service does not include the admin panel that was added six months ago. The admin panel has direct database write access, no rate limiting, and was built by a different team than the one that owns the threat model. You add a quarterly "threat model drift review" to the architecture calendar. The model that is not updated is the model that lies.`,
            },
          ]),
        },
      ],
    },
// ── L2 ──────────────────────────────────────────────────────────────────

    {
      id: 'the-pipeline',
      name: 'The Pipeline',
      tagline: 'Ships sail, systems scale.',
      type: 'technical',
      appearsAtLevel: 2,
      originCol: 14, originRow: 2,
      cols: 8, rows: 6,
      buildings: [
        {
          id: 'cicd', name: 'CI/CD',
          col: 0, row: 0, appearsAtLevel: 2, floorStartLevel: 2,
          floors: makeFloors(2, [
            // L2 — new building unlocked
            {
              know:   'Push code and follow the existing pipeline config, trusting that if CI is green, the deploy is safe.',
              assume: 'That CI is just a test runner in the cloud — a box to check before merging. That a green pipeline means the code is safe.',
              learn:  'What each stage of a pipeline does, what conditions fail a build, and why automated checks protect users as much as they protect developers.',
              prose:  `I push. The CI runs. Sometimes it is red for reasons I don't investigate — I push a minor fix until it goes green. Last week I deployed by SSH-ing into the server and running \`git pull\`. It worked, but I forgot to restart the service. Nobody noticed for two hours.`,
            },
            // L3 — Floor 1
            {
              know:   'A functioning pipeline that runs tests on every push and deploys on merge to main. Understanding the sequence: test, build, publish, deploy. The difference between a failing test blocking a deploy and a flaky test blocking a deploy.',
              assume: 'That a green pipeline means the code is correct — that the test suite the pipeline runs is a reliable signal about the state of the software.',
              learn:  'The pipeline is software. It has bugs, it has flaky tests, it has steps that succeed even when they fail because someone swallowed the exit code.',
              prose:  `You set up the pipeline: lint, test, build, deploy on merge to main. Then a deploy goes out that breaks the production payment flow — the tests passed, the pipeline was green, the deploy succeeded. You investigate and find that the payment integration tests were marked \`skip\` two weeks ago because they were flaky, and nobody had un-skipped them. The pipeline was working. It was running the wrong tests.`,
            },
            // L4 — Floor 2
            {
              know:   'Build deployment pipelines with rollback capability that takes seconds; canary releases that route a fraction of traffic to a new version before a full rollout; and safety gates — smoke tests, health checks, synthetic transactions — that catch failures your test suite doesn\'t exercise.',
              assume: 'That CI/CD is solved once the pipeline is green. A green build means a safe deploy.',
              learn:  'A green pipeline means your test suite passes on a fixed data set. It does not mean the deploy is safe for the users currently using your product. Canary releases, feature flags, and one-click rollback are what make deployment safe when real money is flowing through the system.',
              prose:  'I deployed on a Friday afternoon. Pipeline was green. Within ten minutes, 12% of users — the ones on a locale my test suite didn\'t cover — couldn\'t complete checkout. The rollback I\'d never practiced took twenty minutes because I had to look up the commands. Monday morning I added a canary stage that routes 5% of traffic first, a health check on the checkout flow that blocks promotion, and a documented one-click rollback that I practiced twice in staging before I trusted it. I stopped deploying on Fridays.',
            },
            // L5 — Floor 3 (Final)
            {
              know:   'Own the platform-level deployment infrastructure that other teams build on. Design build caching strategies, artifact management, environment promotion workflows, and rollback mechanisms that work under real incident conditions. Treat the CI/CD platform as a product with SLOs, incident response, and a roadmap.',
              assume: 'That a universal pipeline template, applied consistently, works well for every team. That faster build times are always the correct optimization target.',
              learn:  `The CI/CD platform's most important product is not speed — it is trustworthiness. Teams need to believe that green means safe to ship. A platform that makes builds fast but allows false-positive passes destroys more value than a slow platform that is always honest.`,
              prose:  'You centralize the organization\'s CI/CD onto a shared platform. Build times drop 60%. Then a team ships a broken database migration because a flaky integration test auto-retried and passed on the second attempt. The build was green. The migration was not safe. You remove automatic retry for any test touching persistent data and add a "this test has been flaky in the last 30 days" badge to the CI dashboard. Build times increase slightly. Nobody complains. Green has to mean green.',
            },
          ]),
        },
        {
          id: 'cloud-environments', name: 'Cloud & Environments',
          col: 4, row: 0, appearsAtLevel: 2, floorStartLevel: 2,
          floors: makeFloors(2, [
            // L2 — new building unlocked
            {
              know:   'Deploy to Vercel or Railway by connecting a GitHub repo and watching the build succeed. Understand the difference between staging and production environments.',
              assume: `That "the cloud" is just someone else's server — a vague, interchangeable concept. That staging and production are the same environment with different URLs.`,
              learn:  'What PaaS, BaaS, and IaaS actually are. That environment differences between staging and production accumulate invisibly and become bugs you only discover in production.',
              prose:  "Lovable wired up Supabase and Vercel. It deployed. I have been using cloud infrastructure since day one without knowing it. My staging environment is just another Vercel project, and my environment variables differ between environments in ways I haven't actually checked.",
            },
            // L3–L5 — no explicit content in the doc; use placeholders
          ]),
        },
        {
          id: 'testing', name: 'Testing',
          col: 0, row: 3, appearsAtLevel: 2, floorStartLevel: 2,
          floors: makeFloors(2, [
            // L2 — new building unlocked
            {
              know:   'Ask the AI to write tests after a feature is complete and run them to see if they pass. Understand the difference between unit tests (isolated behavior) and integration tests (components working together).',
              assume: 'That tests are optional proof — the code either works or it doesn\'t, and you can tell by running it. That high coverage means the software is tested.',
              learn:  'What a unit test actually verifies, why it catches regressions that manual testing misses, and what the arrange/act/assert pattern means. That coverage measures lines executed, not behavior verified.',
              prose:  `The AI wrote some tests. They pass. I'm not entirely sure what they're testing. I broke the same feature twice last month — the second time, I wrote a test myself. Not because anyone told me to. Because I was tired of fixing the same thing. The test would have caught it. That was the first test I ever wrote because I wanted to, not because a template required it.`,
            },
            // L3 — Floor 1
            {
              know:   'A working test suite with unit tests and at least some integration coverage. Understanding the test pyramid. Tests should be deterministic and a flaky test is a problem.',
              assume: 'That a high-coverage test suite means the software is tested — that the percentage reported by the coverage tool reflects the percentage of behavior that is verified.',
              learn:  'Coverage measures lines executed, not behavior verified. A test that calls a function and asserts nothing contributes to coverage. The question the coverage report cannot answer is: if this code breaks, which test will tell me?',
              prose:  'You delete forty tests that were asserting on implementation details — mocking every internal function call, verifying invocation order on private methods — and replace them with twelve tests that verify actual behavior. The suite runs faster and for the first time a refactor doesn\'t break half the test files. Then a bug reaches production: a subtle edge case in the data transformation layer where a null value produces an incorrect output. The behavior was never specified. The code path was covered.',
            },
            // L4 — Floor 2
            {
              know:   'Design a test strategy for a team: distinguish which coverage belongs in unit tests, integration tests, and end-to-end tests; enforce coverage thresholds in CI; and write tests that serve as living documentation of expected behavior.',
              assume: 'That good engineers write good tests naturally. If you hire people who care about quality, test coverage takes care of itself.',
              learn:  'Test coverage is a team coordination problem. Without explicit standards enforced in the pipeline, tests are written when people have time and energy — which means they are written last and skipped first.',
              prose:  'We shipped a feature that a new engineer had tested manually and signed off on. Three days after release, a user found a case where the feature corrupted their data if they had more than a thousand records. The engineer had tested with a small seed dataset. I established a test data policy, added required coverage thresholds to CI, and created fixture datasets that reflected production scale. The next two features the same engineer shipped included tests I learned from.',
            },
            // L5 — Floor 3 (Final)
            {
              know:   'Shape the testing culture across the organization — what gets tested, what gets measured, what standards live in the review checklist. Know which tests provide real confidence (behavioral, boundary, failure path) and which are theater (testing framework behavior, chasing coverage numbers in isolation).',
              assume: 'That high coverage percentages translate reliably into high deployment confidence. That the testing pyramid — unit, integration, end-to-end — is a universal prescription rather than a starting heuristic.',
              learn:  'The right testing strategy is the one that covers where failures actually happen in your specific system. The Architect audits production incident timelines quarterly and asks: what test, if it had existed, would have caught this?',
              prose:  'Code coverage holds steady at 87% across the organization. A production bug slips through — a code path that is technically covered, because the test asserts the function does not throw, but never inspects the return value. You pull the last quarter\'s incident list and map each failure to its gap in the test suite. Half the failures trace to serialization boundaries. You add a "boundary testing" section to the code review checklist. Coverage stays at 87%. Confidence increases measurably, because now the 87% covers the places the failures actually come from.',
            },
          ]),
        },
        {
          id: 'observability', name: 'Observability',
          col: 4, row: 3, appearsAtLevel: 2, floorStartLevel: 2,
          floors: makeFloors(2, [
            // L2 — new building unlocked
            {
              know:   'Check logs when something breaks — find the error and fix it.',
              assume: 'That logging means `console.log` placed wherever a bug was reported.',
              learn:  'Log levels, structured logging, the difference between logging and monitoring, and why an error message without context is nearly worthless.',
              prose:  'The app was down. I opened the logs. They said "Error" with no context. I added a `console.log` and deployed again to see what would happen next. I was debugging production with print statements. A user had emailed to say the site was broken three hours before I noticed myself.',
            },
            // L3 — Floor 1
            {
              know:   'Logging in place and you can find what you need in the logs when something goes wrong. The difference between structured logs and unstructured logs. A basic dashboard showing metrics.',
              assume: 'That having logs means having observability — that if you can reconstruct what happened from the logs after an incident, the system is observable.',
              learn:  'Observability is the ability to understand the internal state of a system from its external outputs without deploying new code. Logs that were not designed for the query you need to run during an incident do not help you.',
              prose:  `An incident fires at midnight: error rates spiking, but the service is technically up. You open the logs and find thousands of lines of request completion entries — method, path, status code, response time. What you don't find is the user ID, the tenant, or the specific operation. You know something is broken. You cannot tell what, for whom, or how long it has been happening. You spend forty minutes adding context to log lines in production by shipping a hotfix during the incident.`,
            },
            // L4 — Floor 2
            {
              know:   'Instrument services with structured logging and distributed tracing. Build dashboards that answer "is it broken right now" with enough specificity to identify which component is failing. Create alerts that fire before users notice.',
              assume: 'That more metrics equals more visibility. Volume of telemetry is a proxy for diagnostic capability.',
              learn:  `Observability is not volume — it is the ability to ask a question of your system that you didn't anticipate needing to ask before the incident started.`,
              prose:  'I set up Datadog and created 47 alerts in a weekend. I felt covered. In the first week I got paged 23 times. Eighteen of them were a known race condition that resolved itself in seconds. I started ignoring the phone. The one real outage that week — payments failing for users in a specific region — I saw fifteen minutes late because the page had blended into the noise. I deleted 30 alerts, tuned the remaining ones to fire only on sustained degradation. My next on-call week had two pages. Both of them mattered.',
            },
            // L5 — Floor 3 (Final)
            {
              know:   'Own the observability strategy for the organization: what gets instrumented, why, what dashboards exist, how alerts are structured, and what happens when one fires. Distinguish between monitoring (is the system working?) and observability (why is it not working?). Design the alerting hierarchy and escalation paths.',
              assume: 'That comprehensive monitoring coverage prevents surprises. That alert fatigue is a configuration problem solved by raising thresholds and reducing duplicate alerts.',
              learn:  'Alert fatigue is a trust problem. Engineers stop responding well to alerts not because there are too many, but because too many of the alerts that fire at 3am turn out not to require action. Rebuilding that trust requires deleting alerts ruthlessly — not tuning them.',
              prose:  `The on-call engineer receives an average of forty alerts per shift. You shadow on-call for a week and log every alert and its outcome. You do not tune the threshold on the thirty-two that do not matter. You delete twenty of them outright and consolidate ten overlapping signals into three composite alerts. You add runbook links and a "most common false positive" note to every remaining alert. Alerts per shift drop to eleven. The eight that actually require action are still there — and now the engineer believes them.`,
            },
          ]),
        },
      ],
    },

    {
      id: 'the-architecture',
      name: 'The Architecture',
      tagline: `The parts of the stack you can't see but can't ignore.`,
      type: 'technical',
      appearsAtLevel: 2,
      originCol: 21, originRow: 2,
      cols: 6, rows: 6,
      buildings: [
        {
          id: 'async-realtime', name: 'Async & Real-time',
          col: 0, row: 0, appearsAtLevel: 2, floorStartLevel: 2,
          floors: makeFloors(2, [
            // L2 — new building unlocked
            {
              know:   'Use a real-time service (Supabase Realtime, Pusher) and wire it into the frontend. Move expensive operations off the API path and into a background queue.',
              assume: 'That polling every second is functionally equivalent to real-time. That "async" and "reliable" are properties that come together automatically.',
              learn:  'What a WebSocket is, why a persistent bidirectional connection differs from repeated HTTP requests. That queues need dead-letter handling — a place for failed jobs to land, with someone watching it.',
              prose:  `The chat feature works because Supabase handles it. My notifications use \`setInterval\` every two seconds because that felt fast enough. It is fast enough for five users. With 200 concurrent users each polling twice a second, my server is spending more time responding to polling requests than doing anything useful.`,
            },
            // L3 — Floor 1
            {
              know:   'The difference between synchronous and asynchronous processing and why some operations should not block the request/response cycle. Moving work to a background queue and confirming the task was enqueued.',
              assume: 'That enqueuing work means the work will be done — that "async" and "reliable" are properties that come together.',
              learn:  'Queues are not guarantees. Reliability requires idempotent consumers, dead-letter monitoring, and the explicit decision about what happens when a message fails more than once.',
              prose:  'You move PDF generation off the API path and into a background queue. Response times drop from twelve seconds to two hundred milliseconds. A week later, support tickets arrive: users who generated reports are not receiving them. You check the queue and find forty failed messages in the dead-letter queue — a malformed input from a specific account type crashed the worker on the first attempt, the retry logic ran three times, and then the message was routed to dead-letter. No alert fired. Nobody was watching it.',
            },
            // L4 — no explicit content in the doc
            // L5 — Floor 3 (Final)
            {
              know:   `Set the async architecture patterns for the organization — which event streaming primitives are canonical, how services communicate asynchronously at the boundary level, what ordering and delivery guarantees different workloads require, and how to design for eventual consistency without producing user-visible correctness failures.`,
              assume: 'That event-driven systems are inherently more scalable and resilient than synchronous ones. That publishing an event from a service is a clean way to decouple it from its downstream consumers.',
              learn:  'Event-driven decoupling is spatial, not logical. The service that publishes an event is still tightly coupled to every consumer of that event — through the schema, the ordering assumptions, the delivery guarantees, and the unwritten contract about what the event means.',
              prose:  'A team changes the schema of a high-volume event — an innocuous-looking field rename. They notify their three known consumers. Production alerts fire six hours later from a fourth consumer nobody in the publishing team knew existed, a service that had been silently subscribed for two years. You build a consumer registry — a searchable record of what events each service subscribes to — and add schema-change coordination to the architecture review checklist.',
            },
          ]),
        },
        {
          id: 'system-design', name: 'System Design',
          col: 2, row: 3, appearsAtLevel: 2, floorStartLevel: 2,
          floors: makeFloors(2, [
            // L2 — new building unlocked
            {
              know:   'Decompose a product into components, draw a diagram showing how they communicate, and make an argument for the partitioning you chose. Approach design as something that happens before coding.',
              assume: 'That a coherent diagram means a coherent system — that if the boxes and arrows make sense on paper, the implementation will follow cleanly.',
              learn:  `The hard parts are at the boundaries: what happens when one component doesn't respond, what data is duplicated and which copy is authoritative, how you handle partial failure.`,
              prose:  `You open a blank document before opening your editor. You draw the components: the API gateway, the user service, the notification service, the database. It looks complete. What you haven't drawn yet are the arrows that point nowhere when a service is down, and the decision about what to do with the order when the user service returns a 503.`,
            },
            // L3 — Floor 1
            {
              know:   'Decompose a product into components, draw a diagram showing how they communicate, and make an argument for the partitioning. Understand the basic vocabulary: services, APIs, databases, caches, queues.',
              assume: 'That a coherent diagram means a coherent system — that if the boxes and arrows make sense on paper, the implementation will follow cleanly.',
              learn:  `The hard parts are at the boundaries: what happens when one component doesn't respond, what data is duplicated across components and which copy is authoritative, how you handle partial failure.`,
              prose:  `You open a blank document before opening your editor. You draw the components and label the arrows. It looks complete. What you haven't drawn yet are the arrows that point nowhere when the notification service is down, the decision about what to do with the order when the user service returns a 503, and who owns the data when both services need to know the user's email address. The diagram is coherent. The system it describes is not yet designed.`,
            },
            // L4 — Floor 2
            {
              know:   'Reason about distributed systems trade-offs with real stakes attached: apply CAP theorem to specific decisions, articulate when eventual consistency is acceptable and when it will result in a support ticket about a user\'s missing money, and design for partial failure.',
              assume: 'That microservices solve scaling problems. If each service is independent, each service scales independently.',
              learn:  'Distribution creates as many problems as it solves. A network call where there used to be a function call introduces latency, failure modes, and consistency challenges that didn\'t exist before.',
              prose:  'I split my monolith into three services because one endpoint was getting hammered. The endpoint got faster. Then I had a payment go through with no customer record attached — the payment service couldn\'t reach the user service during a 200ms network blip and proceeded anyway. I added retries. The retries caused duplicate charges on intermittent timeouts. I learned about idempotency keys from a Stripe support ticket opened by a user who had been charged twice. I merged two of the three services back together the following month.',
            },
            // L5 — Floor 3 (Final)
            {
              know:   'Define the architectural patterns that span teams and persist across years — service boundaries, data ownership, communication protocols, failure isolation strategies. Run the design review culture and the RFC process. Evaluate proposals not just for what they solve today but for what they will constrain in three years.',
              assume: 'That the right architecture, designed carefully enough at the outset, eliminates the need for future rewrites. That a rigorous RFC process catches all significant architectural risks before implementation.',
              learn:  'Every architecture becomes legacy. The organization changes, the traffic patterns shift, the team triples, the use cases the original design never anticipated arrive on schedule. The Architect\'s real job is to design systems that can evolve gracefully.',
              prose:  `You designed the core service boundaries three years ago. Now traffic has shifted dramatically, the engineering team has tripled, and one service — originally a thin coordination layer — has grown to handle 60% of all requests. A junior architect proposes splitting it. Your instinct is to defend the original design, to be the historian of a decision that made sense once. You suppress the instinct. You co-author the RFC with them instead. The new boundaries are better than what you would design today, let alone three years ago — not because you were wrong then, but because the world changed and they could see it fresh.`,
            },
          ]),
        },
      ],
    },
// ── L4: The Operations ──────────────────────────────────────────────────

    {
      id: 'the-operations',
      name: 'The Operations',
      tagline: 'Keep it running. Keep it fast.',
      type: 'technical',
      appearsAtLevel: 4,
      originCol: 21, originRow: 9,
      cols: 6, rows: 5,
      buildings: [
        {
          id: 'performance', name: 'Performance',
          col: 0, row: 0, appearsAtLevel: 4, floorStartLevel: 4,
          floors: makeFloors(4, [
            { know: `Measure Core Web Vitals on real user devices, identify render-blocking resources, profile server-side code to identify bottlenecks in hot paths, and reason about performance under real traffic patterns rather than local benchmarks.`,
              assume: `That performance is a frontend problem you solve once — if the bundle is small and the images are compressed, it's fast enough. That the bottleneck is always the code — if the algorithm is fast, the system is fast.`,
              learn:  `Performance is a full-stack concern that spans CDN configuration, API response time, and the database query behind the dropdown. The bottleneck is often I/O, network, or contention. Profiling in production looks nothing like profiling on your laptop.`,
              prose:  `My landing page took 4.2 seconds on a median mobile connection. I only found out because I finally looked at the real user timing metrics — not my local build, not the Lighthouse score I'd been proud of. I lazy-loaded the below-fold content, moved the hero image to a CDN, and described the bundle analysis to the AI. Load time dropped to 1.8 seconds. Signups went up 15% over the next two weeks. My API endpoint was taking 800ms under load — I added APM tooling and discovered 600ms was waiting on a database connection from an exhausted pool. The bottleneck was never where I expected.` },
            { know: `Set performance standards for the organization: what latency targets exist, what constitutes a regression, how performance testing integrates into the release pipeline. Define the measurement methodology — what to instrument, what baseline to compare against. Evaluate performance investments against business outcomes.`,
              assume: `That performance is a shared engineering value that, once cultivated, sustains itself through team culture and code review.`,
              learn:  `Performance without measurement is intuition, and intuition about performance is reliably wrong in complex systems. The cultural value is not enough without the infrastructure to make it visible.`,
              prose:  `The engineering organization cares about performance — reviews mention it, engineers run benchmarks informally. But three separate product launches in a quarter each introduce latency regressions caught after deployment. You build a performance baseline system: every service has a p50, p95, and p99 latency baseline captured at each release, with a CI check that flags regressions for human review before the deploy continues. The fourth product launch catches a regression in CI that nobody had noticed. Performance is now an engineering standard with teeth.` },
          ]),
        },
        {
          id: 'reliability', name: 'Reliability',
          col: 3, row: 2, appearsAtLevel: 4, floorStartLevel: 4,
          floors: makeFloors(4, [
            { know: `Define SLAs and SLOs that map to actual business outcomes, maintain error budgets that make the speed-vs-reliability trade-off explicit, run incidents with a structured process, and write post-mortems that change the system rather than find someone to blame.`,
              assume: `That incidents are caused by bad code, and that writing better code means you won't have them. That 99.9% uptime sounds like a lot of nines. That a post-mortem is a way to identify who made the mistake.`,
              learn:  `Incidents are caused by systems, not individuals. The post-mortem that ends with a name misses the process that let the failure reach production. Error budgets make the reliability trade-off honest.`,
              prose:  `It's 2am on a Tuesday and Stripe webhooks are returning 500s. I open the runbook — there is no runbook. I check the logs, find a database migration that locked the payments table, roll it back manually, and payments recover eight minutes later. In the morning I write a post-mortem. The root cause wasn't the migration. It was that anyone on the team could run a migration against production with no review step, no announcement, no rollback plan. I add a policy. The next migration gets reviewed. It still breaks something, but this time I find out in staging.` },
            { know: `Set the reliability engineering philosophy for the organization — SLOs, error budgets, availability targets. Build the relationship between engineering and the business around error budgets — trading reliability headroom for velocity deliberately, with shared understanding of the tradeoffs.`,
              assume: `That high availability is always the correct goal — every system should be as reliable as engineering effort can make it. That reliability is primarily an infrastructure problem solved by redundancy.`,
              learn:  `Reliability is a business conversation. The most expensive reliability mistake is building infrastructure-level availability for a system the business would accept being down for an hour per week.`,
              prose:  `The organization runs all services at "we try to keep this up" with no formal SLOs. Incidents are triaged by volume of complaints, not by actual customer impact. You spend two months with product and business teams mapping each service to its business impact. The resulting SLO framework has three tiers: critical (99.9% with pager), standard (99.5% with business-hours response), and best-effort (no SLO). The critical tier has eleven services. Two of them had been operated as best-effort. The organization's reliability investment did not increase — it was redistributed to match the actual risk.` },
          ]),
        },
      ],
    },

    // ── L4: The People ──────────────────────────────────────────────────────

    {
      id: 'the-people',
      name: 'The People',
      tagline: 'The humans in the system.',
      type: 'non-technical',
      appearsAtLevel: 4,
      originCol: 2, originRow: 16,
      cols: 10, rows: 5,
      buildings: [
        {
          id: 'hiring', name: 'Hiring',
          col: 0, row: 0, appearsAtLevel: 4, floorStartLevel: 4,
          floors: makeFloors(4, [
            { know: `Design interview loops that test for the skills your team actually needs — not abstract intelligence. Calibrate across multiple interviewers so "I liked them" and "I didn't like them" don't cancel each other out. Make hire/no-hire decisions you can defend with specific, observable evidence.`,
              assume: `That a good interview reveals how smart someone is. Hard problems on a whiteboard separate strong engineers from weak ones.`,
              learn:  `The best engineers you will miss are the ones who can't solve a trick question under pressure but can take a messy codebase and make it better within a week. An interview that tests puzzle-solving hires puzzle-solvers.`,
              prose:  `My first engineering hire aced a LeetCode hard. I was impressed in the room. Three months later they couldn't ship a feature without daily guidance. My second hire stumbled on the algorithm question but refactored my entire auth system in a week, unprompted, with no direction. I redesigned the interview around a take-home project that mirrored a real task from the backlog. The signal improved immediately. I stopped hiring people who were good at interviewing.` },
            { know: `[know — L5 Expert / Leader]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]` },
          ]),
        },
        {
          id: 'engineering-culture', name: 'Engineering Culture',
          col: 4, row: 0, appearsAtLevel: 4, floorStartLevel: 4,
          floors: makeFloors(4, [
            { know: `Recognize that what you tolerate becomes the standard. Set explicit expectations for code review quality, how disagreement gets resolved in technical decisions, what on-call looks like, and what "done" means before a PR ships.`,
              assume: `That culture is a byproduct of hiring good people — if everyone cares about quality, quality happens naturally. You don't need to manage it explicitly.`,
              learn:  `Culture is the behavior you reward and the behavior you let slide. It is shaped by every review you approved too quickly, every standard you waived for a deadline, and every time you let someone's output speak louder than your stated expectations.`,
              prose:  `My best engineer started merging without review. They were fast, the code was good, the deadline was close — I let it go. Within three weeks, everyone was merging without review. I hadn't made a decision; I had set a precedent. I made review mandatory, added branch protection, and had the hardest conversation of my career with the person who'd taught me the most. Two months later the codebase was measurably more consistent, and the conversation had become the thing I was most proud of from that period.` },
            { know: `[know — L5 Expert / Leader]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]` },
          ]),
        },
        {
          id: 'onboarding', name: 'Onboarding',
          col: 2, row: 3, appearsAtLevel: 4, floorStartLevel: 4,
          floors: makeFloors(4, [
            { know: `Build onboarding that gets a new engineer making a real commit in their first week. Write the setup docs, automate the environment configuration, and create starter tasks that are real enough to teach the codebase but bounded enough to ship without a mentor standing over them.`,
              assume: `That smart engineers figure it out. Onboarding documentation is nice-to-have overhead — anyone worth hiring will ask questions and get up to speed eventually.`,
              learn:  `The time a new hire spends figuring out undocumented tribal knowledge is time they are not building confidence in the codebase or the team. Onboarding is not documentation work — it is force multiplication.`,
              prose:  `My third hire took three weeks to make their first commit. One full week was just getting the dev environment running. There were six undocumented environment variables, a database seed step that only existed in a Slack message from eight months ago, and a VPN configuration that lived entirely in my head. I spent a weekend writing a setup script and a getting-started doc. My fourth hire opened a PR on day two. The script cost me two days. It has returned those days dozens of times over.` },
            { know: `[know — L5 Expert / Leader]`,
              assume: `[assume — L5]`,
              learn:  `[learn — L5]`,
              prose:  `[prose — L5]` },
          ]),
        },
      ],
    },

    // ── L5: The Leadership ───────────────────────────────────────────────────

    {
      id: 'the-leadership',
      name: 'The Leadership',
      tagline: 'The system has to work without you.',
      type: 'non-technical',
      appearsAtLevel: 5,
      originCol: 13, originRow: 16,
      cols: 12, rows: 5,
      buildings: [
        {
          id: 'platform-thinking', name: 'Platform Thinking',
          col: 0, row: 0, appearsAtLevel: 5, floorStartLevel: 5,
          floors: makeFloors(5, [
            { know: `You see applications as layered systems. You build the foundations — shared libraries, internal APIs, deployment scaffolding, component primitives — that other teams compose into their own products. You think in surfaces and contracts, not features. You know that a platform's API is a promise you have to keep.`,
              assume: `That a good platform is defined by its capabilities. That if you build it cleanly enough, with good enough documentation, teams will adopt it naturally.`,
              learn:  `The platforms that win are the ones teams actually use, not the ones with the best architecture. Adoption is a social problem wearing a technical costume. Developer empathy — understanding the migration cost, the mental model gap, the workflow friction — determines success more than the elegance of the abstraction.`,
              prose:  `You spent three months building an internal deployment platform. The API is clean, the docs are solid, the abstraction is genuinely elegant. Two teams adopted it. Six did not. You sit down with each of the six and ask what it would take to switch. The answer is not "better features" — it is "a migration path from what we already have." You rebuild the onboarding experience around the existing workflow. Adoption triples in the following quarter. The hardest part of platform work was never the platform.` },
          ]),
        },
        {
          id: 'technical-standards', name: 'Technical Standards',
          col: 4, row: 0, appearsAtLevel: 5, floorStartLevel: 5,
          floors: makeFloors(5, [
            { know: `You write the rules that hold across teams — API naming conventions, error handling patterns, logging formats, code review expectations, deprecation policies. You know that a standard only works when it reduces cognitive load, not adds it. You know that enforced standards outlast suggested ones, and enforcement is most effective when it lives in tooling.`,
              assume: `That good standards are self-evidently good. That if you document them clearly enough with enough rationale, people will follow them.`,
              learn:  `Standards without buy-in become bureaucracy. The most durable standards are the ones the affected teams helped write — because those teams have already internalized the reasoning before the document is published. The standard is the output of the conversation, not the substitute for it.`,
              prose:  `You authored the organization's API design guide — thirty pages, clear examples, explicit rationale for every decision. Three months later, a team ships an endpoint that violates half of it. You walk over and look at what they built. It works. It's internally consistent. Then you notice: your guide assumed a REST world, and this team is building event-driven. The standard was not wrong — it was incomplete. You rewrite the relevant sections with their engineers in the room. The new version is better. The team becomes its co-authors.` },
          ]),
        },
        {
          id: 'mentorship', name: 'Mentorship',
          col: 8, row: 0, appearsAtLevel: 5, floorStartLevel: 5,
          floors: makeFloors(5, [
            { know: `You grow engineers, not just ship features. You pair, you review, you ask questions instead of giving answers. You create the conditions where someone else has the breakthrough. You know that your goal is not to reproduce your own approach — it is to help someone find their own.`,
              assume: `That mentorship is about transferring your knowledge — your patterns, your instincts, your hard-won experience. That the best way to grow someone is to show them how you would do it, then watch them imitate you.`,
              learn:  `The best mentors do not clone themselves. They help someone find their own way through problems — even when that way is different from yours. The measure of good mentorship is not "do they think like me" but "do they think well, independently, in their own idiom."`,
              prose:  `A junior engineer shows you their pull request. It is not how you would have written it. The naming is different, the structural choices are unfamiliar — but the code works, the tests pass, and the logic is traceable. You almost rewrite it in review. Instead you ask: "Walk me through why you structured it this way." Fifteen minutes later, you have understood something you had not considered. You approve the PR with two small suggestions. Two months from now, they will make a design decision independently that you would have made the same way. Not because you showed them — because they found it.` },
          ]),
        },
        {
          id: 'post-mortems', name: 'Post-mortems',
          col: 3, row: 3, appearsAtLevel: 5, floorStartLevel: 5,
          floors: makeFloors(5, [
            { know: `Failure is a system input, not a shame event. You run blameless post-mortems with rigor: not to find who failed, but to find what the system allowed to happen and how to make that category of failure harder next time. You track action items and actually close them.`,
              assume: `That the act of running a blameless post-mortem will naturally produce honest conversation. That the written document — the timeline, the root cause, the action items — is the output.`,
              learn:  `The real output of a post-mortem is changed behavior, not a document. If the same class of failure recurs six months later, the post-mortem did not work — no matter how thorough the write-up was.`,
              prose:  `The payment service goes down for forty minutes. You run the post-mortem on Thursday. The room is tense. You open with: "I want to understand the system, not assign blame." Halfway through the timeline, an engineer admits they skipped the staging deploy because it was blocking another team. You write it down without flinching. The action item is not "do not skip staging." The action item is "fix the pipeline so that staging does not create cross-team blockage." Three months later, you check the ticket. The pipeline was refactored. The skip has not recurred. That is a post-mortem that worked — not because it was thorough, but because the thing it produced was real change.` },
          ]),
        },
      ],
    },

  ], // end webCity.districts
}; // end webCity

export const cities: City[] = [webCity];
export const districts: District[] = webCity.districts;
