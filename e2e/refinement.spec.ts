import { test, expect } from '@playwright/test';
import { mockSimilarLiterature, mockExactLiterature, mockRefine, mockLiterature } from './helpers';

async function analyzeAndWait(page: import('@playwright/test').Page) {
  await page.getByPlaceholder(/Describe your experimental hypothesis/i)
    .fill('A paper-based electrochemical biosensor with anti-CRP antibodies detects CRP below 0.5 mg/L.');
  await page.getByRole('button', { name: /Analyze Hypothesis/i }).click();
  await expect(page.getByText(/Literature Assessment/i)).toBeVisible({ timeout: 10_000 });
}

test.describe('Refinement panel — visibility', () => {
  test('Refine Hypothesis button appears for similar_exists novelty', async ({ page }) => {
    await mockSimilarLiterature(page);
    await page.goto('/');
    await analyzeAndWait(page);
    await expect(page.getByRole('button', { name: /Refine Hypothesis/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Refine Hypothesis button appears for exact_match novelty', async ({ page }) => {
    await mockExactLiterature(page);
    await page.goto('/');
    await analyzeAndWait(page);
    await expect(page.getByRole('button', { name: /Refine Hypothesis/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Refine Hypothesis button does NOT appear for not_found novelty', async ({ page }) => {
    await mockLiterature(page, { novelty: 'not_found' });
    await page.goto('/');
    await analyzeAndWait(page);
    await expect(page.getByRole('button', { name: /Refine Hypothesis/i })).not.toBeVisible();
  });
});

test.describe('Refinement panel — interaction', () => {
  test('panel opens with context message on toggle click', async ({ page }) => {
    await mockSimilarLiterature(page);
    await page.goto('/');
    await analyzeAndWait(page);
    await page.getByRole('button', { name: /Refine Hypothesis/i }).click();
    // LiteratureBanner and panel both show this text — first() avoids strict-mode violation
    await expect(page.getByText(/Similar work exists/i).first()).toBeVisible({ timeout: 3_000 });
  });

  test('exact match shows different context message', async ({ page }) => {
    await mockExactLiterature(page);
    await page.goto('/');
    await analyzeAndWait(page);
    await page.getByRole('button', { name: /Refine Hypothesis/i }).click();
    await expect(page.getByText(/exact experiment has been published/i).first()).toBeVisible({ timeout: 3_000 });
  });

  test('panel closes when toggled again', async ({ page }) => {
    await mockSimilarLiterature(page);
    await page.goto('/');
    await analyzeAndWait(page);

    const toggleBtn = page.getByRole('button', { name: /Refine Hypothesis/i });
    await toggleBtn.click();
    await expect(page.getByText(/Human-in-the-loop/i)).toBeVisible({ timeout: 3_000 });

    // Click again to hide
    await page.getByRole('button', { name: /Hide Refinement/i }).click();
    await expect(page.getByText(/Human-in-the-loop/i)).not.toBeVisible();
  });

  test('Ask Advisor button is disabled when textarea is empty', async ({ page }) => {
    await mockSimilarLiterature(page);
    await page.goto('/');
    await analyzeAndWait(page);
    await page.getByRole('button', { name: /Refine Hypothesis/i }).click();

    await expect(page.getByRole('button', { name: /Ask Advisor/i })).toBeDisabled({ timeout: 3_000 });
  });

  test('submitting a question streams 3 reformulation suggestions', async ({ page }) => {
    await mockSimilarLiterature(page);
    await mockRefine(page);
    await page.goto('/');
    await analyzeAndWait(page);

    await page.getByRole('button', { name: /Refine Hypothesis/i }).click();
    await page.getByPlaceholder(/differentiation strategies/i).fill('How can I differentiate my approach?');
    await page.getByRole('button', { name: /Ask Advisor/i }).click();

    // Three numbered suggestions appear
    await expect(page.getByText(/01›/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/02›/)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/03›/)).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a suggestion re-triggers literature analysis', async ({ page }) => {
    await mockSimilarLiterature(page);
    await mockRefine(page);
    // Second lit call returns not_found (novel hypothesis)
    let callCount = 0;
    await page.route('/api/literature', route => {
      callCount++;
      const novelty = callCount === 1 ? 'similar_exists' : 'not_found';
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          novelty,
          signal_text: callCount === 1 ? 'Similar work exists.' : 'Novel! No matches found.',
          references: [],
        }),
      });
    });

    await page.goto('/');
    await analyzeAndWait(page);

    await page.getByRole('button', { name: /Refine Hypothesis/i }).click();
    await page.getByPlaceholder(/differentiation strategies/i).fill('How can I make this novel?');
    await page.getByRole('button', { name: /Ask Advisor/i }).click();

    await expect(page.getByText(/01›/)).toBeVisible({ timeout: 10_000 });

    // Click the first suggestion to adopt it
    const suggestion = page.locator('button').filter({ has: page.locator('text=01›') });
    await suggestion.click();

    // Should re-run analysis — second lit result appears
    await expect(page.getByText(/Novel! No matches found/i)).toBeVisible({ timeout: 10_000 });
  });
});
