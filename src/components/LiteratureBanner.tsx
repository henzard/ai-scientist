'use client';

import { LiteratureResult } from '@/lib/types';

interface Props {
  result: LiteratureResult;
}

const NOVELTY_CONFIG = {
  not_found: {
    dot: 'bg-emerald-400',
    label: 'NOVEL — No matching protocol found',
    labelColor: 'text-emerald-400',
    border: 'border-emerald-400/20',
    bg: 'bg-emerald-400/5',
  },
  similar_exists: {
    dot: 'bg-amber-400',
    label: 'SIMILAR WORK EXISTS',
    labelColor: 'text-amber-400',
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/5',
  },
  exact_match: {
    dot: 'bg-red-400',
    label: 'EXACT MATCH FOUND',
    labelColor: 'text-red-400',
    border: 'border-red-400/20',
    bg: 'bg-red-400/5',
  },
};

export default function LiteratureBanner({ result }: Props) {
  const cfg = NOVELTY_CONFIG[result.novelty];

  return (
    <div className={`rounded border ${cfg.border} ${cfg.bg} p-4 mb-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
        <span className={`text-xs font-mono font-semibold tracking-widest uppercase ${cfg.labelColor}`}>
          {cfg.label}
        </span>
      </div>
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">
        {result.signal_text}
      </p>
      {result.references.length > 0 && (
        <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
          {result.references.map((ref, i) => (
            <div key={i} className="font-mono text-xs text-[var(--text-muted)]">
              <span className="text-[var(--gold)]">[{i + 1}]</span>{' '}
              {ref.authors} ({ref.year}). {ref.title}.{' '}
              <em className="text-[var(--text-secondary)]">{ref.journal}</em>.
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
