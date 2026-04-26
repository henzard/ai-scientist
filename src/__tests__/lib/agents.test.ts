import { describe, it, expect } from 'vitest';
import { PLAN_AGENTS, SAMPLE_HYPOTHESES } from '@/lib/agents';
import { AgentId } from '@/lib/types';

const EXPECTED_IDS: AgentId[] = ['protocol', 'materials', 'budget', 'timeline', 'validation'];

describe('PLAN_AGENTS', () => {
  it('contains exactly 5 agents in pipeline order', () => {
    expect(PLAN_AGENTS).toHaveLength(5);
    expect(PLAN_AGENTS.map(a => a.id)).toEqual(EXPECTED_IDS);
  });

  it('each agent has a non-empty id, label, icon, and system prompt', () => {
    for (const agent of PLAN_AGENTS) {
      expect(agent.id).toBeTruthy();
      expect(agent.label).toBeTruthy();
      expect(agent.icon).toBeTruthy();
      expect(agent.system.length).toBeGreaterThan(50);
    }
  });

  it('each agent getPrompt includes the hypothesis', () => {
    const hypothesis = 'test hypothesis for unit testing purposes';
    for (const agent of PLAN_AGENTS) {
      const prompt = agent.getPrompt(hypothesis);
      expect(prompt).toContain(hypothesis);
    }
  });

  it('protocol agent prompt starts with ## Protocol header instruction', () => {
    const prompt = PLAN_AGENTS.find(a => a.id === 'protocol')!.getPrompt('h');
    expect(prompt).toContain('## Protocol');
  });

  it('materials agent prompt requests a markdown table', () => {
    const prompt = PLAN_AGENTS.find(a => a.id === 'materials')!.getPrompt('h');
    expect(prompt).toContain('| Item |');
  });

  it('budget agent prompt requests ## Budget Estimate header', () => {
    const prompt = PLAN_AGENTS.find(a => a.id === 'budget')!.getPrompt('h');
    expect(prompt).toContain('## Budget Estimate');
  });

  it('timeline agent prompt requests ## Timeline header', () => {
    const prompt = PLAN_AGENTS.find(a => a.id === 'timeline')!.getPrompt('h');
    expect(prompt).toContain('## Timeline');
  });

  it('validation agent prompt requests ## Validation header', () => {
    const prompt = PLAN_AGENTS.find(a => a.id === 'validation')!.getPrompt('h');
    expect(prompt).toContain('## Validation');
  });

  it('protocol system prompt references scientific standards (MIQE, protocols.io)', () => {
    const system = PLAN_AGENTS.find(a => a.id === 'protocol')!.system;
    expect(system.toLowerCase()).toMatch(/miqe|protocols\.io|bio-protocol/i);
  });

  it('materials system prompt references major suppliers', () => {
    const system = PLAN_AGENTS.find(a => a.id === 'materials')!.system;
    expect(system).toMatch(/Sigma|Thermo|Abcam|ATCC|Addgene/);
  });

  it('validation system prompt references reporting standards', () => {
    const system = PLAN_AGENTS.find(a => a.id === 'validation')!.system;
    expect(system).toMatch(/MIQE|ARRIVE|CONSORT|ICH/);
  });
});

describe('SAMPLE_HYPOTHESES', () => {
  it('has exactly 4 entries covering all challenge domains', () => {
    expect(SAMPLE_HYPOTHESES).toHaveLength(4);
  });

  it('all entries are non-empty strings longer than 50 chars', () => {
    for (const h of SAMPLE_HYPOTHESES) {
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(50);
    }
  });

  it('covers biosensor topic (CRP / ELISA)', () => {
    expect(SAMPLE_HYPOTHESES.some(h => h.toLowerCase().includes('biosensor') || h.toLowerCase().includes('crp'))).toBe(true);
  });

  it('covers cryopreservation topic (trehalose / DMSO)', () => {
    expect(SAMPLE_HYPOTHESES.some(h => h.toLowerCase().includes('cryoprotectant') || h.toLowerCase().includes('trehalose'))).toBe(true);
  });

  it('covers microbiome topic (Lactobacillus)', () => {
    expect(SAMPLE_HYPOTHESES.some(h => h.toLowerCase().includes('lactobacillus'))).toBe(true);
  });

  it('covers bioelectrochemical topic (CO2 / Sporomusa)', () => {
    expect(SAMPLE_HYPOTHESES.some(h => h.toLowerCase().includes('sporomusa') || h.toLowerCase().includes('co'))).toBe(true);
  });
});
