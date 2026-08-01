import { test, expect } from '@playwright/test';
import { accountFixture, matchHistoryResponseFixture, timelineFixture } from './fixtures.js';

const PLAYER_URL = '/player?region=americas&gameName=Faker&tagLine=KR1';

async function mockApi(page, { onTimeline } = {}) {
  await page.route('**/api/player**', (route) => route.fulfill({ json: accountFixture }));
  await page.route('**/api/match**', (route) => route.fulfill({ json: matchHistoryResponseFixture }));
  await page.route('**/api/timeline**', (route) => {
    onTimeline?.();
    return route.fulfill({ json: timelineFixture });
  });
}

test('the timeline is only fetched once the minimap tab is selected', async ({ page }) => {
  let timelineRequests = 0;
  await mockApi(page, { onTimeline: () => { timelineRequests += 1; } });

  await page.goto(PLAYER_URL);
  await expect(page.getByText('Historial de Partidas')).toBeVisible();
  expect(timelineRequests).toBe(0);

  // Expanding a row to read KDAs must not cost a timeline request.
  await page.getByRole('button', { name: 'Ver detalles de la partida' }).first().click();
  await expect(page.getByText('Comparación de Supports')).toBeVisible();
  expect(timelineRequests).toBe(0);

  await page.getByRole('button', { name: 'Minimapa' }).click();
  await expect(page.getByRole('img', { name: /Minimapa de la partida/ })).toBeVisible();
  expect(timelineRequests).toBe(1);
});

test('the scrubber moves through the game and updates the minute details', async ({ page }) => {
  await mockApi(page);

  await page.goto(PLAYER_URL);
  await page.getByRole('button', { name: 'Ver detalles de la partida' }).first().click();
  await page.getByRole('button', { name: 'Minimapa' }).click();

  const slider = page.getByRole('slider', { name: 'Minuto de la partida' });
  await expect(slider).toHaveAttribute('aria-valuetext', '0:00');

  await slider.fill('12');
  await expect(slider).toHaveAttribute('aria-valuetext', '12:00');
  await expect(page.getByText(/Eventos: 12:00–13:00/)).toBeVisible();
});

test('the honesty notes are visible without any interaction', async ({ page }) => {
  await mockApi(page);

  await page.goto(PLAYER_URL);
  await page.getByRole('button', { name: 'Ver detalles de la partida' }).first().click();
  await page.getByRole('button', { name: 'Minimapa' }).click();

  // The 60s sampling caveat and the missing-ward-positions fact must both be
  // readable straight away, not behind a disclosure. Matched on the phrase
  // unique to the persistent footnote — the same fact is also restated inside
  // the ward-estimate disclosure, which is deliberate.
  await expect(page.getByText(/una muestra por campeón cada 60 s/)).toBeVisible();
  await expect(page.getByText(/este mapa nunca las representa espacialmente/)).toBeVisible();
  await expect(page.getByText(/Presencia muestreada cada 60 s · 32 muestras/)).toBeVisible();
  await expect(page.getByText(/Visión activa \(estimado\)/)).toBeVisible();
});

test('the support toggle switches heatmaps without changing the champion dots', async ({ page }) => {
  await mockApi(page);

  await page.goto(PLAYER_URL);
  await page.getByRole('button', { name: 'Ver detalles de la partida' }).first().click();
  await page.getByRole('button', { name: 'Minimapa' }).click();

  const dots = page.locator('svg circle title');
  await expect(dots).toHaveCount(10);

  await page.getByRole('button', { name: /Azul \(Nami\)/ }).click();
  await expect(page.getByRole('button', { name: /Azul \(Nami\)/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(dots).toHaveCount(10);
});

test('re-opening the minimap does not refetch the immutable timeline', async ({ page }) => {
  let timelineRequests = 0;
  await mockApi(page, { onTimeline: () => { timelineRequests += 1; } });

  await page.goto(PLAYER_URL);
  const expandButton = page.getByRole('button', { name: 'Ver detalles de la partida' }).first();

  await expandButton.click();
  await page.getByRole('button', { name: 'Minimapa' }).click();
  await expect(page.getByRole('img', { name: /Minimapa de la partida/ })).toBeVisible();
  expect(timelineRequests).toBe(1);

  await expandButton.click();
  await expandButton.click();
  await page.getByRole('button', { name: 'Minimapa' }).click();
  await expect(page.getByRole('img', { name: /Minimapa de la partida/ })).toBeVisible();
  expect(timelineRequests).toBe(1);
});
