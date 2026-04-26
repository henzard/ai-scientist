import { describe, it, expect, beforeEach } from 'vitest';
import {
  addFeedback,
  getFeedback,
  getSemanticCorrections,
  totalCorrectionCount,
  __resetForTesting,
} from '@/lib/feedbackStore';

beforeEach(() => {
  __resetForTesting();
});

// ─── addFeedback ──────────────────────────────────────────────────────────────

describe('addFeedback', () => {
  it('returns entry with generated id and createdAt', () => {
    const entry = addFeedback({
      domain: 'biosensor',
      agentId: 'protocol',
      rating: 'up',
      correction: '',
      hypothesis: 'anti-CRP antibody biosensor for blood detection',
    });
    expect(entry.id).toBeTruthy();
    expect(typeof entry.id).toBe('string');
    expect(entry.createdAt).toBeGreaterThan(0);
  });

  it('stores the payload fields on the entry', () => {
    const payload = {
      domain: 'microbiome',
      agentId: 'protocol' as const,
      rating: 'down' as const,
      correction: 'Buffer pH should be 7.4',
      hypothesis: 'Lactobacillus rhamnosus supplementation intestinal permeability',
    };
    const entry = addFeedback(payload);
    expect(entry.domain).toBe(payload.domain);
    expect(entry.agentId).toBe(payload.agentId);
    expect(entry.rating).toBe(payload.rating);
    expect(entry.correction).toBe(payload.correction);
    expect(entry.hypothesis).toBe(payload.hypothesis);
  });

  it('generates unique ids across entries', () => {
    const a = addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'up', correction: '', hypothesis: 'h1' });
    const b = addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'up', correction: '', hypothesis: 'h2' });
    expect(a.id).not.toBe(b.id);
  });

  it('respects MAX_PER_AGENT cap (50) and keeps latest entries', () => {
    for (let i = 0; i < 55; i++) {
      addFeedback({ domain: 'biosensor', agentId: 'materials', rating: 'down', correction: `c${i}`, hypothesis: `h${i}` });
    }
    // Should only keep last 50; totalCorrectionCount reflects this
    expect(totalCorrectionCount()).toBeLessThanOrEqual(50);
  });
});

// ─── getFeedback ──────────────────────────────────────────────────────────────

describe('getFeedback', () => {
  it('returns empty array when nothing stored', () => {
    expect(getFeedback('biosensor', 'protocol')).toEqual([]);
  });

  it('filters by domain and agentId', () => {
    addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'up', correction: '', hypothesis: 'h1' });
    addFeedback({ domain: 'microbiome', agentId: 'protocol', rating: 'up', correction: '', hypothesis: 'h2' });
    addFeedback({ domain: 'biosensor', agentId: 'materials', rating: 'up', correction: '', hypothesis: 'h3' });

    const results = getFeedback('biosensor', 'protocol');
    expect(results).toHaveLength(1);
    expect(results[0].domain).toBe('biosensor');
    expect(results[0].agentId).toBe('protocol');
  });

  it('returns all matching entries in insertion order', () => {
    addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'up', correction: 'a', hypothesis: 'h1' });
    addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'down', correction: 'b', hypothesis: 'h2' });
    const results = getFeedback('biosensor', 'protocol');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.correction)).toEqual(['a', 'b']);
  });
});

// ─── getSemanticCorrections ───────────────────────────────────────────────────

describe('getSemanticCorrections', () => {
  it('returns empty array when no corrections stored', () => {
    expect(getSemanticCorrections('antibody biosensor detection', 'protocol')).toEqual([]);
  });

  it('returns only down-rated entries with non-empty corrections', () => {
    addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'up', correction: 'ignored', hypothesis: 'antibody biosensor detection blood' });
    const result = getSemanticCorrections('antibody biosensor detection blood', 'protocol');
    expect(result).toEqual([]);
  });

  it('retrieves corrections with semantic overlap', () => {
    addFeedback({
      domain: 'biosensor',
      agentId: 'protocol',
      rating: 'down',
      correction: 'Buffer pH should be 7.4 for antibody binding',
      hypothesis: 'antibody biosensor detection blood sample concentration',
    });
    const corrections = getSemanticCorrections(
      'antibody biosensor detection blood concentration measurement',
      'protocol'
    );
    expect(corrections).toHaveLength(1);
    expect(corrections[0]).toContain('pH');
  });

  it('filters out corrections below minimum Jaccard threshold', () => {
    addFeedback({
      domain: 'cryo',
      agentId: 'protocol',
      rating: 'down',
      correction: 'Use DMSO at 10%',
      hypothesis: 'trehalose cryoprotectant freeze thaw viability',
    });
    // Completely unrelated hypothesis — should not match
    const corrections = getSemanticCorrections('antibody biosensor blood detection', 'protocol');
    expect(corrections).toEqual([]);
  });

  it('respects topK limit (default 5)', () => {
    for (let i = 0; i < 10; i++) {
      addFeedback({
        domain: 'biosensor',
        agentId: 'materials',
        rating: 'down',
        correction: `Correction ${i}`,
        hypothesis: `antibody biosensor detection blood sample concentration level ${i}`,
      });
    }
    const result = getSemanticCorrections('antibody biosensor blood detection concentration', 'materials');
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('ranks higher-similarity corrections first', () => {
    // High overlap: matches most query tokens
    addFeedback({
      domain: 'biosensor',
      agentId: 'protocol',
      rating: 'down',
      correction: 'HIGH MATCH',
      hypothesis: 'antibody biosensor electrochemical detection blood concentration sample',
    });
    // Lower overlap: only shares a couple tokens
    addFeedback({
      domain: 'biosensor',
      agentId: 'protocol',
      rating: 'down',
      correction: 'LOW MATCH',
      hypothesis: 'antibody detection measurement method comparison study',
    });

    const result = getSemanticCorrections(
      'antibody biosensor electrochemical blood detection concentration',
      'protocol'
    );
    expect(result[0]).toBe('HIGH MATCH');
  });

  it('is scoped to agentId — does not cross agents', () => {
    addFeedback({
      domain: 'biosensor',
      agentId: 'materials',
      rating: 'down',
      correction: 'Wrong agent correction',
      hypothesis: 'antibody biosensor detection blood concentration',
    });
    const result = getSemanticCorrections('antibody biosensor blood detection concentration', 'protocol');
    expect(result).toEqual([]);
  });
});

// ─── totalCorrectionCount ─────────────────────────────────────────────────────

describe('totalCorrectionCount', () => {
  it('returns 0 when store is empty', () => {
    expect(totalCorrectionCount()).toBe(0);
  });

  it('counts only down-rated entries across all agents', () => {
    addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'up', correction: '', hypothesis: 'h1' });
    addFeedback({ domain: 'biosensor', agentId: 'protocol', rating: 'down', correction: 'c1', hypothesis: 'h2' });
    addFeedback({ domain: 'microbiome', agentId: 'materials', rating: 'down', correction: 'c2', hypothesis: 'h3' });
    expect(totalCorrectionCount()).toBe(2);
  });
});
