import React from 'react';

interface Props {
  content: string;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split on **bold** and `code` patterns
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  segments.forEach((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      parts.push(
        <strong key={idx} className="text-[var(--text-primary)] font-semibold">
          {seg.slice(2, -2)}
        </strong>
      );
    } else if (seg.startsWith('`') && seg.endsWith('`')) {
      parts.push(
        <code key={idx} className="font-mono text-[var(--cyan)] bg-[rgba(34,211,238,0.08)] px-1 py-0.5 rounded text-[0.85em]">
          {seg.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(seg);
    }
  });
  return parts;
}

function renderTable(lines: string[]): React.ReactNode {
  const rows = lines.map(l => l.split('|').map(c => c.trim()).filter(c => c !== ''));
  const header = rows[0];
  const body = rows.slice(2);
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th
                key={i}
                className="text-left px-3 py-2 border border-[var(--border)] text-[var(--gold)] font-semibold bg-[var(--gold-dim)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--border)] hover:bg-[rgba(200,146,26,0.04)]">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-[var(--text-secondary)] border border-[var(--border)]">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarkdownRenderer({ content }: Props) {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      nodes.push(
        <h3 key={i} className="text-xl font-light text-[var(--gold)] border-b border-[var(--border)] pb-2 mb-4 mt-6 font-serif tracking-wide">
          {line.slice(3)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      nodes.push(
        <h4 key={i} className="text-base font-semibold text-[var(--text-primary)] mt-4 mb-2 uppercase tracking-wider text-xs">
          {line.slice(4)}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('| ')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(<React.Fragment key={`table-${i}`}>{renderTable(tableLines)}</React.Fragment>);
      continue;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\d+)\.\s+(.*)/);
        if (!m) break;
        listItems.push(
          <li key={i} className="flex gap-3 mb-2">
            <span className="text-[var(--gold)] font-mono font-semibold min-w-[1.5rem] shrink-0">{m[1]}.</span>
            <span className="text-[var(--text-secondary)]">{parseInline(m[2])}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="my-3 space-y-1 list-none">{listItems}</ol>);
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(
          <li key={i} className="flex gap-2 mb-1.5">
            <span className="text-[var(--gold)] mt-1.5 shrink-0">▸</span>
            <span className="text-[var(--text-secondary)]">{parseInline(lines[i].slice(2))}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="my-3 space-y-0.5 list-none">{listItems}</ul>);
      continue;
    }

    if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    nodes.push(
      <p key={i} className="text-[var(--text-secondary)] leading-relaxed mb-2">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="text-sm leading-relaxed">{nodes}</div>;
}
