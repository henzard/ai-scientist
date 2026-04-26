import { test, expect } from '@playwright/test';
import { mockLiterature, mockPlanAgents, mockFeedback } from './helpers';

test.describe('Idle screen', () => {
  test('renders headline and hypothesis input', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/From hypothesis/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Describe your experimental hypothesis/i)).toBeVisible();
  });

  test('loads sample hypothesis into textarea on click', async ({ page }) => {
    await page.goto('/');
    const samples = page.locator('button').filter({ hasText: '01.' });
    await samples.first().click();
    const textarea = page.getByPlaceholder(/Describe your experimental hypothesis/i);
    await expect(textarea).not.toBeEmpty();
  });

  test('Analyze button disabled for empty textarea', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: /Analyze Hypothesis/i });
    await expect(btn).toBeDisabled();
  });

  test('Analyze button enabled after typing hypothesis', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('A test hypothesis about biosensor detection.');
    const btn = page.getByRole('button', { name: /Analyze Hypothesis/i });
    await expect(btn).toBeEnabled();
  });

  test('shows character counter', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('Hello');
    await expect(page.getByText(/5\/2000/)).toBeVisible();
  });
});

test.describe('Literature analysis', () => {
  test('transitions to running state and shows result', async ({ page }) => {
    await mockLiterature(page);
    await page.goto('/');

    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('A biosensor antibody blood detection hypothesis.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();

    // Literature result appears
    await expect(page.getByText(/Literature Assessment/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/No closely matching publications/i)).toBeVisible();
  });

  test('Generate Full Plan button appears after literature result', async ({ page }) => {
    await mockLiterature(page);
    await page.goto('/');

    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('A biosensor antibody blood detection hypothesis.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();

    await expect(page.getByRole('button', { name: /Generate Full Plan/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Full plan generation', () => {
  test('all 5 agent section headers stream and appear', async ({ page }) => {
    await mockLiterature(page);
    await mockPlanAgents(page);
    await mockFeedback(page);

    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('A biosensor antibody blood detection hypothesis.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
    await page.getByRole('button', { name: /Generate Full Plan/i }).click({ timeout: 10_000 });

    // All 5 agent labels appear
    for (const label of ['Protocol Architect', 'Materials Curator', 'Budget Analyst', 'Timeline Planner', 'Validation Designer']) {
      await expect(page.getByText(label)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('Plan Complete badge appears after all agents finish', async ({ page }) => {
    await mockLiterature(page);
    await mockPlanAgents(page);
    await mockFeedback(page);

    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('A biosensor antibody blood detection hypothesis.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
    await page.getByRole('button', { name: /Generate Full Plan/i }).click({ timeout: 10_000 });

    await expect(page.getByText(/Plan Complete/i)).toBeVisible({ timeout: 20_000 });
  });

  test('New Hypothesis button resets to idle', async ({ page }) => {
    await mockLiterature(page);
    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i).fill('A biosensor hypothesis.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
    await page.getByRole('button', { name: /New Hypothesis/i }).click({ timeout: 10_000 });

    // Back to idle — headline visible again
    await expect(page.getByText(/From hypothesis/i)).toBeVisible({ timeout: 5_000 });
  });
});
