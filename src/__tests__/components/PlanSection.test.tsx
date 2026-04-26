import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlanSection from '@/components/PlanSection';
import { PLAN_AGENTS } from '@/lib/agents';

const protocolAgent = PLAN_AGENTS.find(a => a.id === 'protocol')!;
const mockSubmit = vi.fn();

const baseProps = {
  agent: protocolAgent,
  content: '',
  status: undefined,
  feedbackStatus: 'idle' as const,
  onFeedbackSubmit: mockSubmit,
};

describe('PlanSection — visibility', () => {
  it('renders nothing when content is empty and status is not running', () => {
    const { container } = render(<PlanSection {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when content is non-empty', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nStep 1: Do something." />);
    expect(screen.getByText(/Protocol Architect/i)).toBeInTheDocument();
  });

  it('renders when status is running (even with empty content)', () => {
    render(<PlanSection {...baseProps} status="running" />);
    expect(screen.getByText(/Protocol Architect/i)).toBeInTheDocument();
  });
});

describe('PlanSection — header', () => {
  it('displays the agent label and icon', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nContent." />);
    expect(screen.getByText(/Protocol Architect/i)).toBeInTheDocument();
    expect(screen.getByText(protocolAgent.icon)).toBeInTheDocument();
  });

  it('shows streaming indicator when status is running', () => {
    render(<PlanSection {...baseProps} content="Partial content" status="running" />);
    expect(screen.getByText(/streaming/i)).toBeInTheDocument();
  });

  it('shows complete indicator when status is done', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nDone." status="done" />);
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });

  it('shows learning applied badge when hasPriorCorrections is true', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nDone." status="done" hasPriorCorrections={true} />);
    expect(screen.getByText(/learning applied/i)).toBeInTheDocument();
  });

  it('does NOT show learning badge when hasPriorCorrections is false', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nDone." status="done" hasPriorCorrections={false} />);
    expect(screen.queryByText(/learning applied/i)).not.toBeInTheDocument();
  });
});

describe('PlanSection — content rendering', () => {
  it('renders markdown content when status is done', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nStep content here." status="done" />);
    expect(screen.getByText(/Step content here/i)).toBeInTheDocument();
  });

  it('shows raw streaming text in a pre element when running', () => {
    render(<PlanSection {...baseProps} content="## Proto" status="running" />);
    const preEl = document.querySelector('pre');
    expect(preEl).toBeInTheDocument();
    expect(preEl?.textContent).toContain('## Proto');
  });

  it('renders FeedbackPanel after status is done', () => {
    render(<PlanSection {...baseProps} content="## Protocol\n\nDone." status="done" />);
    // FeedbackPanel renders the "Rate this section" label
    expect(screen.getByText(/Rate this section/i)).toBeInTheDocument();
  });
});
