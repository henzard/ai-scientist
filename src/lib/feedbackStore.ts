/**
 * Server-side in-memory feedback store with semantic retrieval.
 *
 * "Second brain" pattern: corrections are stored with their source hypothesis
 * text and retrieved using Jaccard similarity — enabling cross-domain learning
 * without an embeddings API. The similarity score is computed on scientific
 * keywords (>4 chars) shared between hypotheses.
 *
 * Module-level Map survives across requests within one Node.js process.
 * Replace with Vercel Blob / vector DB for production persistence.
 *
 * THIS FILE MUST NOT be imported by any 'use client' component.
 */

import { AgentId, FeedbackEntry, FeedbackPayload } from './types';

// All corrections indexed by agentId (not domain) for cross-domain retrieval
const byAgent = new Map<AgentId, FeedbackEntry[]>();

const MAX_PER_AGENT = 50; // global cap per agent across all domains

// ─── Write ────────────────────────────────────────────────────────────────────

export function addFeedback(payload: FeedbackPayload): FeedbackEntry {
  const entry: FeedbackEntry = {
    ...payload,
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: Date.now(),
  };
  const existing = byAgent.get(payload.agentId) ?? [];
  byAgent.set(payload.agentId, [...existing, entry].slice(-MAX_PER_AGENT));
  return entry;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getFeedback(domain: string, agentId: AgentId): FeedbackEntry[] {
  // Return domain-exact matches for the GET /api/feedback endpoint
  return (byAgent.get(agentId) ?? []).filter(e => e.domain === domain);
}

/**
 * Semantic retrieval: returns the most relevant corrections for a hypothesis
 * using Jaccard similarity on scientific keyword overlap.
 *
 * Returns corrections (text only) from ANY domain, ranked by relevance.
 * This is the "second brain" — corrections cross domain boundaries when the
 * underlying science overlaps.
 */
export function getSemanticCorrections(hypothesis: string, agentId: AgentId, topK = 5): string[] {
  const entries = (byAgent.get(agentId) ?? []).filter(
    e => e.rating === 'down' && e.correction.trim().length > 0
  );
  if (entries.length === 0) return [];

  const queryTokens = tokenize(hypothesis);

  return entries
    .map(e => ({ correction: e.correction.trim(), score: jaccard(queryTokens, tokenize(e.hypothesis)) }))
    .filter(({ score }) => score > 0.05) // minimum similarity threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ correction }) => correction);
}

export function totalCorrectionCount(): number {
  let n = 0;
  for (const entries of byAgent.values()) n += entries.filter(e => e.rating === 'down').length;
  return n;
}

/** Clear all state. Only for use in test suites. */
export function __resetForTesting(): void {
  byAgent.clear();
}

// ─── Similarity ───────────────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 4) // skip short stop-words
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) { if (b.has(token)) intersection++; }
  return intersection / (a.size + b.size - intersection);
}
