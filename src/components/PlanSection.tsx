'use client';

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
    <section className="border border-[var(--border)] rounded bg-[var(--surface)] overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--gold-dim)]">
        <span className="text-lg">{agent.icon}</span>
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[var(--gold)]">
          {agent.label}
        </span>
        {status === 'running' && (
          <span className="ml-auto text-[var(--cyan)] text-xs font-mono animate-pulse">streaming…</span>
        )}
        {status === 'done' && (
          <span className="ml-auto text-[var(--gold)] text-xs font-mono">✓ complete</span>
        )}
      </div>
      <div className="px-5 py-4">
        {status === 'done' ? (
          <MarkdownRenderer content={content} />
        ) : (
          <pre className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {content}
            {status === 'running' && (
              <span className="inline-block w-2 h-4 bg-[var(--cyan)] ml-0.5 animate-pulse" />
            )}
          </pre>
        )}
      </div>
    </section>
  );
}
