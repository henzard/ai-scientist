/**
 * Server-side in-memory feedback store.
 *
 * Module-level Map survives across requests within one Node.js process. Data is
 * lost on server restart — intentional for hackathon demo; replace with Vercel
 * Blob or a database for production use.
 *
 * THIS FILE MUST NOT be imported by any 'use client' component.
 */

import { AgentId, FeedbackEntry, FeedbackPayload } from './types';

// key: `${domain}:${agentId}`
const store = new Map<string, FeedbackEntry[]>();

const MAX_PER_SLOT = 10; // bound memory for a single domain+agent pair

function slotKey(domain: string, agentId: AgentId): string {
  return `${domain}:${agentId}`;
}

export function addFeedback(payload: FeedbackPayload): FeedbackEntry {
  const entry: FeedbackEntry = {
    ...payload,
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: Date.now(),
  };
  const key = slotKey(payload.domain, payload.agentId);
  const existing = store.get(key) ?? [];
  // Keep only the most recent MAX_PER_SLOT entries
  store.set(key, [...existing, entry].slice(-MAX_PER_SLOT));
  return entry;
}

export function getFeedback(domain: string, agentId: AgentId): FeedbackEntry[] {
  return store.get(slotKey(domain, agentId)) ?? [];
}

/**
 * Returns the text of all 'down'-rated corrections for a domain+agent pair,
 * trimmed and non-empty, most recent first. Used to augment agent system prompts.
 */
export function getCorrections(domain: string, agentId: AgentId): string[] {
  return getFeedback(domain, agentId)
    .filter(e => e.rating === 'down' && e.correction.trim().length > 0)
    .map(e => e.correction.trim())
    .reverse(); // most recent first
}

/**
 * Returns the total number of correction entries across all domain+agent slots.
 * Exposed so the UI can show a global "learning from N corrections" indicator.
 */
export function totalCorrectionCount(): number {
  let count = 0;
  for (const entries of store.values()) {
    count += entries.filter(e => e.rating === 'down').length;
  }
  return count;
}
