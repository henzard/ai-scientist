'use client';

import { useState, useCallback } from 'react';
import { PLAN_AGENTS, SAMPLE_HYPOTHESES } from '@/lib/agents';
import { PipelineState, AgentId } from '@/lib/types';
import { useAgentStream } from '@/hooks/useAgentStream';
import LiteratureBanner from '@/components/LiteratureBanner';
import AgentSidebar from '@/components/AgentSidebar';
import PlanSection from '@/components/PlanSection';

const INITIAL_STATE: PipelineState = {
  hypothesis: '',
  stage: 'idle',
  litResult: null,
  sections: {},
  agentStatus: {},
  activeAgent: null,
  error: null,
};

export default function Home() {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const { sections, streamAgent, resetSections } = useAgentStream();

  const updateState = useCallback((patch: Partial<PipelineState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const analyzeHypothesis = useCallback(async () => {
    if (!state.hypothesis.trim()) return;

    resetSections();
    updateState({
      stage: 'checking',
      litResult: null,
      sections: {},
      agentStatus: { lit: 'running' },
      activeAgent: 'lit',
      error: null,
    });

    try {
      const res = await fetch('/api/literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis: state.hypothesis }),
      });
      if (!res.ok) throw new Error(`Literature check failed: ${res.status}`);
      const litResult = await res.json();

      updateState({
        stage: 'ready',
        litResult,
        agentStatus: { lit: 'done' },
        activeAgent: null,
      });
    } catch (err) {
      updateState({
        stage: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        agentStatus: { lit: 'error' },
        activeAgent: null,
      });
    }
  }, [state.hypothesis, resetSections, updateState]);

  const generatePlan = useCallback(async () => {
    setState(prev => ({ ...prev, stage: 'planning' }));

    for (const agent of PLAN_AGENTS) {
      setState(prev => ({
        ...prev,
        agentStatus: { ...prev.agentStatus, [agent.id as AgentId]: 'running' as const },
        activeAgent: agent.id,
      }));

      try {
        await streamAgent(agent.id, state.hypothesis);
        setState(prev => ({
          ...prev,
          agentStatus: { ...prev.agentStatus, [agent.id as AgentId]: 'done' as const },
          activeAgent: null,
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          stage: 'error',
          agentStatus: { ...prev.agentStatus, [agent.id as AgentId]: 'error' as const },
          activeAgent: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, stage: 'complete', activeAgent: null }));
  }, [state.hypothesis, streamAgent]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    resetSections();
  }, [resetSections]);

  const isIdle = state.stage === 'idle';
  const isRunning = !isIdle;
  const litDone = state.agentStatus['lit'] === 'done';
  const planStarted = state.stage === 'planning' || state.stage === 'complete';

  if (isIdle) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 py-16" style={{ background: 'var(--bg)' }}>
        {/* Grid overlay */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-[var(--border)] rounded-full bg-[var(--gold-dim)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
                Multi-Agent Scientific Pipeline
              </span>
            </div>

            <h1
              className="text-5xl md:text-6xl font-light leading-tight mb-4"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', color: 'var(--text-primary)' }}
            >
              From hypothesis to<br />
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>runnable experiment</span>
            </h1>

            <p className="text-sm font-mono text-[var(--text-secondary)] tracking-wide">
              Six specialist agents · Literature QC · Full operational plan
            </p>
          </div>

          {/* Input area */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden mb-4">
            <div className="px-4 pt-3 pb-1 border-b border-[var(--border)]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Scientific Hypothesis
              </span>
            </div>
            <textarea
              value={state.hypothesis}
              onChange={e => updateState({ hypothesis: e.target.value })}
              placeholder="Describe your experimental hypothesis in plain language…"
              rows={5}
              className="w-full px-4 py-3 bg-transparent text-[var(--text-primary)] text-sm leading-relaxed resize-none outline-none placeholder:text-[var(--text-muted)]"
            />
            <div className="px-4 pb-3 flex justify-end">
              <button
                onClick={analyzeHypothesis}
                disabled={!state.hypothesis.trim()}
                className="px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-widest rounded border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: state.hypothesis.trim() ? 'var(--gold-dim)' : 'transparent',
                  borderColor: 'var(--border)',
                  color: state.hypothesis.trim() ? 'var(--gold)' : 'var(--text-muted)',
                }}
                onMouseEnter={e => {
                  if (state.hypothesis.trim()) {
                    (e.target as HTMLButtonElement).style.background = 'rgba(200,146,26,0.15)';
                  }
                }}
                onMouseLeave={e => {
                  if (state.hypothesis.trim()) {
                    (e.target as HTMLButtonElement).style.background = 'var(--gold-dim)';
                  }
                }}
              >
                Analyze Hypothesis →
              </button>
            </div>
          </div>

          {/* Sample hypotheses */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-3 text-center">
              Try a sample
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_HYPOTHESES.map((h, i) => (
                <button
                  key={i}
                  onClick={() => updateState({ hypothesis: h })}
                  className="text-left px-4 py-2.5 border border-[var(--border)] rounded text-xs text-[var(--text-secondary)] leading-relaxed transition-colors hover:border-[var(--gold)] hover:text-[var(--text-primary)] hover:bg-[var(--gold-dim)] line-clamp-2"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] font-mono text-[var(--text-faint)] mt-10 tracking-wider">
            MIT HACKATHON · CHALLENGE 04: THE AI SCIENTIST · FULCRUM SCIENCE
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Grid overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Sidebar */}
      <div className="sticky top-0 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--surface)] px-3 py-5 w-[240px] shrink-0 overflow-y-auto">
        <div className="mb-5 px-2">
          <button
            onClick={reset}
            className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
          >
            ← New Hypothesis
          </button>
        </div>

        <div className="px-2 mb-4">
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Hypothesis</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
            {state.hypothesis}
          </p>
        </div>

        <div className="border-t border-[var(--border)] mb-4" />

        <AgentSidebar
          agents={PLAN_AGENTS}
          agentStatus={state.agentStatus}
          activeAgent={state.activeAgent}
          litDone={litDone}
          onGeneratePlan={generatePlan}
          planStarted={planStarted}
        />

        {state.stage === 'complete' && (
          <div className="mt-4 px-2">
            <div className="text-[10px] font-mono text-[var(--gold)] uppercase tracking-widest text-center py-2 border border-[var(--border)] rounded bg-[var(--gold-dim)]">
              ✓ Plan Complete
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              The AI Scientist
            </span>
            {state.stage === 'checking' && (
              <span className="text-[10px] font-mono text-[var(--cyan)] animate-pulse">· Checking literature…</span>
            )}
            {state.stage === 'planning' && (
              <span className="text-[10px] font-mono text-[var(--cyan)] animate-pulse">· Generating plan…</span>
            )}
          </div>
          <h2
            className="text-2xl font-light"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', color: 'var(--text-primary)' }}
          >
            Experiment Plan
          </h2>
        </div>

        {/* Literature result */}
        {state.litResult && (
          <div className="mb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Literature Assessment
            </p>
            <LiteratureBanner result={state.litResult} />
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="border border-red-400/20 bg-red-400/5 rounded px-4 py-3 mb-4">
            <p className="text-red-400 text-sm font-mono">{state.error}</p>
          </div>
        )}

        {/* Agent sections */}
        {PLAN_AGENTS.map(agent => (
          <PlanSection
            key={agent.id}
            agent={agent}
            content={sections[agent.id] ?? ''}
            status={state.agentStatus[agent.id]}
          />
        ))}
      </main>
    </div>
  );
}
