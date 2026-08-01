#!/usr/bin/env node
/**
 * Checks Data Dragon for a newer patch version than the one pinned in
 * src/lib/items.js (ITEM_VERSION) and, if the new version's assets are
 * actually being served, bumps the constant.
 *
 * Run manually with `node scripts/update-ddragon-version.mjs`, or on a
 * schedule via .github/workflows/update-ddragon-version.yml, which opens a
 * PR when this script changes something (see that file).
 *
 * Exit code 0 always in normal mode (even "nothing to do" or "not ready
 * yet") so the CI step never fails the workflow — a stale-but-working
 * version should never block anything. `--check` exits 1 instead if a bump
 * is needed but not applied, for local/CI drift checks without writing to
 * disk.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Resolved from cwd (this script is always run from the `diff/` project
// root — both directly and under Vitest) rather than import.meta.url, which
// isn't a plain file:// URL once this module is loaded through Vite's
// transform pipeline in tests.
export const ITEMS_FILE = resolve(process.cwd(), 'src/lib/items.js');
export const VERSION_LINE = /export const ITEM_VERSION = '([^']+)';/;

// One asset per family this app actually links to. If any of these 404s on
// the "latest" version, Riot's CDN hasn't finished rolling that patch's
// assets out yet — bumping now would break icons for every player until it
// catches up, so we wait and let the next scheduled run try again.
export const PROBE_PATHS = [
  'img/champion/Ahri.png',
  'img/item/1001.png',
  'img/profileicon/23.png',
  'img/map/map11.png',
];

export async function getLatestVersion() {
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  if (!res.ok) throw new Error(`versions.json request failed: ${res.status}`);
  const versions = await res.json();
  return versions[0];
}

export async function assetsExistFor(version, probePaths = PROBE_PATHS) {
  const results = await Promise.all(
    probePaths.map(async (path) => {
      const url = `https://ddragon.leagueoflegends.com/cdn/${version}/${path}`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.status === 200;
      } catch {
        return false;
      }
    })
  );
  return results.every(Boolean);
}

/** @returns {string|null} the pinned version, or null if the file doesn't match the expected shape */
export function parseVersion(content) {
  return content.match(VERSION_LINE)?.[1] ?? null;
}

export function applyVersion(content, nextVersion) {
  return content.replace(VERSION_LINE, `export const ITEM_VERSION = '${nextVersion}';`);
}

function readCurrentVersion(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const version = parseVersion(content);
  if (!version) throw new Error(`Could not find ITEM_VERSION in ${filePath}`);
  return { content, version };
}

export async function run({ checkOnly = false, filePath = ITEMS_FILE } = {}) {
  const { content, version: current } = readCurrentVersion(filePath);
  const latest = await getLatestVersion();

  if (latest === current) {
    console.log(`ITEM_VERSION is up to date (${current}).`);
    return { changed: false };
  }

  console.log(`Newer Data Dragon version available: ${current} -> ${latest}`);

  const ready = await assetsExistFor(latest);
  if (!ready) {
    console.log(`${latest}'s CDN assets are not fully available yet — leaving ${current} pinned for now.`);
    return { changed: false };
  }

  if (checkOnly) {
    console.log('Assets are ready. Run without --check to apply the bump.');
    return { changed: false, pending: true };
  }

  writeFileSync(filePath, applyVersion(content, latest));
  console.log(`Bumped ITEM_VERSION to ${latest}.`);
  return { changed: true, version: latest };
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href;

if (isMain) {
  const checkOnly = process.argv.includes('--check');
  run({ checkOnly })
    .then((result) => {
      if (checkOnly && result.pending) process.exitCode = 1;
    })
    .catch((err) => {
      // A failed check (network hiccup, Riot API down) should not fail CI or
      // block a deploy — it just means we try again next scheduled run.
      console.error('update-ddragon-version failed, leaving the pinned version untouched:', err.message);
    });
}
