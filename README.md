# The AI Scientist

**MIT Club of Northern California × MIT Club of Germany Hackathon — Challenge 04**  
*Sponsored by Fulcrum Science*

> Turn any scientific hypothesis into a complete, operationally grounded experiment plan — in minutes.

**[Live demo →](https://ai-scientist-fawn.vercel.app)** &nbsp;|&nbsp; **[Source →](https://github.com/henzard/ai-scientist)**

---

## What It Does

A scientist enters a natural-language hypothesis. Six specialist AI agents analyse it sequentially and produce:

| Agent | Output |
|---|---|
| Literature Scout | Novelty signal (not found / similar / exact match) + 1–3 references |
| Protocol Architect | Step-by-step lab protocol with temperatures, timings, concentrations |
| Materials Curator | Full reagents table with supplier, catalog number, and unit price |
| Budget Analyst | Line-item cost estimate (optimistic and realistic) |
| Timeline Planner | Phased week-by-week breakdown with dependencies |
| Validation Designer | Primary endpoint, statistical analysis, controls, success/failure criteria |

Every section streams live as it is generated. When the plan is complete, scientists can rate each section and submit corrections — which the system applies to all future plans for similar experiment types.

---

## Architecture

```
Browser (Next.js client)
  │
  ├── POST /api/literature          → callClaude (non-streaming) → JSON novelty result
  │
  ├── POST /api/plan/[agent]        → streamClaude (SSE) → text deltas
  │     └── reads feedbackStore     → injects prior corrections into system prompt
  │
  ├── POST /api/refine              → streamClaude (SSE) → hypothesis reformulations
  │
  ├── POST /api/learnings           → feedbackStore semantic lookup → corrections per agent
  │
  └── POST /api/feedback            → stores scientist correction in server Map
      GET  /api/feedback?domain=&agentId=

Server-side module boundary
  ├── feedbackStore.ts              → in-memory Map, module singleton, server-only
  ├── domainDetector.ts             → synchronous keyword classifier, 9 domains, runs client+server
  └── resources.ts                  → protocol repo catalogue, domain highlights, LLM prompt injection
```

**Key design decisions:**

- **All Claude calls are server-side.** The API key never reaches the browser.
- **SSE passthrough.** Anthropic's stream is parsed server-side and re-emitted as clean `data: {"text":"..."}` events. Clients never see Anthropic's raw event format.
- **Feedback as system-prompt injection.** Prior scientist corrections are prepended to the agent's system prompt — not the user turn — so Claude treats them as authoritative constraints, not hints.
- **Domain detection is synchronous, zero-latency.** Keyword substring matching classifies hypotheses into 9 domains client-side, with no extra API call.
- **Human-in-the-loop refinement.** When the Literature Scout finds similar or exact matches, scientists can open the Refinement Panel: domain-specific protocol resources, learnings from prior feedback, and a streaming advisor that proposes three concrete reformulations.

---

## Human-in-the-Loop Loop

This is the learning layer. Here's how it works end-to-end:

1. **Generate a plan** for a biosensor hypothesis
2. **Review a section** — click Approve or Correct on any agent output
3. **Submit a correction** — type what was wrong (e.g. `Buffer pH should be 7.4, not 6.8`)
4. **Generate a new plan** for any similar biosensor hypothesis
5. **The correction appears** — the next Protocol Architect output incorporates the scientist's feedback without being re-prompted

**What makes the demo compelling:**
- Corrections are tagged by experiment domain (biosensor, cryopreservation, microbiome, etc.)
- A `↺ learning applied` badge appears in any section header where prior corrections were active
- The Refinement Panel shows relevant prior corrections grouped by agent — scientists see what the system already knows before asking

**Current storage:** in-memory server-side Map. Survives the demo session; clears on server restart. Production deployment would replace this with a vector store for semantic matching.

---

## Quick Start

### Prerequisites

- Node.js 20+
- An Anthropic API key (`sk-ant-...`)

### Local development

```bash
git clone https://github.com/henzard/ai-scientist
cd ai-scientist
npm install
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — server-side only, never exposed to the browser |

---

## Running Tests

```bash
npm test                    # unit + component tests (Vitest)
npm run test:coverage       # with coverage report (>92% statements)
npm run test:e2e            # Playwright end-to-end (no API key required)
```

CI runs on every push via GitHub Actions: TypeScript → lint → Vitest coverage → Next.js build → Playwright chromium.

---

## Deployment (Vercel)

```bash
npx vercel login
npx vercel env add ANTHROPIC_API_KEY production   # paste your key when prompted
npx vercel --prod --yes
```

Or connect the GitHub repo in the Vercel dashboard — deploys automatically on push to `master`.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Server components + route handlers in one project |
| AI | Anthropic Claude Sonnet 4.6 | Best reasoning-to-speed ratio for scientific text |
| Streaming | Server-Sent Events (SSE) | Native browser support, no WebSocket overhead |
| Animation | Framer Motion | Staggered reveals and status transitions |
| Styling | Tailwind CSS + CSS variables | Design system tokens without runtime overhead |
| Fonts | Cormorant Garamond / Source Sans 3 / JetBrains Mono | Scientific instrumentation aesthetic |
| Icons | Lucide React | Consistent, lightweight |
| Deployment | Vercel Fluid Compute | Serverless with long streaming support |
| Testing | Vitest + Playwright | Unit/component + E2E, mocked SSE streams in CI |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main pipeline UI — idle + running views
│   ├── layout.tsx                  # Fonts, metadata, dark background
│   ├── globals.css                 # CSS variables + scrollbar styling
│   └── api/
│       ├── literature/route.ts     # Literature QC endpoint (non-streaming)
│       ├── plan/[agent]/route.ts   # Streaming agent endpoint + feedback injection
│       ├── refine/route.ts         # Streaming hypothesis reformulation advisor
│       ├── learnings/route.ts      # Semantic prior-feedback retrieval per agent
│       └── feedback/route.ts       # Scientist review storage + retrieval
├── components/
│   ├── LiteratureBanner.tsx        # Novelty signal (green/amber/red)
│   ├── AgentSidebar.tsx            # Pipeline progress pills
│   ├── PlanSection.tsx             # Per-agent output with streaming cursor
│   ├── FeedbackPanel.tsx           # Scientist review (approve/correct)
│   ├── RefinementPanel.tsx         # Human-in-the-loop: resources, learnings, advisor
│   └── MarkdownRenderer.tsx        # Custom MD to JSX (tables, lists, code)
├── hooks/
│   ├── useAgentStream.ts           # SSE client — accumulates streaming text
│   └── useFeedback.ts              # Feedback submission state per section
└── lib/
    ├── types.ts                    # All shared TypeScript interfaces
    ├── agents.ts                   # Agent definitions + sample hypotheses
    ├── anthropic.ts                # callClaude + streamClaude with error handling
    ├── domainDetector.ts           # Keyword-based experiment domain classifier (9 domains)
    ├── feedbackStore.ts            # Server-side in-memory feedback Map + semantic retrieval
    └── resources.ts                # Protocol repo catalogue, domain highlights, prompt injection
```

---

## Sample Hypotheses

All four sample inputs from the challenge brief are pre-loaded in the UI:

- **Diagnostics** — paper-based CRP biosensor vs. ELISA
- **Gut Health** — *L. rhamnosus* GG effect on murine intestinal permeability
- **Cell Biology** — trehalose vs. DMSO cryopreservation for HeLa cells
- **Climate** — *Sporomusa ovata* CO2 fixation in bioelectrochemical systems

---

## Demo Script (for judges)

1. Load the biosensor sample hypothesis → click **Analyze Hypothesis**
2. Literature QC returns (~5s) — novelty signal appears with colour coding
3. Click **Refine Hypothesis** — see protocol resources, prior learnings, and ask the Advisor for three concrete reformulations
4. Click a reformulation to adopt it and re-run the literature check
5. Click **Generate Full Plan** — watch all six sections stream live
6. On the Protocol section, click **Correct** and type: `Verify buffer pH is 7.4 for anti-CRP antibody binding`
7. Click **Submit feedback** — confirmation message appears
8. Click **New Hypothesis** → load the diagnostics sample again (or any biosensor hypothesis)
9. Generate plan → the Protocol section now incorporates the pH note without being told
10. The `↺ learning applied` badge appears in the Protocol header

That loop — generate, refine, review, improve — is the core value proposition.

---

## Contact

Built for the MIT × Fulcrum Science Hackathon, April 2026.  
Challenge contacts: arun@fulcrum.science / jonas@fulcrum.science  
Source: [github.com/henzard/ai-scientist](https://github.com/henzard/ai-scientist)  
Live: [ai-scientist-fawn.vercel.app](https://ai-scientist-fawn.vercel.app)
