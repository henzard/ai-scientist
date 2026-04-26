import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackPanel from '@/components/FeedbackPanel';
import { FeedbackStatus } from '@/hooks/useFeedback';

const mockSubmit = vi.fn();

function renderPanel(feedbackStatus: FeedbackStatus = 'idle') {
  return render(
    <FeedbackPanel
      agentId="protocol"
      agentLabel="Protocol Architect"
      feedbackStatus={feedbackStatus}
      onSubmit={mockSubmit}
    />
  );
}

describe('FeedbackPanel — idle state', () => {
  it('renders Approve and Correct buttons', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /correct/i })).toBeInTheDocument();
  });

  it('does not show correction textarea initially', () => {
    renderPanel();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('FeedbackPanel — correction flow', () => {
  it('shows textarea after clicking Correct', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /correct/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSubmit with correct args when submitting a correction', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue(undefined);
    renderPanel();

    await user.click(screen.getByRole('button', { name: /correct/i }));
    const textarea = screen.getByRole('textbox');
    // fireEvent.change sets the full value atomically (avoids char-by-char state sync issues)
    fireEvent.change(textarea, { target: { value: 'Buffer pH should be 7.4' } });
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(mockSubmit).toHaveBeenCalledWith('protocol', 'down', 'Buffer pH should be 7.4');
  });

  it('calls onSubmit with rating up after clicking Approve then Submit', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue(undefined);
    renderPanel();
    // Approve sets rating to 'up' and reveals the Submit button
    await user.click(screen.getByRole('button', { name: /approve/i }));
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(mockSubmit).toHaveBeenCalledWith('protocol', 'up', '');
  });
});

describe('FeedbackPanel — submitting state', () => {
  it('shows Saving indicator on the submit button while submitting', () => {
    // Render with a rating pre-selected so the submit button is visible
    const { rerender } = renderPanel('idle');
    // Click Approve to set rating, then rerender with 'submitting' status
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    rerender(
      <FeedbackPanel
        agentId="protocol"
        agentLabel="Protocol Architect"
        feedbackStatus="submitting"
        onSubmit={mockSubmit}
      />
    );
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
  });
});

describe('FeedbackPanel — submitted state', () => {
  it('shows Feedback recorded confirmation', () => {
    renderPanel('submitted');
    expect(screen.getByText(/Feedback recorded/i)).toBeInTheDocument();
  });
});
