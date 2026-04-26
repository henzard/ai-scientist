# The AI Scientist — Design Spec

**Date:** 2026-04-26  
**Hackathon:** MIT Club of Northern California × MIT Club of Germany — Challenge 04: The AI Scientist  
**Sponsor:** Fulcrum Science

---

## Overview

A Next.js 14 App Router application that transforms a natural-language scientific hypothesis into a complete, operationally grounded experiment plan via a 6-step multi-agent pipeline. All AI calls are server-side; the browser never holds the API key.

---

## Architecture

```
Browser (React client)
  └── POST /api/literature          → callClaude (non-streaming) → JSON novelty result
  └── POST /api/plan/[agent]        → streamClaude (SSE passthrough) → text deltas
```

### API Routes

| Route | Method | Behaviour |
|---|---|---|
| `/api/literature` | POST | Non-streaming. Takes `{ hypothesis }`, returns `LiteratureResult` JSON |
| `/api/plan/[agent]` | POST | Streaming SSE. Takes `{ hypothesis }`, streams text deltas for the named agent |

### Model

`claude-sonnet-4-6` throughout.

---

## Pipeline

Two sequential phases:

### Phase 1 — Literature QC

One non-streaming call. Returns:
```typescript
{
  novelty: 'not_found' | 'similar_exists' | 'exact_match';
  signal_text: string;   // 2–3 sentences
  references: { title, authors, journal, year }[];  // 0–3
}
```

### Phase 2 — 5-Agent Plan (sequential)

| # | Agent ID | Label | Role |
|---|---|---|---|
| 1 | `protocol` | Protocol Architect | Step-by-step lab protocol: conditions, equipment, safety |
| 2 | `materials` | Materials Curator | Markdown table: supplier, catalog numbers, unit prices |
| 3 | `budget` | Budget Analyst | Line-item cost table, optimistic/realistic totals |
| 4 | `timeline` | Timeline Planner | Week-by-week phased breakdown with dependencies |
| 5 | `validation` | Validation Designer | Primary endpoint, stats, controls, success/failure criteria, troubleshooting |

Each agent streams markdown into its section via SSE.

---

## Data Model

```typescript
type NoveltyLevel = 'not_found' | 'similar_exists' | 'exact_match';
type AgentId = 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation';
type AgentStatus = 'pending' | 'running' | 'done' | 'error';

interface PipelineState {
  hypothesis: string;
  stage: 'idle' | 'checking' | 'ready' | 'planning' | 'complete' | 'error';
  litResult: LiteratureResult | null;
  sections: Partial<Record<AgentId, string>>;
  agentStatus: Partial<Record<AgentId | 'lit', AgentStatus>>;
  activeAgent: AgentId | 'lit' | null;
  error: string | null;
}
```

---

## UI Structure

### Idle Screen

- Large Cormorant Garamond heading: "From hypothesis to runnable experiment"
- Subheading: "Six specialist agents · Literature QC · Full operational plan"
- Hypothesis textarea
- "Analyze Hypothesis →" CTA (disabled when empty)
- 4 sample hypothesis fill buttons

### Running Screen

- **Left sidebar (215px):** Agent pipeline pills  
  - `pending` → dim grey dot  
  - `running` → pulsing cyan dot + cyan text  
  - `done` → gold checkmark + gold text
- **Right content pane:** Streaming markdown per agent, "Generate Full Plan →" button after lit check

---

## Components

| Component | Responsibility |
|---|---|
| `LiteratureBanner` | Novelty signal: green/amber/red dot, signal_text, references |
| `AgentSidebar` | Pipeline pills with status transitions |
| `PlanSection` | Agent output container; raw text + blinking cursor while streaming, then MarkdownRenderer |
| `MarkdownRenderer` | Custom parser: headings, numbered/bullet lists, full tables (gold headers), bold/code |

---

## Design System

```css
--bg: #060912;
--surface: rgba(13, 21, 36, 0.9);
--border: rgba(200, 146, 26, 0.18);
--gold: #c8921a;
--gold-dim: rgba(200, 146, 26, 0.08);
--cyan: #22d3ee;
--text-primary: #e2e8f0;
--text-secondary: #94a3b8;
```

**Aesthetic:** Dark scientific instrumentation software — obsidian background, gold instrument lighting, cyan data streams.

**Fonts:**
- Cormorant Garamond (300–600, italic) — display/headings
- Source Sans 3 (300–700) — body/UI
- JetBrains Mono (400–600) — tables/code/catalog numbers

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── literature/route.ts
│       └── plan/[agent]/route.ts
├── components/
│   ├── HypothesisInput.tsx
│   ├── LiteratureBanner.tsx
│   ├── AgentSidebar.tsx
│   ├── PlanSection.tsx
│   └── MarkdownRenderer.tsx
├── lib/
│   ├── agents.ts
│   ├── anthropic.ts
│   └── types.ts
└── hooks/
    └── useAgentStream.ts
```

---

## Deployment

- Platform: Vercel
- Config: `vercel.json` (framework: nextjs)
- Env: `ANTHROPIC_API_KEY` set as Vercel secret `@anthropic_api_key`
- Repo: GitHub `ai-scientist` (public)

---

## Constraints

- No `axios` — native `fetch` throughout
- No UI component libraries (shadcn, MUI, etc.) — all built from scratch
- TypeScript strict mode
- API key never exposed to browser — all Claude calls go through `/api/*` routes
