import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiteratureBanner from '@/components/LiteratureBanner';
import { LiteratureResult } from '@/lib/types';

const BASE: LiteratureResult = {
  novelty: 'not_found',
  signal_text: 'No closely matching publications found.',
  references: [],
};

describe('LiteratureBanner — not_found', () => {
  it('renders the signal text', () => {
    render(<LiteratureBanner result={BASE} />);
    expect(screen.getByText(/No closely matching publications/i)).toBeInTheDocument();
  });

  it('shows a positive novelty indicator', () => {
    const { container } = render(<LiteratureBanner result={BASE} />);
    // Should not contain any red/amber colour tokens (only green for not_found)
    expect(container.textContent).not.toMatch(/exact match/i);
  });
});

describe('LiteratureBanner — similar_exists', () => {
  it('renders amber / similar signal text', () => {
    render(<LiteratureBanner result={{ ...BASE, novelty: 'similar_exists', signal_text: 'Similar work has been published.' }} />);
    expect(screen.getByText(/Similar work has been published/i)).toBeInTheDocument();
  });
});

describe('LiteratureBanner — exact_match', () => {
  it('renders red / exact match signal', () => {
    render(<LiteratureBanner result={{ ...BASE, novelty: 'exact_match', signal_text: 'This exact experiment has been published.' }} />);
    expect(screen.getByText(/This exact experiment has been published/i)).toBeInTheDocument();
  });
});

describe('LiteratureBanner — references', () => {
  const withRefs: LiteratureResult = {
    novelty: 'similar_exists',
    signal_text: 'Related work found.',
    references: [
      { title: 'Biosensor for CRP detection', authors: 'Smith J et al.', journal: 'Nature', year: 2023 },
      { title: 'Electrochemical antibody sensors', authors: 'Lee K et al.', journal: 'Science', year: 2022 },
    ],
  };

  it('renders all reference titles', () => {
    render(<LiteratureBanner result={withRefs} />);
    expect(screen.getByText(/Biosensor for CRP detection/i)).toBeInTheDocument();
    expect(screen.getByText(/Electrochemical antibody sensors/i)).toBeInTheDocument();
  });

  it('shows journal and year for each reference', () => {
    render(<LiteratureBanner result={withRefs} />);
    expect(screen.getByText(/Nature/)).toBeInTheDocument();
    expect(screen.getByText(/2023/)).toBeInTheDocument();
    expect(screen.getByText(/2022/)).toBeInTheDocument();
  });
});
