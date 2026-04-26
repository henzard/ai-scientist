# Per-Section Markdown Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `.md` download button to each agent output section header, appearing once streaming completes.

**Architecture:** Extract the existing `downloadMarkdown` helper from `page.tsx` into `src/lib/exportUtils.ts`. Both the global export and the new per-section button import from there. `PlanSection` renders the button in its `ml-auto` header row when `status === 'done'`.

**Tech Stack:** React, TypeScript, Lucide React (`Download` icon), Vitest + @testing-library/react

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/lib/exportUtils.ts` | `downloadMarkdown(content, filename)` utility |
| Create | `src/__tests__/lib/exportUtils.test.ts` | Unit tests for the utility |
| Modify | `src/app/page.tsx` | Remove inline `downloadMarkdown`; import from `exportUtils` |
| Modify | `src/components/PlanSection.tsx` | Add Download button to header; import `Download` + `downloadMarkdown` |
| Modify | `src/__tests__/components/PlanSection.test.tsx` | Tests for button visibility and click behaviour |

---

### Task 1: Create `exportUtils.ts` with failing tests first

**Files:**
- Create: `src/__tests__/lib/exportUtils.test.ts`
- Create: `src/lib/exportUtils.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/lib/exportUtils.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadMarkdown } from '@/lib/exportUtils';

describe('downloadMarkdown', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    clickSpy = vi.fn();

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLElement;
      }
      return document.createElement(tag);
    });
  });

  it('creates a Blob with text/markdown MIME type', () => {
    const BlobSpy = vi.spyOn(global, 'Blob').mockImplementation((...args) => new (vi.importActual('global') as { Blob: typeof Blob }).Blob?.(...args) ?? ({} as Blob));
    downloadMarkdown('# Hello', 'test.md');
    expect(createObjectURL).toHaveBeenCalled();
  });

  it('sets the anchor download attribute to the given filename', () => {
    let capturedAnchor: { href: string; download: string; click: () => void } | null = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        capturedAnchor = { href: '', download: '', click: clickSpy };
        return capturedAnchor as unknown as HTMLElement;
      }
      return document.createElement(tag);
    });

    downloadMarkdown('# Hello', 'protocol.md');
    expect(capturedAnchor?.download).toBe('protocol.md');
  });

  it('calls click() on the anchor', () => {
    downloadMarkdown('content', 'budget.md');
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('revokes the object URL after clicking', () => {
    downloadMarkdown('content', 'timeline.md');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/exportUtils.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/exportUtils'`

- [ ] **Step 3: Create `src/lib/exportUtils.ts`**

```typescript
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/lib/exportUtils.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/exportUtils.ts src/__tests__/lib/exportUtils.test.ts
git commit -m "feat: extract downloadMarkdown into exportUtils"
```

---

### Task 2: Update `page.tsx` to use `exportUtils`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Remove the inline function and update the import**

In `src/app/page.tsx`, make these two changes:

**Add** this import near the top (after the `@/lib/` imports):
```typescript
import { downloadMarkdown } from '@/lib/exportUtils';
```

**Delete** lines 51–59 (the entire inline `downloadMarkdown` function):
```typescript
// DELETE this block:
function downloadMarkdown(content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'experiment-plan.md';
  a.click();
  URL.revokeObjectURL(url);
}
```

**Update** the `handleDownload` callback to pass the filename (it now needs two arguments):
```typescript
const handleDownload = useCallback(() => {
  downloadMarkdown(buildMarkdown(state.hypothesis, sections), 'experiment-plan.md');
}, [state.hypothesis, sections]);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: page.tsx uses shared downloadMarkdown from exportUtils"
```

---

### Task 3: Add download button to `PlanSection` with tests

**Files:**
- Modify: `src/components/PlanSection.tsx`
- Modify: `src/__tests__/components/PlanSection.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add this import at the top of `src/__tests__/components/PlanSection.test.tsx`:

```typescript
import { vi, beforeEach } from 'vitest'; // already present — verify, don't duplicate
```

Add a new mock at the top of the file, after the existing imports:

```typescript
vi.mock('@/lib/exportUtils', () => ({
  downloadMarkdown: vi.fn(),
}));
import { downloadMarkdown } from '@/lib/exportUtils';
```

Add a `beforeEach` before the existing `describe` blocks (or inside the new describe):

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

Add a new `describe` block at the end of the file:

```typescript
describe('PlanSection — download button', () => {
  it('does NOT render a download button when status is running', () => {
    render(<PlanSection {...baseProps} content="Streaming..." status="running" />);
    expect(screen.queryByRole('button', { name: /\.md/i })).not.toBeInTheDocument();
  });

  it('renders a download button when status is done', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nDone." status="done" />);
    expect(screen.getByRole('button', { name: /\.md/i })).toBeInTheDocument();
  });

  it('calls downloadMarkdown with correct filename on click', async () => {
    const user = userEvent.setup();
    render(<PlanSection {...baseProps} content="## Protocol\n\nDone." status="done" />);
    await user.click(screen.getByRole('button', { name: /\.md/i }));
    expect(downloadMarkdown).toHaveBeenCalledWith(
      '## Protocol\n\nDone.',
      'protocol.md'
    );
  });
});
```

Also add `userEvent` to the imports at the top of the test file:
```typescript
import userEvent from '@testing-library/user-event';
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/components/PlanSection.test.tsx
```

Expected: FAIL on the three new download tests — button not found / `downloadMarkdown` not called

- [ ] **Step 3: Update `PlanSection.tsx`**

Add these two imports to `src/components/PlanSection.tsx`:

```typescript
import { Download } from 'lucide-react';
import { downloadMarkdown } from '@/lib/exportUtils';
```

In the `ml-auto` flex row (currently starting at line 50), add the download button **before** the `status === 'done'` complete label:

```tsx
<div className="ml-auto flex items-center gap-2">
  {status === 'running' && (
    <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
    <>
      <button
        onClick={() => downloadMarkdown(content, `${agent.id}.md`)}
        title={`Download ${agent.label} as Markdown`}
        aria-label=".md"
        className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-[var(--border)] rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--gold)] hover:bg-[var(--gold-dim)] transition-all"
      >
        <Download size={9} />
        .md
      </button>
      <motion.span
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-[9px] font-mono text-[var(--gold)] tracking-wider"
      >
        ✓ complete
      </motion.span>
    </>
  )}
</div>
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass, including the 3 new download tests

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add src/components/PlanSection.tsx src/__tests__/components/PlanSection.test.tsx
git commit -m "feat: per-section markdown download button in PlanSection header"
```

- [ ] **Step 7: Push**

```bash
git push origin master
```
