import { test, expect } from '@playwright/test';
import { matchesFixture } from './fixtures.js';
import { ITEM_VERSION } from '../src/lib/items.js';

// BlueSupport is a real participant in the ranked fixture (profileIcon: 18),
// unlike the other specs' "Faker" account fixture which matches no
// participant name — needed here so profileIconId actually resolves.
const accountFixture = { puuid: 'test-puuid-icon', gameName: 'BlueSupport', tagLine: 'KR1' };
const PLAYER_URL = '/player?region=americas&gameName=BlueSupport&tagLine=KR1';

test('shows the real summoner icon sourced from the most recent match', async ({ page }) => {
  await page.route('**/api/player**', (route) => route.fulfill({ json: accountFixture }));
  await page.route('**/api/match**', (route) =>
    route.fulfill({ json: { matches: matchesFixture, hasMore: false } })
  );

  await page.goto(PLAYER_URL);

  const icon = page.getByAltText('Ícono de invocador de BlueSupport');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute(
    'src',
    `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/profileicon/18.png`
  );
});

test('falls back to the placeholder avatar if the icon image fails to load', async ({ page }) => {
  await page.route('**/api/player**', (route) => route.fulfill({ json: accountFixture }));
  await page.route('**/api/match**', (route) =>
    route.fulfill({ json: { matches: matchesFixture, hasMore: false } })
  );
  // Force the real profile-icon request to fail, simulating a bad/retired id.
  await page.route('**/img/profileicon/**', (route) => route.abort());

  await page.goto(PLAYER_URL);

  await expect(page.getByAltText('Ícono de invocador de BlueSupport')).not.toBeVisible();
});

test('loads a second page of matches on demand and stops offering more once exhausted', async ({ page }) => {
  const pageOne = [{ ...matchesFixture[0], id: 'PAGE1_MATCH' }];
  const pageTwo = [{ ...matchesFixture[0], id: 'PAGE2_MATCH' }];

  await page.route('**/api/player**', (route) => route.fulfill({ json: accountFixture }));
  await page.route('**/api/match**', (route) => {
    const url = new URL(route.request().url());
    const start = url.searchParams.get('start');
    if (start === '0') {
      return route.fulfill({ json: { matches: pageOne, hasMore: true } });
    }
    return route.fulfill({ json: { matches: pageTwo, hasMore: false } });
  });

  await page.goto(PLAYER_URL);
  await expect(page.getByText('Historial de Partidas')).toBeVisible();

  const loadMoreButton = page.getByRole('button', { name: 'Cargar más partidas' });
  await expect(loadMoreButton).toBeVisible();
  // Only the first page's expand button should exist before loading more.
  await expect(page.getByRole('button', { name: 'Ver detalles de la partida' })).toHaveCount(1);

  await loadMoreButton.click();

  await expect(page.getByRole('button', { name: 'Ver detalles de la partida' })).toHaveCount(2);
  // Riot signalled no more history after page two.
  await expect(page.getByRole('button', { name: 'Cargar más partidas' })).toHaveCount(0);
});
