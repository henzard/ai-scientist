import { useState, useCallback } from 'react';
import { AgentId } from '@/lib/types';

export function useAgentStream() {
  const [sections, setSections] = useState<Partial<Record<AgentId, string>>>({});

  const streamAgent = useCallback(async (agentId: AgentId, hypothesis: string, domain: string) => {
    const res = await fetch(`/api/plan/${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hypothesis, domain }),
    });

    if (!res.ok) throw new Error(`Agent ${agentId} failed: ${res.status}`);
    if (!res.body) throw new Error(`Agent ${agentId} returned empty body`);

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
          setSections(prev => ({ ...prev, [agentId]: (prev[agentId] ?? '') + parsed.text }));
        } catch {
          // Ignore malformed SSE lines
        }
      }
    }
  }, []);

  const resetSections = useCallback(() => setSections({}), []);

  return { sections, streamAgent, resetSections };
}
