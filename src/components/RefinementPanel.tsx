'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { NoveltyLevel } from '@/lib/types';
import { ExperimentDomain } from '@/lib/domainDetector';
import { getResourceSections, getDomainHighlights } from '@/lib/resources';

interface AgentLearning {
  agentId: string;
  agentLabel: string;
  agentIcon: string;
  corrections: string[];
}

interface Props {
  hypothesis: string;
  novelty: NoveltyLevel;
  signalText: string;
  domain: ExperimentDomain;
  onSelectHypothesis: (newHypothesis: string) => void;
}

const BEZIER: [number, number, number, number] = [0.22, 1, 0.36, 1];

function parseResponse(text: string): { prose: string; suggestions: string[] } {
  const lines = text.split('\n');
  const suggestions: string[] = [];
  const proseLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('> ')) {
      suggestions.push(line.slice(2).trim());
    } else {
      proseLines.push(line);
    }
  }
  return { prose: proseLines.join('\n').trim(), suggestions };
}

// ─── Resources section ────────────────────────────────────────────────────────

function ResourcesSection({ domain }: { domain: ExperimentDomain }) {
  const [expanded, setExpanded] = useState(false);
  const sections = getResourceSections();
  const highlights = getDomainHighlights(domain);

  return (
    <div
      className="border border-[var(--border)] rounded overflow-hidden mb-4"
      style={{ background: 'rgba(200,146,26,0.03)' }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--gold)]">
            📚 Protocol Resources &amp; Standards
          </span>
          {highlights.size > 0 && (
            <span
              className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
              style={{ borderColor: 'rgba(200,146,26,0.3)', color: 'var(--gold)', background: 'rgba(200,146,26,0.06)' }}
            >
              {highlights.size} domain-relevant
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp size={10} style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: BEZIER }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[var(--border)]" style={{ paddingTop: '0.75rem' }}>
              {sections.map(section => (
                <div key={section.category}>
                  <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1.5">
                    {section.category}
                  </p>
                  <div className="space-y-1">
                    {section.resources.map(resource => {
                      const isHighlighted = highlights.has(resource.name);
                      return (
                        <a
                          key={resource.name}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 group"
                          title={resource.description}
                        >
                          {isHighlighted && (
                            <span className="w-1 h-1 rounded-full bg-[var(--gold)] shrink-0" />
                          )}
                          {!isHighlighted && (
                            <span className="w-1 h-1 rounded-full bg-[var(--text-faint)] shrink-0" />
                          )}
                          <span
                            className="text-[10px] font-mono transition-colors group-hover:underline leading-tight"
                            style={{ color: isHighlighted ? 'var(--gold)' : 'var(--text-muted)' }}
                          >
                            {resource.name}
                          </span>
                          <ExternalLink
                            size={7}
                            className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Learnings section ────────────────────────────────────────────────────────

function LearningsSection({ hypothesis }: { hypothesis: string }) {
  const [state, setState] = useState<{ learnings: AgentLearning[]; loadedFor: string }>({
    learnings: [],
    loadedFor: '',
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/learnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hypothesis }),
    })
      .then(r => r.json())
      .then((data: { learnings: AgentLearning[] }) => {
        if (!cancelled) setState({ learnings: data.learnings ?? [], loadedFor: hypothesis });
      })
      .catch(() => { if (!cancelled) setState({ learnings: [], loadedFor: hypothesis }); });
    return () => { cancelled = true; };
  }, [hypothesis]);

  if (state.loadedFor !== hypothesis) return null;
  if (state.learnings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: BEZIER }}
      className="border border-[var(--border)] rounded overflow-hidden mb-4"
      style={{ background: 'rgba(34,211,238,0.03)', borderColor: 'rgba(34,211,238,0.15)' }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--cyan)]">
          🧠 Learnings from Similar Experiments
        </span>
        <span
          className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
          style={{ borderColor: 'rgba(34,211,238,0.25)', color: 'var(--cyan)', background: 'rgba(34,211,238,0.06)' }}
        >
          ↺ {state.learnings.reduce((n, l) => n + l.corrections.length, 0)} correction{state.learnings.reduce((n, l) => n + l.corrections.length, 0) !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {state.learnings.map(l => (
          <div key={l.agentId}>
            <p className="text-[8px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1.5">
              {l.agentIcon} {l.agentLabel}
            </p>
            <div className="space-y-1">
              {l.corrections.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-1.5 rounded text-[10px] leading-relaxed"
                  style={{ fontFamily: 'var(--font-source-sans), sans-serif', background: 'rgba(34,211,238,0.05)', color: 'var(--text-secondary)', borderLeft: '2px solid rgba(34,211,238,0.3)' }}
                >
                  <span className="text-[var(--cyan)] font-mono shrink-0 mt-px opacity-60">{String(i + 1).padStart(2, '0')}.</span>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RefinementPanel({ hypothesis, novelty, signalText, domain, onSelectHypothesis }: Props) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || isStreaming) return;

    setError(null);
    setResponse('');
    setIsStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis, novelty, signalText, message: question }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Refinement failed: ${res.status}`);
      if (!res.body) throw new Error('Empty response body');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload) as { text: string };
            setResponse(prev => prev + parsed.text);
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Refinement request failed');
    } finally {
      setIsStreaming(false);
    }
  }, [question, hypothesis, novelty, signalText, isStreaming]);

  const { prose, suggestions } = parseResponse(response);
  const hasResponse = response.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: BEZIER }}
      className="border border-[var(--border)] rounded-lg overflow-hidden mb-6"
      style={{ background: 'rgba(13,21,36,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(34,211,238,0.18)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border)]"
        style={{ background: 'rgba(34,211,238,0.04)', borderColor: 'rgba(34,211,238,0.15)' }}
      >
        <span className="text-base leading-none">🔬</span>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[var(--cyan)]">
          Hypothesis Refinement
        </span>
        <span
          className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ml-1"
          style={{ borderColor: 'rgba(34,211,238,0.25)', color: 'var(--cyan)', background: 'rgba(34,211,238,0.06)' }}
        >
          Human-in-the-loop
        </span>
      </div>

      <div className="px-5 py-4">
        {/* Context message */}
        <p
          className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-4"
          style={{ fontFamily: 'var(--font-source-sans), sans-serif' }}
        >
          {novelty === 'exact_match'
            ? 'This exact experiment has been published. Use the resources and learnings below to identify what angle remains genuinely unexplored.'
            : 'Similar work exists in this area. Review the resources, check prior learnings, then ask the advisor to generate differentiated reformulations.'}
        </p>

        {/* Resources */}
        <ResourcesSection domain={domain} />

        {/* Learnings from feedback store */}
        <LearningsSection hypothesis={hypothesis} />

        {/* Streaming response */}
        <AnimatePresence>
          {hasResponse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.35, ease: BEZIER }}
              className="mb-4 overflow-hidden"
            >
              {/* Analysis prose */}
              {prose && (
                <p
                  className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 pl-3"
                  style={{ fontFamily: 'var(--font-source-sans), sans-serif', borderLeft: '2px solid rgba(34,211,238,0.3)' }}
                >
                  {prose}
                  {isStreaming && suggestions.length === 0 && (
                    <motion.span
                      className="inline-block w-[5px] h-[11px] bg-[var(--cyan)] ml-0.5 align-text-bottom opacity-80"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  )}
                </p>
              )}

              {/* Reformulation suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2.5">
                    — Click to adopt a reformulation —
                  </p>
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08, ease: BEZIER }}
                      onClick={() => onSelectHypothesis(s)}
                      className="w-full text-left px-4 py-3 border rounded text-xs leading-relaxed transition-colors group"
                      style={{
                        fontFamily: 'var(--font-source-sans), sans-serif',
                        borderColor: 'rgba(34,211,238,0.2)',
                        background: 'rgba(34,211,238,0.03)',
                        color: 'var(--text-secondary)',
                      }}
                      whileHover={{ borderColor: 'rgba(34,211,238,0.5)', backgroundColor: 'rgba(34,211,238,0.07)' }}
                    >
                      <span className="text-[var(--cyan)] font-mono text-[9px] mr-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        {String(i + 1).padStart(2, '0')}›
                      </span>
                      {s}
                    </motion.button>
                  ))}

                  {isStreaming && suggestions.length < 3 && (
                    <div className="flex items-center gap-1.5 px-4 py-2">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span
                          key={i}
                          className="w-1 h-1 rounded-full bg-[var(--cyan)]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-red-400 text-xs font-mono mb-3">{error}</p>
        )}

        {/* Input */}
        <div
          className="border border-[var(--border)] rounded overflow-hidden"
          style={{ background: 'rgba(8,13,22,0.6)' }}
        >
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && question.trim() && !isStreaming) {
                handleSubmit();
              }
            }}
            placeholder="Ask about differentiation strategies, unexplored angles, or parameter variations…"
            rows={2}
            className="w-full px-4 py-3 bg-transparent text-xs text-[var(--text-primary)] leading-relaxed resize-none outline-none placeholder:text-[var(--text-muted)]"
            style={{ fontFamily: 'var(--font-source-sans), sans-serif' }}
          />
          <div className="px-3 pb-2.5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-[var(--text-faint)]">⌘↵ to send</span>
            <motion.button
              onClick={handleSubmit}
              disabled={!question.trim() || isStreaming}
              whileHover={question.trim() && !isStreaming ? { scale: 1.02 } : {}}
              whileTap={question.trim() && !isStreaming ? { scale: 0.98 } : {}}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: question.trim() && !isStreaming ? 'rgba(34,211,238,0.5)' : 'var(--border)',
                color: question.trim() && !isStreaming ? 'var(--cyan)' : 'var(--text-muted)',
                background: question.trim() && !isStreaming ? 'rgba(34,211,238,0.06)' : 'transparent',
              }}
            >
              {isStreaming ? (
                <>
                  <motion.span
                    className="w-1 h-1 rounded-full bg-[var(--cyan)]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  Thinking…
                </>
              ) : (
                <>
                  <Send size={9} />
                  Ask Advisor
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
