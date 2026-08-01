import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseVersion,
  applyVersion,
  getLatestVersion,
  assetsExistFor,
  run,
  PROBE_PATHS,
} from './update-ddragon-version.mjs';

const FILE_TEMPLATE = (version) =>
  `// header comment\nexport const ITEM_VERSION = '${version}';\n\nexport function getItemIcon() {}\n`;

describe('parseVersion / applyVersion', () => {
  it('reads the pinned version out of the file content', () => {
    expect(parseVersion(FILE_TEMPLATE('16.8.1'))).toBe('16.8.1');
  });

  it('returns null when the expected line is missing, instead of guessing', () => {
    expect(parseVersion('export const SOMETHING_ELSE = 1;')).toBeNull();
  });

  it('replaces only the version line, leaving the rest of the file untouched', () => {
    const before = FILE_TEMPLATE('16.8.1');
    const after = applyVersion(before, '16.15.1');
    expect(parseVersion(after)).toBe('16.15.1');
    expect(after).toContain('// header comment');
    expect(after).toContain('export function getItemIcon() {}');
  });
});

describe('getLatestVersion', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('returns the first entry of versions.json', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ['16.15.1', '16.14.1', '16.13.1'],
    });
    expect(await getLatestVersion()).toBe('16.15.1');
  });

  it('throws when Data Dragon is unreachable, rather than silently pinning garbage', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(getLatestVersion()).rejects.toThrow(/500/);
  });
});

describe('assetsExistFor', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('is true only when every probed asset responds 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    expect(await assetsExistFor('16.15.1')).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(PROBE_PATHS.length);
  });

  it('is false when Riot has not finished rolling the new version out yet', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 403 }) // one asset not live yet
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200 });
    expect(await assetsExistFor('16.16.1')).toBe(false);
  });

  it('treats a network error on any probe as "not ready" rather than throwing', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ status: 200 })
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200 });
    expect(await assetsExistFor('16.16.1')).toBe(false);
  });
});

describe('run', () => {
  const originalFetch = global.fetch;
  let dir;
  let filePath;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ddragon-version-test-'));
    filePath = join(dir, 'items.js');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    rmSync(dir, { recursive: true, force: true });
  });

  function mockFetch({ latest, assetsReady }) {
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('versions.json')) {
        return Promise.resolve({ ok: true, json: async () => [latest] });
      }
      // Every other call is an asset HEAD probe.
      return Promise.resolve({ status: assetsReady ? 200 : 404 });
    });
  }

  it('does nothing when already on the latest version', async () => {
    writeFileSync(filePath, FILE_TEMPLATE('16.15.1'));
    mockFetch({ latest: '16.15.1', assetsReady: true });

    const result = await run({ filePath });

    expect(result).toEqual({ changed: false });
    expect(parseVersion(readFileSync(filePath, 'utf-8'))).toBe('16.15.1');
  });

  it('bumps the pinned version once a newer one is confirmed available', async () => {
    writeFileSync(filePath, FILE_TEMPLATE('16.8.1'));
    mockFetch({ latest: '16.15.1', assetsReady: true });

    const result = await run({ filePath });

    expect(result).toEqual({ changed: true, version: '16.15.1' });
    expect(parseVersion(readFileSync(filePath, 'utf-8'))).toBe('16.15.1');
  });

  it('leaves the file untouched when the newer version is not fully live yet', async () => {
    writeFileSync(filePath, FILE_TEMPLATE('16.8.1'));
    mockFetch({ latest: '16.15.1', assetsReady: false });

    const result = await run({ filePath });

    expect(result).toEqual({ changed: false });
    expect(parseVersion(readFileSync(filePath, 'utf-8'))).toBe('16.8.1');
  });

  it('in check mode, reports a pending bump without writing to disk', async () => {
    writeFileSync(filePath, FILE_TEMPLATE('16.8.1'));
    mockFetch({ latest: '16.15.1', assetsReady: true });

    const result = await run({ filePath, checkOnly: true });

    expect(result).toEqual({ changed: false, pending: true });
    expect(parseVersion(readFileSync(filePath, 'utf-8'))).toBe('16.8.1');
  });
});
