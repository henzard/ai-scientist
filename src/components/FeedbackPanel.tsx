'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Send, CheckCircle } from 'lucide-react';
import { AgentId, FeedbackRating } from '@/lib/types';
import { FeedbackStatus } from '@/hooks/useFeedback';

interface Props {
  agentId: AgentId;
  agentLabel: string;
  feedbackStatus: FeedbackStatus;
  onSubmit: (agentId: AgentId, rating: FeedbackRating, correction: string) => Promise<void>;
}

const BEZIER: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function FeedbackPanel({ agentId, agentLabel, feedbackStatus, onSubmit }: Props) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [correction, setCorrection] = useState('');

  if (feedbackStatus === 'submitted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-[var(--border)] mt-5 pt-3 flex items-start gap-2"
      >
        <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
        <p className="text-[10px] font-mono text-[var(--gold)] leading-relaxed">
          Feedback recorded — will apply to the next <span className="opacity-70">{agentLabel}</span> plan for similar experiments.
        </p>
      </motion.div>
    );
  }

  const isSubmitting = feedbackStatus === 'submitting';
  const canSubmit = rating !== null;

  return (
    <div className="border-t border-[var(--border)] mt-5 pt-3">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Rate this section
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRating('up')}
            title="This looks correct"
            className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-all"
            style={{
              borderColor: rating === 'up' ? 'var(--gold)' : 'rgba(200,146,26,0.2)',
              background: rating === 'up' ? 'var(--gold-dim)' : 'transparent',
              color: rating === 'up' ? 'var(--gold)' : 'var(--text-muted)',
            }}
          >
            <ThumbsUp size={10} />
            <span>Approve</span>
          </button>

          <button
            onClick={() => setRating('down')}
            title="Something needs correcting"
            className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-all"
            style={{
              borderColor: rating === 'down' ? 'rgba(248,113,113,0.5)' : 'rgba(248,113,113,0.15)',
              background: rating === 'down' ? 'rgba(248,113,113,0.06)' : 'transparent',
              color: rating === 'down' ? 'rgb(248,113,113)' : 'var(--text-muted)',
            }}
          >
            <ThumbsDown size={10} />
            <span>Correct</span>
          </button>
        </div>

        {canSubmit && (
          <button
            onClick={() => onSubmit(agentId, rating!, correction)}
            disabled={isSubmitting}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-all disabled:opacity-40"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }}
          >
            <Send size={9} />
            <span>{isSubmitting ? 'Saving…' : 'Submit feedback'}</span>
          </button>
        )}
      </div>

      {/* Correction textarea — slides in when 'down' is selected */}
      <AnimatePresence>
        {rating === 'down' && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: BEZIER }}
            className="overflow-hidden"
          >
            <textarea
              value={correction}
              onChange={e => setCorrection(e.target.value)}
              placeholder="Describe what was wrong or how it should be improved. This correction will be applied to future plans for similar experiments…"
              rows={3}
              className="mt-2.5 w-full text-[11px] font-mono leading-relaxed resize-none outline-none rounded border px-3 py-2 bg-transparent placeholder:text-[var(--text-faint)]"
              style={{
                borderColor: 'rgba(248,113,113,0.2)',
                color: 'var(--text-secondary)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {feedbackStatus === 'error' && (
        <p className="mt-1.5 text-[10px] font-mono text-red-400">Failed to save feedback — try again.</p>
      )}
    </div>
  );
}
