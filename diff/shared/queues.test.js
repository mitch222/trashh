import { describe, it, expect } from 'vitest';
import { QUEUES, QUEUE_KEYS, DEFAULT_QUEUE, queueIdFor, isValidQueue } from './queues.js';

describe('queues', () => {
  it('offers ranked solo, flex and normal', () => {
    expect(QUEUE_KEYS.sort()).toEqual(['flex', 'normal', 'solo']);
  });

  it('maps each filter to the Riot queue id verified against the live API', () => {
    expect(queueIdFor('solo')).toBe(420);
    expect(queueIdFor('flex')).toBe(440);
    expect(queueIdFor('normal')).toBe(400);
  });

  it('defaults to ranked solo, preserving the behaviour before the filter existed', () => {
    expect(DEFAULT_QUEUE).toBe('solo');
    expect(isValidQueue(DEFAULT_QUEUE)).toBe(true);
  });

  it('gives every queue a distinct id and a label', () => {
    const ids = Object.values(QUEUES).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const queue of Object.values(QUEUES)) {
      expect(typeof queue.label).toBe('string');
      expect(queue.label.length).toBeGreaterThan(0);
    }
  });

  // Riot answers ?queue=999 with 200 + [], so an unvalidated value would look
  // like an empty history rather than a bad request. Validation must be the
  // caller's gate, which means these have to be rejected here.
  it('rejects unknown queues instead of resolving them', () => {
    for (const bad of ['aram', 'arena', '420', 'SOLO', '', 'ranked']) {
      expect(isValidQueue(bad)).toBe(false);
      expect(queueIdFor(bad)).toBeNull();
    }
  });

  it('is not fooled by inherited Object properties', () => {
    expect(isValidQueue('constructor')).toBe(false);
    expect(isValidQueue('toString')).toBe(false);
    expect(queueIdFor('constructor')).toBeNull();
  });

  // Every queue must be Summoner's Rift: the minimap projection is calibrated
  // for map 11 only, and Riot's own type=normal filter returns Arena (1750).
  it('never includes a non-Summoner\'s-Rift queue id', () => {
    const NON_SR = [450, 1700, 1710, 1740, 1750, 900, 1020];
    for (const queue of Object.values(QUEUES)) {
      expect(NON_SR).not.toContain(queue.id);
    }
  });
});
