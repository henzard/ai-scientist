'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import { AgentDefinition, AgentId, AgentStatus, FeedbackRating } from '@/lib/types';
import { FeedbackStatus } from '@/hooks/useFeedback';
import { downloadMarkdown } from '@/lib/exportUtils';
import MarkdownRenderer from './MarkdownRenderer';
import FeedbackPanel from './FeedbackPanel';

interface Props {
  agent: AgentDefinition;
  content: string;
  status: AgentStatus | undefined;
  feedbackStatus: FeedbackStatus;
  onFeedbackSubmit: (agentId: AgentId, rating: FeedbackRating, correction: string) => Promise<void>;
  hasPriorCorrections?: boolean;
}

const BEZIER: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function PlanSection({
  agent, content, status, feedbackStatus, onFeedbackSubmit, hasPriorCorrections,
}: Props) {
  if (!content && status !== 'running') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: BEZIER }}
      className="border border-[var(--border)] rounded-lg overflow-hidden mb-4"
      style={{ background: 'rgba(13,21,36,0.75)', backdropFilter: 'blur(8px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border)]" style={{ background: 'var(--gold-dim)' }}>
        <span className="text-base leading-none">{agent.icon}</span>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
          {agent.label}
        </span>

        {/* "Prior corrections active" indicator */}
        {hasPriorCorrections && status !== 'running' && (
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
            style={{ borderColor: 'rgba(34,211,238,0.3)', color: 'var(--cyan)', background: 'rgba(34,211,238,0.06)' }}
          >
            ↺ learning applied
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {status === 'running' && (
            <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-[var(--cyan)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
              ))}
              <span className="text-[9px] font-mono text-[var(--cyan)] tracking-wider ml-0.5">streaming</span>
            </motion.div>
          )}
          {status === 'done' && (
            <>
              <button
                onClick={() => downloadMarkdown(content, `${agent.id}.md`)}
                title={`Download ${agent.label} as Markdown`}
                aria-label={`Download ${agent.label} as Markdown`}
                className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-[var(--border)] rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--gold)] hover:bg-[var(--gold-dim)] transition-all"
              >
                <Download size={9} aria-hidden />
                .md
              </button>
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[9px] font-mono text-[var(--gold)] tracking-wider"
              >
                ✓ complete
              </motion.span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.div key="rendered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <MarkdownRenderer content={content} />
            </motion.div>
          ) : (
            <motion.pre key="streaming" className="text-[var(--cyan)] text-xs leading-relaxed whitespace-pre-wrap font-mono opacity-80">
              {content}
              {status === 'running' && (
                <motion.span
                  className="inline-block w-[7px] h-[13px] bg-[var(--cyan)] ml-0.5 align-text-bottom"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                />
              )}
            </motion.pre>
          )}
        </AnimatePresence>

        {/* Scientist review panel — only after streaming completes */}
        <AnimatePresence>
          {status === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: BEZIER }}
            >
              <FeedbackPanel
                agentId={agent.id}
                agentLabel={agent.label}
                feedbackStatus={feedbackStatus}
                onSubmit={onFeedbackSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
