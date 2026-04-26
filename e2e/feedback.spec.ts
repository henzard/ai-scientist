import { test, expect } from '@playwright/test';
import { mockLiterature, mockPlanAgents, mockFeedback } from './helpers';

async function reachPlanComplete(page: import('@playwright/test').Page) {
  await mockLiterature(page);
  await mockPlanAgents(page);
  await mockFeedback(page);

  await page.goto('/');
  await page.getByPlaceholder(/Describe your experimental hypothesis/i)
    .fill('Electrochemical biosensor detects CRP in blood below 0.5 mg/L.');
  await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
  await page.getByRole('button', { name: /Generate Full Plan/i }).click({ timeout: 10_000 });
  await expect(page.getByText(/Plan Complete/i)).toBeVisible({ timeout: 20_000 });
}

test.describe('Feedback panel', () => {
  test('Approve and Correct buttons visible after section loads', async ({ page }) => {
    await reachPlanComplete(page);
    // At least one Approve button exists (one per section)
    const approveButtons = page.getByRole('button', { name: /approve/i });
    await expect(approveButtons.first()).toBeVisible({ timeout: 5_000 });
  });

  test('Correct button reveals correction textarea', async ({ page }) => {
    await reachPlanComplete(page);
    const correctButtons = page.getByRole('button', { name: /correct/i });
    await correctButtons.first().click();
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 3_000 });
  });

  test('submitting a correction calls /api/feedback', async ({ page }) => {
    let feedbackCalled = false;
    await mockLiterature(page);
    await mockPlanAgents(page);
    await page.route('/api/feedback', route => {
      feedbackCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i)
      .fill('Electrochemical biosensor detects CRP in blood below 0.5 mg/L.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
    await page.getByRole('button', { name: /Generate Full Plan/i }).click({ timeout: 10_000 });
    await expect(page.getByText(/Plan Complete/i)).toBeVisible({ timeout: 20_000 });

    const correctButtons = page.getByRole('button', { name: /correct/i });
    await correctButtons.first().click();
    const textarea = page.getByRole('textbox').first();
    await textarea.fill('Buffer pH should be 7.4 for optimal antibody binding');
    await page.getByRole('button', { name: /submit/i }).first().click();

    await expect(async () => {
      expect(feedbackCalled).toBe(true);
    }).toPass({ timeout: 5_000 });
  });

  test('approved section shows confirmation state', async ({ page }) => {
    await reachPlanComplete(page);
    const approveButtons = page.getByRole('button', { name: /approve/i });
    await approveButtons.first().click();
    // Approve sets the rating; still need to click Submit to confirm
    await page.getByRole('button', { name: /submit feedback/i }).first().click();
    await expect(page.getByText(/thank|recorded|submitted/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Export controls', () => {
  test('Copy button appears after plan starts', async ({ page }) => {
    await mockLiterature(page);
    await mockPlanAgents(page);
    await mockFeedback(page);

    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i)
      .fill('A biosensor hypothesis for export testing.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
    await page.getByRole('button', { name: /Generate Full Plan/i }).click({ timeout: 10_000 });

    // Copy button appears in header
    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible({ timeout: 15_000 });
  });

  test('.md download button appears after plan starts', async ({ page }) => {
    await mockLiterature(page);
    await mockPlanAgents(page);
    await mockFeedback(page);

    await page.goto('/');
    await page.getByPlaceholder(/Describe your experimental hypothesis/i)
      .fill('A biosensor hypothesis for export testing.');
    await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
    await page.getByRole('button', { name: /Generate Full Plan/i }).click({ timeout: 10_000 });

    await expect(page.getByRole('button', { name: /\.md/i })).toBeVisible({ timeout: 15_000 });
  });
});
