/**
 * Ward vision radii, in game units. Sourced from the LoL Wiki, NOT from the
 * Riot API — the API documents no radii at all.
 *
 * These exist for scale reference and UI copy only. The app NEVER draws a
 * vision circle, because it never knows where a ward is: Riot strips ward
 * coordinates from the timeline (verified across 3,025 ward events in 21 real
 * timelines, and again against a live match: 256 ward events, 0 positions).
 */
export const WARD_VISION_RADIUS = {
  YELLOW_TRINKET: 900,
  SIGHT_WARD: 900,
  CONTROL_WARD: 900,
  BLUE_TRINKET: 500,
  TEEMO_MUSHROOM: 450,
};

/**
 * Ward lifetimes. `null` means UNVERIFIED — wards of that type are never
 * claimed to be active, they land in a separate "unknown" bucket instead.
 *
 * The support-item stealth ward (SIGHT_WARD) duration could not be verified
 * against a reliable current source, so it is deliberately not guessed.
 */
export const WARD_DURATION = {
  YELLOW_TRINKET: { minSeconds: 90, maxSeconds: 120, levelScaled: true },
  SIGHT_WARD: null,
  CONTROL_WARD: { indefinite: true },
  BLUE_TRINKET: { indefinite: true },
  TEEMO_MUSHROOM: { minSeconds: 300, maxSeconds: 300 },
  UNDEFINED: null,
};

/**
 * The longest finite ward lifetime in the game (the Noxious Trap's 300s).
 *
 * Used only as an upper bound for wards whose own duration is unverified: we
 * still refuse to say when such a ward expired, but we can state as fact that
 * nothing non-indefinite outlives this, so one placed longer ago than this is
 * certainly gone. Without the bound the "unknown" bucket grows monotonically
 * and implies a ward from ten minutes ago might still be up.
 */
export const MAX_FINITE_WARD_SECONDS = 300;

const WARD_PLACED = 'WARD_PLACED';
const WARD_KILL = 'WARD_KILL';

/**
 * Riot has historically emitted duplicate WARD_PLACED events for a single
 * ward (dev-relations issue #96). Identical (timestamp, creatorId, wardType)
 * triples collapse to one.
 */
