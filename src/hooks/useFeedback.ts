'use client';

import { useState, useCallback } from 'react';
import { AgentId, FeedbackRating } from '@/lib/types';

export type FeedbackStatus = 'idle' | 'submitting' | 'submitted' | 'error';

interface AgentFeedbackState {
  status: FeedbackStatus;
  error: string | null;
}

export function useFeedback(domain: string, hypothesis: string) {
  const [feedbackState, setFeedbackState] = useState<Partial<Record<AgentId, AgentFeedbackState>>>({});

  const submitFeedback = useCallback(async (
    agentId: AgentId,
    rating: FeedbackRating,
    correction: string
  ): Promise<void> => {
    setFeedbackState(prev => ({ ...prev, [agentId]: { status: 'submitting', error: null } }));

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, agentId, rating, correction, hypothesis }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error: string };
        throw new Error(body.error);
      }
      setFeedbackState(prev => ({ ...prev, [agentId]: { status: 'submitted', error: null } }));
    } catch (err) {
      setFeedbackState(prev => ({
        ...prev,
        [agentId]: { status: 'error', error: err instanceof Error ? err.message : 'Failed to submit' },
      }));
    }
  }, [domain, hypothesis]);

  return { feedbackState, submitFeedback };
}
