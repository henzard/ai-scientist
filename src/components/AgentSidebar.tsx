'use client';

import { AgentId, AgentStatus, AgentDefinition } from '@/lib/types';

interface Props {
  agents: AgentDefinition[];
  agentStatus: Partial<Record<AgentId | 'lit', AgentStatus>>;
  activeAgent: AgentId | 'lit' | null;
  litDone: boolean;
  onGeneratePlan: () => void;
  planStarted: boolean;
}

function StatusDot({ status }: { status: AgentStatus | undefined }) {
  if (status === 'running') {
    return (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--cyan)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--cyan)]" />
      </span>
    );
  }
  if (status === 'done') {
    return <span className="text-[var(--gold)] text-xs leading-none">✓</span>;
  }
  return <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] opacity-40" />;
}

export default function AgentSidebar({
  agents, agentStatus, activeAgent, litDone, onGeneratePlan, planStarted
}: Props) {
  return (
    <aside className="w-[215px] shrink-0 flex flex-col gap-1 pt-1">
      {/* Literature check pill */}
      <div className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-mono transition-colors ${
        activeAgent === 'lit' ? 'bg-[var(--gold-dim)] border border-[var(--border)]' : ''
      }`}>
        <StatusDot status={agentStatus['lit']} />
        <span className={
          agentStatus['lit'] === 'running' ? 'text-[var(--cyan)]' :
          agentStatus['lit'] === 'done' ? 'text-[var(--gold)]' :
          'text-[var(--text-muted)]'
        }>
          🔬 Literature QC
        </span>
      </div>

      <div className="border-t border-[var(--border)] my-2" />

      {agents.map(agent => {
        const status = agentStatus[agent.id];
        const isActive = activeAgent === agent.id;
        return (
          <div
            key={agent.id}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-mono transition-colors ${
              isActive ? 'bg-[var(--gold-dim)] border border-[var(--border)]' : ''
            }`}
          >
            <StatusDot status={status} />
            <span className={
              status === 'running' ? 'text-[var(--cyan)]' :
              status === 'done' ? 'text-[var(--gold)]' :
              'text-[var(--text-muted)]'
            }>
              {agent.icon} {agent.label}
            </span>
          </div>
        );
      })}

      {litDone && !planStarted && (
        <button
          onClick={onGeneratePlan}
          className="mt-4 mx-1 px-3 py-2.5 text-xs font-mono font-semibold tracking-wider uppercase bg-[var(--gold-dim)] border border-[var(--border)] text-[var(--gold)] rounded hover:bg-[rgba(200,146,26,0.15)] transition-colors"
        >
          Generate Full Plan →
        </button>
      )}
    </aside>
  );
}
