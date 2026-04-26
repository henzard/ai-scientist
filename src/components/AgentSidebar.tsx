'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
      <span className="relative flex h-2 w-2 shrink-0">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-[var(--cyan)]"
          animate={{ scale: [1, 2], opacity: [0.7, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--cyan)]" />
      </span>
    );
  }
  if (status === 'done') {
    return (
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-[var(--gold)] text-xs leading-none shrink-0"
      >
        ✓
      </motion.span>
    );
  }
  return <span className="w-2 h-2 rounded-full bg-[var(--text-faint)] shrink-0" />;
}

function Pill({ icon, label, status, isActive }: { icon: string; label: string; status: AgentStatus | undefined; isActive: boolean }) {
  return (
    <motion.div
      animate={{
        background: isActive ? 'rgba(200,146,26,0.1)' : 'transparent',
        borderColor: isActive ? 'rgba(200,146,26,0.3)' : 'transparent',
      }}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded border text-[11px] font-mono transition-colors"
    >
      <StatusDot status={status} />
      <span className={
        status === 'running' ? 'text-[var(--cyan)]' :
        status === 'done' ? 'text-[var(--gold)]' :
        'text-[var(--text-muted)]'
      }>
        {icon} {label}
      </span>
    </motion.div>
  );
}

export default function AgentSidebar({ agents, agentStatus, activeAgent, litDone, onGeneratePlan, planStarted }: Props) {
  return (
    <aside className="flex flex-col gap-0.5">
      <Pill icon="🔬" label="Literature QC" status={agentStatus['lit']} isActive={activeAgent === 'lit'} />
      <div className="border-t border-[var(--border)] my-2" />
      {agents.map(agent => (
        <Pill key={agent.id} icon={agent.icon} label={agent.label} status={agentStatus[agent.id]} isActive={activeAgent === agent.id} />
      ))}

      <AnimatePresence>
        {litDone && !planStarted && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={onGeneratePlan}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-5 mx-0.5 px-3 py-2.5 text-[10px] font-mono font-semibold tracking-[0.15em] uppercase border border-[var(--border)] text-[var(--gold)] rounded bg-[var(--gold-dim)] hover:bg-[rgba(200,146,26,0.15)] transition-colors"
          >
            Generate Full Plan →
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
