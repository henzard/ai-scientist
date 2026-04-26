# Per-Section Markdown Download — Design Spec

**Date:** 2026-04-26  
**Feature:** Download button on each agent output section  
**Scope:** Small, self-contained UI addition to `PlanSection`

---

## Problem

The global "Copy / .md" export in the page header captures the full plan. Judges and scientists often want a single section — the protocol, the budget — to paste into a lab notebook or share with a colleague. There is currently no per-section export path.

---

## Decision

**Format:** Markdown only (`.md`). Consistent with the existing global export; content is already authored as Markdown.

**Placement:** In the `PlanSection` header's `ml-auto` flex row, to the left of the "✓ complete" status label. Appears only when `status === 'done'`; hidden during streaming.

**Approach:** Inline button in the header — no new components, no new props, no new hooks.

---

## Architecture

### New file: `src/lib/exportUtils.ts`

Extract the existing `downloadMarkdown` function from `src/app/page.tsx` into a shared utility:

```ts
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

Both `page.tsx` (global export) and `PlanSection` (per-section) import from here.

### Changes to `src/components/PlanSection.tsx`

- Import `Download` from `lucide-react`
- Import `downloadMarkdown` from `@/lib/exportUtils`
- In the `ml-auto` flex row, when `status === 'done'`, render a download button before the "✓ complete" label:

```tsx
{status === 'done' && (
  <button
    onClick={() => downloadMarkdown(content, `${agent.id}.md`)}
    title={`Download ${agent.label} as Markdown`}
    className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider
               border border-[var(--border)] rounded text-[var(--text-muted)]
               hover:text-[var(--text-secondary)] hover:border-[var(--gold)] hover:bg-[var(--gold-dim)]
               transition-all"
  >
    <Download size={9} />
    .md
  </button>
)}
```

### Changes to `src/app/page.tsx`

- Remove the inline `downloadMarkdown` function definition
- Import `downloadMarkdown` from `@/lib/exportUtils`

---

## File naming

| `agent.id` | Filename |
|---|---|
| `protocol` | `protocol.md` |
| `materials` | `materials.md` |
| `budget` | `budget.md` |
| `timeline` | `timeline.md` |
| `validation` | `validation.md` |

---

## Behaviour

| State | Button visible |
|---|---|
| `pending` | No |
| `running` (streaming) | No |
| `done` | Yes |
| `error` | No |

---

## Testing

- Unit: `exportUtils.ts` — `downloadMarkdown` creates a Blob, calls `URL.createObjectURL`, clicks an anchor, calls `URL.revokeObjectURL`
- Component: `PlanSection.test.tsx` — button absent during `running`, present and functional when `status === 'done'`; clicking calls download with correct filename
- E2E: Not required — `URL.createObjectURL` is not available in Playwright's test runner without mocking; the unit test provides sufficient coverage

---

## Out of scope

- Copy-to-clipboard per section (global Copy button already covers full plan)
- Plain text / PDF export
- Section-level share link
