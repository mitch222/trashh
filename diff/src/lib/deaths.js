/**
 * Base respawn wait per champion level, in seconds.
 *
 * Sourced from the LoL Wiki, NOT from the Riot API — the timeline reports the
 * death (CHAMPION_KILL) but never the respawn. Same status as the ward
 * durations in wards.js: community data, used only to bound an estimate.
 */
export const BASE_RESPAWN_SECONDS = {
  1: 10, 2: 10, 3: 12, 4: 12, 5: 14, 6: 16,
  7: 20, 8: 25, 9: 28.5, 10: 32.5, 11: 35, 12: 37.5,
  13: 40, 14: 42.5, 15: 45, 16: 47.5, 17: 50, 18: 52.5,
};

/**
 * Upper bound on the late-game respawn increase, as a fraction of the base
 * wait.
 *
 * Riot scales respawn time up as the game goes on. The exact curve changes
 * between patches and we could not verify a current one, so it is deliberately
 * NOT modelled as a point value — it is used only as a ceiling. The floor is
 * the unscaled base wait, which no champion can ever respawn faster than.
 * Everything between the two is reported as uncertainty, never as fact.
 */
export const MAX_RESPAWN_INCREASE = 0.5;

const MIN_LEVEL = 1;
const MAX_LEVEL = 18;

function baseRespawnSeconds(level) {
  const clamped = Math.min(Math.max(level ?? MIN_LEVEL, MIN_LEVEL), MAX_LEVEL);
  // Levels arrive as integers; Math.round guards a fractional level defensively.
  return BASE_RESPAWN_SECONDS[Math.round(clamped)] ?? BASE_RESPAWN_SECONDS[MIN_LEVEL];
}

/**
 * Builds one window per death, with the same shape discipline as
 * buildWardWindows: the uncertainty lives in the data, not in the view.
 *
 *   deathMs        exact — straight from CHAMPION_KILL
 *   respawnMsMin   earliest possible respawn (unscaled base wait)
 *   respawnMsMax   latest plausible respawn (base wait + MAX_RESPAWN_INCREASE)
 *   certainty      always 'estimated' — the respawn itself is never reported
 *
 * A death with no resolvable victim is skipped rather than attributed to
 * anyone. When the victim's level is unknown the band is widened to the whole
 * level range instead of assuming one, so an unknown reads as uncertain rather
 * than as a confident short timer.
 *
 * @param {Array<object>} events - projected timeline events
 * @param {{levelAt?: (participantId: number, timestampMs: number) => number}} context
 */
export function buildDeathWindows(events, { levelAt } = {}) {
  const windows = [];

  for (const event of events || []) {
    if (event.type !== 'CHAMPION_KILL') continue;
    const victimId = event.victimId;
    if (victimId === null || victimId === undefined) continue;

    const level = typeof levelAt === 'function' ? levelAt(victimId, event.timestamp) : undefined;
    const known = typeof level === 'number';

    const minSeconds = known ? baseRespawnSeconds(level) : BASE_RESPAWN_SECONDS[MIN_LEVEL];
    const maxSeconds =
      (known ? baseRespawnSeconds(level) : BASE_RESPAWN_SECONDS[MAX_LEVEL]) *
      (1 + MAX_RESPAWN_INCREASE);

    windows.push({
      participantId: victimId,
      deathMs: event.timestamp,
      respawnMsMin: event.timestamp + minSeconds * 1000,
      respawnMsMax: event.timestamp + maxSeconds * 1000,
      levelKnown: known,
      certainty: 'estimated',
    });
  }

  return windows;
}

/**
 * Death state per participant at one instant.
 *
 * Two buckets, not one, for the same reason activeWardsAt has three:
 * collapsing them would render an estimate as a fact.
 *
 *   dead          died recently enough that no respawn is possible yet
 *   possiblyDead  inside the respawn uncertainty band
 *
 * The most recent death wins when a champion died more than once before the
 * instant being examined.
 *
 * @returns {Record<number, 'dead'|'possiblyDead'>}
 */
export function deathStateAt(windows, timestampMs) {
  const latest = new Map();

  for (const window of windows || []) {
    if (window.deathMs > timestampMs) continue;
    if (timestampMs >= window.respawnMsMax) continue;
    const previous = latest.get(window.participantId);
    if (!previous || window.deathMs > previous.deathMs) latest.set(window.participantId, window);
  }

  const state = {};
  for (const [participantId, window] of latest) {
    state[participantId] = timestampMs < window.respawnMsMin ? 'dead' : 'possiblyDead';
  }
  return state;
}
