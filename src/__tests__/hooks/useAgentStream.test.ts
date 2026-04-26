import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentStream } from '@/hooks/useAgentStream';

function makeSseStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useAgentStream', () => {
  it('initialises with empty sections', () => {
    const { result } = renderHook(() => useAgentStream());
    expect(result.current.sections).toEqual({});
  });

  it('resetSections clears all sections', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: makeSseStream([
        'data: {"text":"## Protocol\\n\\n"}\n\n',
        'data: [DONE]\n\n',
      ]),
    } as unknown as Response);

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.streamAgent('protocol', 'test hypothesis', 'biosensor');
    });

    expect(result.current.sections['protocol']).toContain('Protocol');

    act(() => { result.current.resetSections(); });
    expect(result.current.sections).toEqual({});
  });

  it('accumulates text deltas from SSE stream', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: makeSseStream([
        'data: {"text":"## Materials"}\n\n',
        'data: {"text":"\\n\\nStep 1"}\n\n',
        'data: [DONE]\n\n',
      ]),
    } as unknown as Response);

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.streamAgent('materials', 'antibody biosensor hypothesis', 'biosensor');
    });

    expect(result.current.sections['materials']).toBe('## Materials\n\nStep 1');
  });

  it('ignores malformed SSE lines', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: makeSseStream([
        'data: {"text":"Good"}\n\n',
        'data: not-json\n\n',
        'data: {"text":" content"}\n\n',
        'data: [DONE]\n\n',
      ]),
    } as unknown as Response);

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.streamAgent('budget', 'test hypothesis', 'general');
    });

    expect(result.current.sections['budget']).toBe('Good content');
  });

  it('throws when response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
    } as unknown as Response);

    const { result } = renderHook(() => useAgentStream());

    await expect(
      act(async () => {
        await result.current.streamAgent('timeline', 'test hypothesis', 'general');
      })
    ).rejects.toThrow('502');
  });

  it('throws when body is null', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: null,
    } as unknown as Response);

    const { result } = renderHook(() => useAgentStream());

    await expect(
      act(async () => {
        await result.current.streamAgent('validation', 'test hypothesis', 'general');
      })
    ).rejects.toThrow();
  });

  it('calls /api/plan/<agentId> with hypothesis and domain in body', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: makeSseStream(['data: [DONE]\n\n']),
    } as unknown as Response);

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.streamAgent('protocol', 'My hypothesis', 'biosensor');
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/plan/protocol',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('My hypothesis'),
      })
    );
  });
});
