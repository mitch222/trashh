import { test, expect } from '@playwright/test';
import { accountFixture, matchHistoryResponseFixture } from './fixtures.js';

// NOTE: this runs against `vite preview`, which has its own built-in SPA
// fallback — so it can't by itself prove the diff/vercel.json catch-all
// rewrite fixes the production 404 on Vercel. What it DOES prove is the
// other half of the original bug: that /player now fetches its data from
// URL query params instead of react-router's in-memory location.state,
// so a direct/refreshed load actually renders stats instead of the
// "no se encontraron datos" empty state. The Vercel-specific rewrite is
// verified manually with `vercel dev` (see the plan's verification steps).
test('direct navigation to /player URL does not 404 and renders stats', async ({ page }) => {
  await page.route('**/api/player**', (route) => route.fulfill({ json: accountFixture }));
  await page.route('**/api/match**', (route) => route.fulfill({ json: matchHistoryResponseFixture }));

  const response = await page.goto('/player?region=americas&gameName=Faker&tagLine=KR1');
  expect(response.status()).toBeLessThan(400);

  await expect(page.getByText('Faker')).toBeVisible();
  await expect(page.getByText('Win Rate')).toBeVisible();
});
