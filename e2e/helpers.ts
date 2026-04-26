import { Page } from '@playwright/test';
import { LiteratureResult } from '../src/lib/types';

// ─── API mock helpers ─────────────────────────────────────────────────────────
// All intercepts happen at the browser-fetch level, so the Next.js server
// never calls Anthropic — no real API key required in CI.

export async function mockLiterature(page: Page, result: Partial<LiteratureResult> = {}) {
  const payload: LiteratureResult = {
    novelty: 'not_found',
    signal_text: 'No closely matching publications found in the literature corpus.',
    references: [],
    ...result,
  };
  await page.route('/api/literature', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  );
}

export async function mockSimilarLiterature(page: Page) {
  return mockLiterature(page, {
    novelty: 'similar_exists',
    signal_text: 'Similar electrochemical biosensor work has been published.',
    references: [
      { title: 'Electrochemical CRP detection', authors: 'Smith J et al.', journal: 'Biosensors', year: 2023 },
    ],
  });
}

export async function mockExactLiterature(page: Page) {
  return mockLiterature(page, {
    novelty: 'exact_match',
    signal_text: 'This exact experiment has been published previously.',
    references: [
      { title: 'Paper-based CRP biosensor', authors: 'Lee K et al.', journal: 'Nature', year: 2022 },
    ],
  });
}

export async function mockPlanAgents(page: Page) {
  await page.route('/api/plan/**', route => {
    const url = route.request().url();
    const agentId = url.split('/').pop() ?? 'agent';
    const label = agentId.charAt(0).toUpperCase() + agentId.slice(1);
    const body = [
      `data: ${JSON.stringify({ text: `## ${label}\n\n` })}\n\n`,
      `data: ${JSON.stringify({ text: 'Mocked content for this agent section. Step 1: Prepare reagents.\n' })}\n\n`,
      'data: [DONE]\n\n',
    ].join('');
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body,
    });
  });
}

export async function mockRefine(page: Page) {
  const body = [
    `data: ${JSON.stringify({ text: 'The current approach lacks specificity at low concentrations. Consider these alternatives:\n\n' })}\n\n`,
    `data: ${JSON.stringify({ text: '> Using graphene oxide-modified electrodes will improve sensitivity 10-fold for CRP detection below 0.1 mg/L.\n' })}\n\n`,
    `data: ${JSON.stringify({ text: '> Substituting anti-IL-6 antibodies for anti-CRP will target an upstream inflammation marker with greater clinical utility.\n' })}\n\n`,
    `data: ${JSON.stringify({ text: '> Implementing a sandwich immunoassay architecture will eliminate non-specific binding interference from whole blood matrix.\n' })}\n\n`,
    'data: [DONE]\n\n',
  ].join('');
  await page.route('/api/refine', route =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body,
    })
  );
}

export async function mockFeedback(page: Page) {
  await page.route('/api/feedback', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  );
}

// ─── Navigation helpers ────────────────────────────────────────────────────────

export async function goToReadyState(page: Page, options: { novelty?: 'not_found' | 'similar_exists' | 'exact_match' } = {}) {
  const { novelty = 'not_found' } = options;

  if (novelty === 'similar_exists') await mockSimilarLiterature(page);
  else if (novelty === 'exact_match') await mockExactLiterature(page);
  else await mockLiterature(page);

  await page.goto('/');
  const textarea = page.getByPlaceholder(/Describe your experimental hypothesis/i);
  await textarea.fill('A paper-based electrochemical biosensor with anti-CRP antibodies will detect CRP below 0.5 mg/L.');
  await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
  // Wait for literature banner to appear
  await page.waitForSelector('[data-testid="lit-banner"], text=Literature Assessment', { timeout: 10_000 });
}
