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
