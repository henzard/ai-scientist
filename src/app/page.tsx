'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const BEZIER: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: BEZIER } },
  },
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
    updateState({ stage: 'checking', litResult: null, sections: {}, agentStatus: { lit: 'running' }, activeAgent: 'lit', error: null });
    try {
      const res = await fetch('/api/literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis: state.hypothesis }),
      });
      if (!res.ok) throw new Error(`Literature check failed: ${res.status}`);
      const litResult = await res.json();
      updateState({ stage: 'ready', litResult, agentStatus: { lit: 'done' }, activeAgent: null });
    } catch (err) {
      updateState({ stage: 'error', error: err instanceof Error ? err.message : 'Unknown error', agentStatus: { lit: 'error' }, activeAgent: null });
    }
  }, [state.hypothesis, resetSections, updateState]);

  const generatePlan = useCallback(async () => {
    setState(prev => ({ ...prev, stage: 'planning' }));
    for (const agent of PLAN_AGENTS) {
      setState(prev => ({ ...prev, agentStatus: { ...prev.agentStatus, [agent.id as AgentId]: 'running' as const }, activeAgent: agent.id }));
      try {
        await streamAgent(agent.id, state.hypothesis);
        setState(prev => ({ ...prev, agentStatus: { ...prev.agentStatus, [agent.id as AgentId]: 'done' as const }, activeAgent: null }));
      } catch (err) {
        setState(prev => ({ ...prev, stage: 'error', agentStatus: { ...prev.agentStatus, [agent.id as AgentId]: 'error' as const }, activeAgent: null, error: err instanceof Error ? err.message : 'Unknown error' }));
        return;
      }
    }
    setState(prev => ({ ...prev, stage: 'complete', activeAgent: null }));
  }, [state.hypothesis, streamAgent]);

  const reset = useCallback(() => { setState(INITIAL_STATE); resetSections(); }, [resetSections]);

  const litDone = state.agentStatus['lit'] === 'done';
  const planStarted = state.stage === 'planning' || state.stage === 'complete';

  if (state.stage === 'idle') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 py-16 overflow-hidden" style={{ background: 'var(--bg)' }}>

        {/* Atmospheric background layers */}
        <div className="pointer-events-none fixed inset-0">
          {/* Deep radial glow — gold center */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(200,146,26,0.07) 0%, transparent 70%)',
          }} />
          {/* Cyan accent — top left */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 40% 30% at 15% 20%, rgba(34,211,238,0.05) 0%, transparent 60%)',
          }} />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          {/* Grain overlay */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }} />
        </div>

        {/* Decorative rule lines */}
        <div className="pointer-events-none fixed left-0 top-0 bottom-0 w-px opacity-20" style={{ background: 'linear-gradient(to bottom, transparent, var(--gold) 30%, var(--gold) 70%, transparent)' }} />
        <div className="pointer-events-none fixed right-0 top-0 bottom-0 w-px opacity-20" style={{ background: 'linear-gradient(to bottom, transparent, var(--gold) 30%, var(--gold) 70%, transparent)' }} />

        <motion.div
          className="relative w-full max-w-2xl"
          initial="initial"
          animate="animate"
          variants={stagger.container}
        >
          {/* Eyebrow badge */}
          <motion.div variants={stagger.item} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-[var(--border)] rounded-full bg-[var(--gold-dim)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Multi-Agent Scientific Pipeline
              </span>
            </div>
          </motion.div>

          {/* Main heading — large, architectural */}
          <motion.div variants={stagger.item} className="text-center mb-3">
            <h1
              className="font-light leading-[0.95] tracking-tight"
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontSize: 'clamp(3.5rem, 9vw, 6.5rem)',
                color: 'var(--text-primary)',
              }}
            >
              From hypothesis<br />
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                to experiment
              </span>
            </h1>
          </motion.div>

          {/* Divider with label */}
          <motion.div variants={stagger.item} className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border))' }} />
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] whitespace-nowrap">
              Six agents · Literature QC · Operational plan
            </p>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, var(--border))' }} />
          </motion.div>

          {/* Input card */}
          <motion.div
            variants={stagger.item}
            className="border border-[var(--border)] rounded-lg overflow-hidden mb-3"
            style={{ background: 'rgba(13,21,36,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--text-faint)]" />
                <span className="w-2 h-2 rounded-full bg-[var(--text-faint)]" />
                <span className="w-2 h-2 rounded-full bg-[var(--gold)] opacity-60" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
                Scientific Hypothesis
              </span>
            </div>
            <textarea
              value={state.hypothesis}
              onChange={e => updateState({ hypothesis: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && state.hypothesis.trim()) analyzeHypothesis();
              }}
              placeholder="Describe your experimental hypothesis in detail. The more specific your hypothesis — including measurable thresholds and mechanisms — the more actionable the plan."
              rows={5}
              className="w-full px-4 py-3 bg-transparent text-[var(--text-primary)] text-sm leading-relaxed resize-none outline-none placeholder:text-[var(--text-muted)]"
              style={{ fontFamily: 'var(--font-source-sans), sans-serif' }}
            />
            <div className="px-4 pb-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--text-faint)]">⌘↵ to submit</span>
              <motion.button
                onClick={analyzeHypothesis}
                disabled={!state.hypothesis.trim()}
                whileHover={state.hypothesis.trim() ? { scale: 1.02 } : {}}
                whileTap={state.hypothesis.trim() ? { scale: 0.98 } : {}}
                className="px-5 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] rounded border transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: state.hypothesis.trim() ? 'var(--gold-dim)' : 'transparent',
                  borderColor: state.hypothesis.trim() ? 'var(--gold)' : 'var(--text-faint)',
                  color: state.hypothesis.trim() ? 'var(--gold)' : 'var(--text-muted)',
                }}
              >
                Analyze Hypothesis →
              </motion.button>
            </div>
          </motion.div>

          {/* Sample hypotheses */}
          <motion.div variants={stagger.item}>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2.5 text-center">
              — Load a sample —
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {SAMPLE_HYPOTHESES.map((h, i) => (
                <motion.button
                  key={i}
                  onClick={() => updateState({ hypothesis: h })}
                  whileHover={{ x: 4, borderColor: 'rgba(200,146,26,0.4)' }}
                  className="text-left px-4 py-2.5 border border-[var(--border)] rounded text-xs text-[var(--text-muted)] leading-relaxed transition-colors hover:text-[var(--text-secondary)] hover:bg-[var(--gold-dim)] line-clamp-1"
                  style={{ fontFamily: 'var(--font-source-sans), sans-serif' }}
                >
                  <span className="text-[var(--gold)] font-mono mr-2">{String(i + 1).padStart(2, '0')}.</span>
                  {h}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p variants={stagger.item} className="text-center text-[9px] font-mono text-[var(--text-faint)] mt-10 tracking-[0.25em] uppercase">
            MIT Hackathon · Challenge 04: The AI Scientist · Fulcrum Science
          </motion.p>
        </motion.div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(200,146,26,0.04) 0%, transparent 70%)',
        }} />
      </div>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 h-screen flex flex-col border-r border-[var(--border)] px-3 py-5 w-[240px] shrink-0 overflow-y-auto"
        style={{ background: 'rgba(8,13,22,0.95)', backdropFilter: 'blur(16px)' }}
      >
        <div className="mb-5 px-2">
          <button
            onClick={reset}
            className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
          >
            ← New Hypothesis
          </button>
        </div>

        <div className="px-2 mb-4">
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5">Hypothesis</p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-4" style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic' }}>
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
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-2"
          >
            <div className="text-[9px] font-mono text-[var(--gold)] uppercase tracking-[0.2em] text-center py-2 border border-[var(--border)] rounded bg-[var(--gold-dim)]">
              ✓ Plan Complete
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 overflow-y-auto px-8 py-8"
        style={{ maxWidth: 'calc(100vw - 240px)' }}
      >
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">The AI Scientist</span>
            <AnimatePresence>
              {state.stage === 'checking' && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[9px] font-mono text-[var(--cyan)] tracking-wider"
                >
                  · scanning literature corpus…
                </motion.span>
              )}
              {state.stage === 'planning' && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[9px] font-mono text-[var(--cyan)] tracking-wider"
                >
                  · agents running…
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <h2 className="font-light" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.85rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Experiment Plan
          </h2>
        </div>

        {/* Literature result */}
        <AnimatePresence>
          {state.litResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">
                Literature Assessment
              </p>
              <LiteratureBanner result={state.litResult} />
            </motion.div>
          )}
        </AnimatePresence>

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
      </motion.main>
    </div>
  );
}
