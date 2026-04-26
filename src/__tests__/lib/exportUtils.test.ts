import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates a Blob with text/markdown MIME type', () => {
    const BlobSpy = vi.spyOn(global, 'Blob');
    downloadMarkdown('# Hello', 'test.md');
    expect(BlobSpy).toHaveBeenCalledWith(
      ['# Hello'],
      { type: 'text/markdown' }
    );
    expect(createObjectURL).toHaveBeenCalled();
  });

  it('sets the anchor download attribute to the given filename', () => {
    const capturedElement: { href: string; download: string; click: typeof clickSpy } = { href: '', download: '', click: clickSpy };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return capturedElement as HTMLElement;
      }
      return document.createElement(tag);
    });

    downloadMarkdown('# Hello', 'protocol.md');
    expect(capturedElement.download).toBe('protocol.md');
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
