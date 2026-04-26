import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedback } from '@/hooks/useFeedback';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useFeedback', () => {
  it('initialises with empty feedbackState', () => {
    const { result } = renderHook(() => useFeedback('biosensor', 'test hypothesis'));
    expect(result.current.feedbackState).toEqual({});
  });

  it('sets status to submitting then submitted on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const { result } = renderHook(() => useFeedback('biosensor', 'antibody biosensor blood detection'));

    await act(async () => {
      await result.current.submitFeedback('protocol', 'up', '');
    });

    expect(result.current.feedbackState['protocol']?.status).toBe('submitted');
    expect(fetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({ method: 'POST' }));
  });

  it('sends correct payload to /api/feedback', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    const { result } = renderHook(() => useFeedback('microbiome', 'Lactobacillus gut permeability study'));

    await act(async () => {
      await result.current.submitFeedback('protocol', 'down', 'Buffer pH should be 7.4');
    });

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/feedback');
    const body = JSON.parse(options.body as string);
    expect(body.agentId).toBe('protocol');
    expect(body.rating).toBe('down');
    expect(body.correction).toBe('Buffer pH should be 7.4');
    expect(body.domain).toBe('microbiome');
  });

  it('sets status to error when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFeedback('biosensor', 'antibody biosensor detection'));

    await act(async () => {
      await result.current.submitFeedback('materials', 'down', 'Wrong catalog number');
    });

    expect(result.current.feedbackState['materials']?.status).toBe('error');
  });

  it('sets status to error when response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response);

    const { result } = renderHook(() => useFeedback('biosensor', 'antibody detection test'));

    await act(async () => {
      await result.current.submitFeedback('budget', 'up', '');
    });

    expect(result.current.feedbackState['budget']?.status).toBe('error');
  });

  it('tracks status independently per agentId', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    const { result } = renderHook(() => useFeedback('biosensor', 'antibody biosensor blood detection'));

    await act(async () => {
      await result.current.submitFeedback('protocol', 'up', '');
      await result.current.submitFeedback('timeline', 'down', 'Timeline too long');
    });

    expect(result.current.feedbackState['protocol']?.status).toBe('submitted');
    expect(result.current.feedbackState['timeline']?.status).toBe('submitted');
  });
});
