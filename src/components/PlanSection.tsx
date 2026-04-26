'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AgentDefinition, AgentStatus } from '@/lib/types';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  agent: AgentDefinition;
  content: string;
  status: AgentStatus | undefined;
}

export default function PlanSection({ agent, content, status }: Props) {
  if (!content && status !== 'running') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="border border-[var(--border)] rounded-lg overflow-hidden mb-4"
      style={{ background: 'rgba(13,21,36,0.75)', backdropFilter: 'blur(8px)' }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border)]" style={{ background: 'var(--gold-dim)' }}>
        <span className="text-base leading-none">{agent.icon}</span>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
          {agent.label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {status === 'running' && (
            <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Three-dot pulse */}
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
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] font-mono text-[var(--gold)] tracking-wider"
            >
              ✓ complete
            </motion.span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.div
              key="rendered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MarkdownRenderer content={content} />
            </motion.div>
          ) : (
            <motion.pre
              key="streaming"
              className="text-[var(--cyan)] text-xs leading-relaxed whitespace-pre-wrap font-mono opacity-80"
            >
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
      </div>
    </motion.section>
  );
}
