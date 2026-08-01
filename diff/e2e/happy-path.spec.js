import { test, expect } from '@playwright/test';
import { accountFixture, matchHistoryResponseFixture } from './fixtures.js';

test('search on home navigates to player page and shows stats', async ({ page }) => {
  await page.route('**/api/player**', (route) => route.fulfill({ json: accountFixture }));
  await page.route('**/api/match**', (route) => route.fulfill({ json: matchHistoryResponseFixture }));

  await page.goto('/');
  await page.getByPlaceholder('Ej: Faker').fill('Faker');
  await page.getByPlaceholder('Ej: KR1').fill('KR1');
  await page.getByRole('button', { name: 'Buscar Jugador' }).click();

  await expect(page).toHaveURL(/\/player\?region=americas&gameName=Faker&tagLine=KR1/);
  await expect(page.getByText('Faker')).toBeVisible();
});