export function dedupeWardEvents(events) {
  const seen = new Set();
  return (events || []).filter((event) => {
    if (event.type !== WARD_PLACED) return true;
    const key = `${event.timestamp}|${event.creatorId ?? 'none'}|${event.wardType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trinketDurationSeconds(level) {
  const { minSeconds, maxSeconds } = WARD_DURATION.YELLOW_TRINKET;
  const clamped = Math.min(Math.max(level ?? 1, 1), 18);
  return minSeconds + ((maxSeconds - minSeconds) * (clamped - 1)) / 17;
}

/**
 * Builds a lifetime window per placed ward.
 *
 * The uncertainty lives in the data structure rather than being bolted on in
 * the view, so no consumer can accidentally render an estimate as a fact:
 *
 *   startMs    exact — this is real data
 *   endMsMin   earliest plausible expiry (null = open-ended)
 *   endMsMax   latest plausible expiry   (null = open-ended)
 *   endReason  KILLED_MATCHED | EXPIRED_ESTIMATED | GAME_END | UNKNOWN
 *   certainty  exact | estimated | unknown
 *
 * WARD_KILL matching is unavoidably heuristic: the event carries killerId,
 * wardType and timestamp but NO ward identity, so there is no way to know
 * which ward died. We pair a kill FIFO with the earliest still-open window of
 * the same wardType belonging to the team opposite the killer. The timestamp
 * is exact; *which* ward it closed is inference — hence `certainty:
 * 'estimated'` even on a matched kill.
 *
 * @param {Array<object>} events - projected timeline events
 * @param {{gameDurationMs: number, teamByParticipantId: Record<number, number>,
 *          levelAt?: (participantId: number, timestampMs: number) => number}} context
 */
export function buildWardWindows(events, { gameDurationMs, teamByParticipantId, levelAt } = {}) {
  const deduped = dedupeWardEvents(events).filter(
    (e) => e.type === WARD_PLACED || e.type === WARD_KILL
  );
  const ordered = [...deduped].sort((a, b) => a.timestamp - b.timestamp);

  const windows = [];
  let unmatchedKills = 0;
  let nextId = 0;

  for (const event of ordered) {
    if (event.type === WARD_PLACED) {
      windows.push(createWindow(event, nextId++, { gameDurationMs, teamByParticipantId, levelAt }));
      continue;
    }

    const killerTeam = teamByParticipantId?.[event.killerId] ?? null;
    const candidate = windows.find(
      (w) =>
        w.endReason === null &&
        w.wardType === event.wardType &&
        w.startMs <= event.timestamp &&
        // Only a ward belonging to the other team can be killed. When either
        // team is unknown we do not guess, we leave the window open.
        w.teamId !== null &&
        killerTeam !== null &&
        w.teamId !== killerTeam
    );

    if (candidate) {
      candidate.endMsMin = event.timestamp;
      candidate.endMsMax = event.timestamp;
      candidate.endReason = 'KILLED_MATCHED';
      // Timestamp exact, ward identity inferred.
      candidate.certainty = 'estimated';
    } else {
      unmatchedKills += 1;
    }
  }

  for (const window of windows) {
    if (window.endReason === null) {
      window.endReason = window.pendingReason;
      if (window.endMsMax === null && window.pendingReason === 'GAME_END') {
        window.endMsMin = gameDurationMs ?? null;
        window.endMsMax = gameDurationMs ?? null;
      }
    }
    delete window.pendingReason;
  }

  return { windows, unmatchedKills };
}

function createWindow(event, id, { gameDurationMs, teamByParticipantId, levelAt }) {
  const wardType = event.wardType ?? 'UNDEFINED';
  const duration = WARD_DURATION[wardType] ?? null;
  const creatorId = event.creatorId ?? null;
  const teamId = creatorId === null ? null : (teamByParticipantId?.[creatorId] ?? null);

  const base = {
    id: `w${id}`,
    wardType,
    creatorId,
    teamId,
    startMs: event.timestamp,
    endMsMin: null,
    endMsMax: null,
    endReason: null,
    certainty: 'unknown',
    pendingReason: 'UNKNOWN',
  };

  if (duration === null) {
    // Duration genuinely unverified — never claim this ward is active.
    return base;
  }

  if (duration.indefinite) {
    // Lives until destroyed. Clamped to the end of the game.
    base.certainty = 'estimated';
    base.pendingReason = 'GAME_END';
    return base;
  }

  let minSeconds = duration.minSeconds;
  let maxSeconds = duration.maxSeconds;

  if (duration.levelScaled && typeof levelAt === 'function' && creatorId !== null) {
    const level = levelAt(creatorId, event.timestamp);
    if (typeof level === 'number') {
      const scaled = trinketDurationSeconds(level);
      // Keep a residual band rather than pretending to a point estimate:
      // the level itself is only sampled once a minute.
      minSeconds = Math.max(duration.minSeconds, scaled - 5);
      maxSeconds = Math.min(duration.maxSeconds, scaled + 5);
    }
  }

  base.endMsMin = event.timestamp + minSeconds * 1000;
  base.endMsMax = event.timestamp + maxSeconds * 1000;
  base.certainty = 'estimated';
  base.pendingReason = 'EXPIRED_ESTIMATED';

  if (typeof gameDurationMs === 'number') {
    base.endMsMin = Math.min(base.endMsMin, gameDurationMs);
    base.endMsMax = Math.min(base.endMsMax, gameDurationMs);
  }

  return base;
}

/**
 * Splits wards into three buckets at a given instant. Three, not one count,
 * because collapsing them would present an estimate as a fact.
 *
 *   active         confidently still up
 *   possiblyActive inside the expiry uncertainty band
 *   unknown        duration never verified, so no claim is made
 */
export function activeWardsAt(windows, timestampMs) {
  const active = [];
  const possiblyActive = [];
  const unknown = [];

  for (const window of windows || []) {
    if (window.startMs > timestampMs) continue;

    if (window.endReason === 'KILLED_MATCHED') {
      if (timestampMs < window.endMsMin) active.push(window);
      continue;
    }

    if (window.certainty === 'unknown') {
      // We cannot say when this ward expired, but we can say that nothing
      // finite outlives MAX_FINITE_WARD_SECONDS — so past that it is
      // certainly gone and must stop being counted as maybe-active.
      if (timestampMs - window.startMs <= MAX_FINITE_WARD_SECONDS * 1000) {
        unknown.push(window);
      }
      continue;
    }

    if (window.endMsMin === null) {
      active.push(window);
      continue;
    }

    if (timestampMs < window.endMsMin) active.push(window);
    else if (timestampMs < window.endMsMax) possiblyActive.push(window);
  }

  return { active, possiblyActive, unknown };
}

/**
 * Per-support ward counts up to a given instant. Wards whose creatorId Riot
 * omitted are counted separately and never attributed to a support, so they
 * cannot inflate anyone's numbers.
 */
export function summarizeWards(windows, timestampMs, { creatorIds = [] } = {}) {
  const placedBy = {};
  for (const id of creatorIds) placedBy[id] = 0;
  let placedUnknownCreator = 0;

  for (const window of windows || []) {
    if (window.startMs > timestampMs) continue;
    if (window.creatorId === null) {
      placedUnknownCreator += 1;
    } else if (Object.prototype.hasOwnProperty.call(placedBy, window.creatorId)) {
      placedBy[window.creatorId] += 1;
    }
  }

  return { placedBy, placedUnknownCreator };
}

/** Wards destroyed up to a given instant. Exact — this is a raw event count. */
export function countWardsKilled(events, timestampMs) {
  return (events || []).filter((e) => e.type === WARD_KILL && e.timestamp <= timestampMs).length;
}
