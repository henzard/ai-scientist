import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

describe('MarkdownRenderer — headings', () => {
  it('renders ## as a heading element', () => {
    render(<MarkdownRenderer content="## Protocol" />);
    // MarkdownRenderer maps ## → h3 (visual hierarchy choice)
    expect(screen.getByRole('heading', { name: /Protocol/i })).toBeInTheDocument();
  });

  it('renders ### as a sub-heading element', () => {
    render(<MarkdownRenderer content="### Step 1" />);
    expect(screen.getByRole('heading', { name: /Step 1/i })).toBeInTheDocument();
  });
});

describe('MarkdownRenderer — inline formatting', () => {
  it('renders **text** as bold', () => {
    render(<MarkdownRenderer content="This is **bold text** here." />);
    const bold = screen.getByText(/bold text/);
    expect(bold.tagName.toLowerCase()).toBe('strong');
  });

  it('renders `code` as inline code', () => {
    render(<MarkdownRenderer content="Use `npm install` to install." />);
    const code = screen.getByText(/npm install/);
    expect(code.tagName.toLowerCase()).toBe('code');
  });
});

describe('MarkdownRenderer — lists', () => {
  it('renders - list items as li elements', () => {
    render(<MarkdownRenderer content={"- Item one\n- Item two\n- Item three"} />);
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it('renders numbered lists', () => {
    render(<MarkdownRenderer content={"1. First step\n2. Second step"} />);
    expect(screen.getByText(/First step/)).toBeInTheDocument();
    expect(screen.getByText(/Second step/)).toBeInTheDocument();
  });
});

describe('MarkdownRenderer — tables', () => {
  const tableContent = `| Item | Price |
|------|-------|
| Reagent A | $50 |
| Reagent B | $75 |`;

  it('renders table with correct headers', () => {
    render(<MarkdownRenderer content={tableContent} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders table row data', () => {
    render(<MarkdownRenderer content={tableContent} />);
    expect(screen.getByText('Reagent A')).toBeInTheDocument();
    expect(screen.getByText('$75')).toBeInTheDocument();
  });
});

describe('MarkdownRenderer — plain text', () => {
  it('renders plain paragraphs', () => {
    render(<MarkdownRenderer content="This is a plain paragraph with no special formatting." />);
    expect(screen.getByText(/plain paragraph/)).toBeInTheDocument();
  });

  it('handles empty content without crashing', () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container).toBeTruthy();
  });
});
