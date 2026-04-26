import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RefinementPanel from '@/components/RefinementPanel';

const mockSelectHypothesis = vi.fn();

const defaultProps = {
  hypothesis: 'A paper-based CRP biosensor detects C-reactive protein below 0.5 mg/L.',
  novelty: 'similar_exists' as const,
  signalText: 'Related biosensor work has been published.',
  domain: 'biosensor' as const,
  onSelectHypothesis: mockSelectHypothesis,
};

function makeSseStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(event));
      controller.close();
    },
  });
}

function mockFetch(overrides?: Record<string, unknown>) {
  vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
    const path = typeof url === 'string' ? url : url.toString();
    if (path.includes('/api/learnings')) {
      return {
        ok: true,
        json: async () => ({ learnings: [] }),
      } as unknown as Response;
    }
    return { ok: true, body: makeSseStream(['data: [DONE]\n\n']), ...overrides } as unknown as Response;
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockSelectHypothesis.mockClear();
  mockFetch();
});

describe('RefinementPanel — rendering', () => {
  it('renders the Hypothesis Refinement header', () => {
    render(<RefinementPanel {...defaultProps} />);
    expect(screen.getByText(/Hypothesis Refinement/i)).toBeInTheDocument();
  });

  it('shows "Human-in-the-loop" badge', () => {
    render(<RefinementPanel {...defaultProps} />);
    expect(screen.getByText(/Human-in-the-loop/i)).toBeInTheDocument();
  });

  it('shows similar_exists context message', () => {
    render(<RefinementPanel {...defaultProps} novelty="similar_exists" />);
    expect(screen.getByText(/Similar work exists/i)).toBeInTheDocument();
  });

  it('shows exact_match context message', () => {
    render(<RefinementPanel {...defaultProps} novelty="exact_match" />);
    expect(screen.getByText(/exact experiment has been published/i)).toBeInTheDocument();
  });

  it('renders the question textarea', () => {
    render(<RefinementPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/differentiation strategies/i)).toBeInTheDocument();
  });

  it('Ask Advisor button is disabled when textarea is empty', () => {
    render(<RefinementPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Ask Advisor/i })).toBeDisabled();
  });

  it('Ask Advisor button is enabled after typing a question', async () => {
    const user = userEvent.setup();
    render(<RefinementPanel {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/differentiation strategies/i), 'How can I differentiate?');
    expect(screen.getByRole('button', { name: /Ask Advisor/i })).toBeEnabled();
  });
});

describe('RefinementPanel — resources section', () => {
  it('renders the Protocol Resources collapsible section', () => {
    render(<RefinementPanel {...defaultProps} />);
    expect(screen.getByText(/Protocol Resources/i)).toBeInTheDocument();
  });
});

describe('RefinementPanel — streaming flow', () => {
  it('streams response and renders prose and suggestions', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/learnings')) {
        return { ok: true, json: async () => ({ learnings: [] }) } as unknown as Response;
      }
      return {
        ok: true,
        body: makeSseStream([
          `data: ${JSON.stringify({ text: 'Consider changing the detection target.\n\n' })}\n\n`,
          `data: ${JSON.stringify({ text: '> Use graphene oxide electrodes for higher sensitivity.\n' })}\n\n`,
          `data: ${JSON.stringify({ text: '> Target IL-6 instead of CRP for upstream inflammation detection.\n' })}\n\n`,
          `data: ${JSON.stringify({ text: '> Implement a sandwich immunoassay to reduce matrix interference.\n' })}\n\n`,
          'data: [DONE]\n\n',
        ]),
      } as unknown as Response;
    });

    render(<RefinementPanel {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/differentiation strategies/i), {
      target: { value: 'How can I differentiate?' },
    });
    await userEvent.click(screen.getByRole('button', { name: /Ask Advisor/i }));

    await waitFor(() => {
      expect(screen.getByText(/01›/)).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText(/02›/)).toBeInTheDocument();
    expect(screen.getByText(/03›/)).toBeInTheDocument();
  });

  it('calls onSelectHypothesis with suggestion text when clicked', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/learnings')) {
        return { ok: true, json: async () => ({ learnings: [] }) } as unknown as Response;
      }
      return {
        ok: true,
        body: makeSseStream([
          `data: ${JSON.stringify({ text: '> Use graphene oxide for better sensitivity.\n' })}\n\n`,
          'data: [DONE]\n\n',
        ]),
      } as unknown as Response;
    });

    render(<RefinementPanel {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/differentiation strategies/i), {
      target: { value: 'How to improve?' },
    });
    await userEvent.click(screen.getByRole('button', { name: /Ask Advisor/i }));

    await waitFor(() => {
      expect(screen.getByText(/01›/)).toBeInTheDocument();
    }, { timeout: 5000 });

    await userEvent.click(screen.getByText(/01›/).closest('button')!);
    expect(mockSelectHypothesis).toHaveBeenCalledWith(
      'Use graphene oxide for better sensitivity.'
    );
  });

  it('shows error message on fetch failure', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/learnings')) {
        return { ok: true, json: async () => ({ learnings: [] }) } as unknown as Response;
      }
      throw new Error('Network error');
    });

    render(<RefinementPanel {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/differentiation strategies/i), {
      target: { value: 'Test question?' },
    });
    await userEvent.click(screen.getByRole('button', { name: /Ask Advisor/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error|failed/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
