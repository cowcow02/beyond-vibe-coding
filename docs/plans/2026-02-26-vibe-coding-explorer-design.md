# Vibe Coding Explorer — Design Document

**Date:** 2026-02-26
**Status:** Brainstorming in Progress

---

## Overview

An interactive map-based exploration tool that helps new "vibe coders" understand the full scope of software engineering. Uses a fog-of-war mechanic to reveal how vast the SE landscape is, and how deep each domain goes — from AI-dependent prototyping to professional engineering mastery.

**Core Message:** You are at the starting point. Vibe coding is powerful, but professional engineering requires broadening and deepening your expertise across many domains.

---

## What is Vibe Coding? (2026 Definition)

Based on research, **Vibe Coding** in 2026 is:

- **Origin:** Coined by Andrej Karpathy (early 2025), Collins Dictionary's Word of the Year 2025
- **Philosophy:** "Code is a liability" — describe what you want in natural language, let AI generate the implementation
- **Role Shift:** From "code bricklayer" to "AI project manager" — your value is in identifying needs and directing AI, not writing syntax
- **Process:** Natural language description → AI generates → Vibe check (test functionality & UX) → Deploy
- **Tools:** Claude Code, Cursor, Windsurf, Replit, v0, Bolt.new, Lovable

**Sources:**
- [Collins Dictionary Word of the Year](https://www.collinsdictionary.com/word-of-the-year/)
- [GitHub Blog 2026 Developer Roadmap](https://github.blog/)

---

## Map Structure

### Two Dimensions

1. **Regions (Domains):** 18 distinct skill areas
2. **Depth Levels:** 6 levels per region (0-5)

---

## Dimension 1: The 18 Regions

### Technical Regions (10)

#### 1. Frontend Development
- **Vibe Coding:** Generate UI components, responsive layouts, basic interactions
- **Full Scope:** JavaScript/TypeScript fundamentals, React/Vue/Angular ecosystem, CSS architecture, performance optimization, accessibility (WCAG), browser internals (DOM, event loop, V8)

#### 2. Backend & APIs
- **Vibe Coding:** Generate REST endpoints, basic CRUD operations
- **Full Scope:** API design patterns (REST, GraphQL, gRPC, WebSocket), authentication & authorization (JWT, OAuth2), rate limiting, caching, microservices vs monolith, serverless, containers, API versioning, documentation

#### 3. Databases & Data
- **Vibe Coding:** Basic CRUD, simple queries
- **Full Scope:** SQL mastery, NoSQL patterns, indexing strategies, query optimization, transactions, isolation levels, data modeling, replication, sharding, CAP theorem, caching layers (Redis, CDN)

#### 4. DevOps & Infrastructure
- **Vibe Coding:** Deploy to Vercel/Netlify, basic env vars
- **Full Scope:** CI/CD pipelines, containerization (Docker), Kubernetes, Infrastructure as Code (Terraform), monitoring & observability (Prometheus, Grafana, ELK), distributed tracing, cloud platforms (AWS/GCP/Azure)

#### 5. Security
- **Vibe Coding:** Often overlooked until problems arise
- **Full Scope:** OWASP Top 10, authentication flows (2FA, SSO), encryption (TLS), input validation, security headers, penetration testing, vulnerability scanning, SDL

#### 6. Testing & Quality Assurance
- **Vibe Coding:** Maybe basic manual testing
- **Full Scope:** Unit testing, integration testing, E2E testing, TDD methodology, property-based testing, mutation testing, code coverage, testing in CI

#### 7. System Design & Architecture
- **Vibe Coding:** Single-app thinking
- **Full Scope:** Architectural patterns (layered, hexagonal, clean), design patterns, scalability patterns, data partitioning, message queues, event-driven architecture, service mesh, capacity planning

#### 8. Performance Engineering
- **Vibe Coding:** "It works" is enough
- **Full Scope:** Profiling (CPU, memory, I/O), optimization techniques, query optimization, CDN strategy, memory leaks, GC tuning, load testing, A/B testing

#### 9. Mobile Development
- **Vibe Coding:** React Native / Flutter basic apps
- **Full Scope:** Native (Swift/SwiftUI, Kotlin/Compose), cross-platform tradeoffs, app lifecycle, push notifications, app store deployment, mobile performance, offline-first architecture

#### 10. Specialized Domains
- **Vibe Coding:** Barely touches these
- **Full Scope:**
  - **ML/ML:** PyTorch, TensorFlow, model deployment, MLOps
  - **Game Dev:** Unity/Unreal, game loops, physics engines
  - **Embedded:** C/C++, real-time systems, hardware interfaces
  - **Blockchain:** Smart contracts, consensus, DeFi
  - **Data Engineering:** ETL, data lakes, streaming (Kafka)

---

### Non-Technical Regions (8)

#### 11. Product Discovery & Requirements
- **Vibe Coding:** "Build me an app that does X" — jumping to solution without understanding problem
- **Full Scope:** Problem discovery (user interviews), Jobs-to-be-done, MVP vs feature creep, requirement prioritization (MoSCoW, RICE), user stories, stakeholder management, assumption testing

#### 12. User Experience & Design
- **Vibe Coding:** AI generates "nice looking" UI, but lacks UX thinking
- **Full Scope:** User research, wireframing, prototyping, usability testing, design systems, information architecture, accessibility & inclusive design, psychology of user behavior

#### 13. Business Strategy & Value Proposition
- **Vibe Coding:** "I'll build it and they will come" — no business thinking
- **Full Scope:** Market research, competitive analysis, business model canvas, unit economics (CAC, LTV, churn), pricing strategy, product-market fit, go-to-market

#### 14. Analytics & Data-Driven Decisions
- **Vibe Coding:** Maybe checks "it works" — no measurement
- **Full Scope:** Funnel analysis, cohort analysis, A/B testing, key metrics definition, product analytics (Mixpanel, Amplitude), data visualization, statistical significance

#### 15. Project Management & Delivery
- **Vibe Coding:** "Build feature by feature" — no process
- **Full Scope:** Agile vs waterfall, sprint planning, roadmap management, risk management, scope management, delivery predictability, stakeholder communication

#### 16. Communication & Documentation
- **Vibe Coding:** Code is the documentation (or none at all)
- **Full Scope:** Technical writing, design docs, ADRs, code reviews, presenting to audiences, commit messages, PR descriptions, knowledge sharing

#### 17. Legal, Ethics & Compliance
- **Vibe Coding:** Often ignored until problems arise
- **Full Scope:** Privacy (GDPR, CCPA), terms of service, IP & licensing, AI ethics, accessibility compliance, security compliance (SOC2, HIPAA), responsible disclosure

#### 18. Team Collaboration & Culture
- **Vibe Coding:** Often solo or minimal collaboration
- **Full Scope:** Onboarding, mentorship, code ownership, psychological safety, blameless postmortems, conflict resolution, distributed teams, engineering culture, leadership

---

## Dimension 2: Depth Levels (Agency & Understanding)

| Level | Name | Relationship with AI | Example (Backend) |
|-------|------|---------------------|-------------------|
| **0** | **Vibe Coder** | **AI-dependent** — Can't function without it. Accepts output blindly. | "Generate a login API" → ships whatever AI produces |
| **1** | **Aware Novice** | **AI-passive** — Uses AI, but starting to learn concepts. Can spot obvious errors. | Knows what JWT/auth is. Asks AI for login API, reviews the code |
| **2** | **AI-Assisted Builder** | **AI-collaborative** — Can prompt effectively, understands the solution AI provides. Can iterate with guidance. | "Create a REST API with JWT auth" → understands the flow, can debug with AI help |
| **3** | **Independent Engineer** | **AI-augmented** — Can solve problems independently. Uses AI for speed/ideas, but **can verify, critique, and override** AI. Has their own mental models. | Can design API architecture themselves. Uses AI to scaffold, then refines. When AI hallucinates, they catch it. |
| **4** | **Senior/Staff Engineer** | **AI-strategic** — Leverages AI for leverage (codegen, refactors, documentation). But **drives architectural decisions**, evaluates tradeoffs, mentors others. | Designs entire auth system architecture. Uses AI to generate boilerplate, but owns the design decisions |
| **5** | **Expert/Thought Leader** | **AI-transcendent** — Pushes boundaries. Sometimes **AI learns from them**. Writes the standards others (and AI) follow. | Invents new auth patterns, writes RFCs, advises on industry standards |

---

## Key Distinctions: Vibe Coder vs Professional

| Aspect | Vibe Coder | Professional Engineer |
|--------|-----------|----------------------|
| **AI Role** | Oracle — answers must be accepted | Tool — output must be verified |
| **When AI is wrong** | Stuck, doesn't know why | Diagnoses, fixes, or overrides |
| **Problem-solving** | "Let me ask AI" | "Let me think, then use AI to accelerate" |
| **Learning** | Consumes AI outputs | Builds mental models, reads docs, experiments |
| **Code reviews** | "AI said it works" | "I understand why this works (or doesn't)" |
| **Debugging** | Asks AI to fix it | Investigates, uses AI as one tool among many |

---

## Core Message

> **From AI-dependence → AI-augmentation → AI-leverage**

The fog reveals not just "more knowledge" — it reveals **the agency that comes with understanding**.

---

## Design Direction: "The Uncharted Continent"

**Aesthetic:** Dark, atmospheric, mysterious exploration
**Metaphor:** Holding a lantern in the dark, revealing a vast continent

### Typography
- **Display:** `Cormorant Garamond` (elegant serif for region names, map labels)
- **Body:** `Space Mono` (technical, fits the coding theme)

### Color Palette
```css
--bg-deep: #0a0a0f
--fog-primary: rgba(60, 70, 90, 0.4)
--fog-accent: rgba(100, 120, 160, 0.6)
--region-glow: rgba(200, 210, 255, 0.15)
--text-primary: #e8eaf0
--text-muted: #7a8090
--accent-hub: #ffd700 (gold — the vibe coding island)
--accent-discovered: #4ade80 (green glow — areas explored this session)
```

### Visual Effects
- Animated fog layers (CSS keyframes with opacity and blur)
- Subtle grain overlay for texture
- Region borders pulse gently when hovered
- "Lantern" effect — mouse cursor illuminates nearby fog
- Generous negative space around the vibe coding hub

### Motion
- **Initial load:** Slow pan across fogged continent, then reveal the vibe coding hub
- **Staggered fade-in** for depth levels when a region is clicked
- **Smooth zoom transitions** (CSS transform with cubic-bezier)
- Fog has gentle, organic movement

### Why This Direction
- Fits the fog-of-war metaphor perfectly
- Emotional resonance — feels like exploration and discovery
- Memorable first impression — dark mode with glowing elements
- Avoids generic AI aesthetics (no purple gradients, no Inter font)

---

## Interaction Model: Static Interactive Visualization

**Key Decision:** This is a **static visualization tool** — no accounts, no progress tracking, no locking. Pure exploration and understanding.

### The Experience

1. **Zoomed Out — The Big Picture**
   - All 18 regions visible, fogged/blurred
   - Immediate scope awareness: "I had no idea this was so vast"
   - Labels and subtle hints of structure

2. **Click/Hover — Reveal Region**
   - Click any region → zoom in, fog clears
   - See all 6 depth levels with concrete details
   - Understand the progression path

3. **Drill Deeper — Expand a Depth Level**
   - Click L3 "Independent Engineer" → expand to see:
     - What it means
     - Concrete topics/skills
     - Real-world examples
     - How it differs from L2

4. **See Connections — Related Regions**
   - Sidebar/panel: "To master Frontend L3, you'll also need:"
     - Performance Engineering L2+
     - Testing L2+
     - System Design L1+

5. **Zoom Out — Context**
   - Always-visible mini-map shows where you are
   - See what you've explored in this session (transient, not saved)

### Interaction Summary

| Action | Result |
|--------|--------|
| **Scroll/Pan** | Navigate the full map freely |
| **Click region** | Zoom in, reveal details |
| **Click depth level** | Expand to see topics, examples |
| **Hover related** | See connections between regions |
| **Click outside/ESC** | Zoom back out |
| **Browser back** | Navigate history naturally |

---

## Implementation Specification

### Phase 1: MVP — The Core Experience

**Scope:** 3 regions fully fleshed out (Frontend, Backend, Product Discovery) to validate the concept

**Features:**
1. **Zoomed-out view** — All 18 regions visible as fogged shapes
2. **Click to zoom** — Smooth zoom into any region
3. **Depth expansion** — Click depth levels to expand details
4. **Mini-map** — Always-visible context indicator
5. **Connections sidebar** — Show related regions when viewing a depth level
6. **Responsive** — Works on desktop and tablet

**Technical Stack:**
- Pure HTML/CSS/JS (no framework for MVP)
- Single HTML file for easy preview
- CSS for all animations (no external animation libraries)
- SVG for the map (scalable, crisp)

### Data Structure

```json
{
  "regions": [
    {
      "id": "frontend",
      "name": "Frontend Development",
      "type": "technical",
      "position": { "x": 30, "y": 20 },
      "connections": ["performance", "testing", "system-design"],
      "depths": [
        {
          "level": 0,
          "name": "Vibe Coder",
          "description": "Generate UI components, responsive layouts, basic interactions",
          "skills": ["AI-generated components", "Responsive layouts", "Basic interactions"],
          "tools": ["v0", "Lovable", "Bolt.new"]
        },
        // ... levels 1-5
      ]
    }
    // ... 17 more regions
  ]
}
```

### To Be Determined

- [ ] Hosting/preview approach (Vercel? GitHub Pages? Local file?)
- [ ] Whether to populate all 18 regions for MVP or start with 3
- [ ] Copy refinement for each depth level (concrete examples, relatable language)

---

## Sources

- [Collins Dictionary Word of the Year 2025](https://www.collinsdictionary.com/word-of-the-year/)
- [GitHub Blog - Developer Trends](https://github.blog/)
