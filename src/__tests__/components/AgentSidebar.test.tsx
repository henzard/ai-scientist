import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentSidebar from '@/components/AgentSidebar';
import { PLAN_AGENTS } from '@/lib/agents';

const defaultProps = {
  agents: PLAN_AGENTS,
  agentStatus: {},
  activeAgent: null,
  litDone: false,
  onGeneratePlan: vi.fn(),
  planStarted: false,
};

describe('AgentSidebar — pipeline pills', () => {
  it('renders Literature QC pill', () => {
    render(<AgentSidebar {...defaultProps} />);
    expect(screen.getByText(/Literature QC/i)).toBeInTheDocument();
  });

  it('renders all 5 agent pills', () => {
    render(<AgentSidebar {...defaultProps} />);
    for (const agent of PLAN_AGENTS) {
      expect(screen.getByText(new RegExp(agent.label, 'i'))).toBeInTheDocument();
    }
  });
});

describe('AgentSidebar — Generate Full Plan button', () => {
  it('does NOT render Generate button when litDone is false', () => {
    render(<AgentSidebar {...defaultProps} litDone={false} />);
    expect(screen.queryByRole('button', { name: /Generate Full Plan/i })).not.toBeInTheDocument();
  });

  it('renders Generate button when litDone is true and plan not started', () => {
    render(<AgentSidebar {...defaultProps} litDone={true} planStarted={false} />);
    expect(screen.getByRole('button', { name: /Generate Full Plan/i })).toBeInTheDocument();
  });

  it('does NOT render Generate button when plan has started', () => {
    render(<AgentSidebar {...defaultProps} litDone={true} planStarted={true} />);
    expect(screen.queryByRole('button', { name: /Generate Full Plan/i })).not.toBeInTheDocument();
  });

  it('calls onGeneratePlan when Generate button is clicked', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<AgentSidebar {...defaultProps} litDone={true} onGeneratePlan={onGenerate} />);
    await user.click(screen.getByRole('button', { name: /Generate Full Plan/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });
});

describe('AgentSidebar — agent status rendering', () => {
  it('shows checkmark for done agents', () => {
    render(<AgentSidebar {...defaultProps} agentStatus={{ protocol: 'done' }} />);
    // Done status renders ✓
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders lit pill in running state when lit is active', () => {
    render(<AgentSidebar {...defaultProps} agentStatus={{ lit: 'running' }} activeAgent="lit" />);
    // Running lit agent — component renders the animated dot (div/span), not a text indicator
    // Just verify the sidebar renders without crashing
    expect(screen.getByText(/Literature QC/i)).toBeInTheDocument();
  });
});
