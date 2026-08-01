import { projectToPixels, isInFountain, SUMMONERS_RIFT_MAP_ID } from './mapCoords';

/**
 * Pulls one participant's position samples out of a projected timeline.
 *
 * There is one sample per champion per frame, and frames are 60s apart. That
 * is the entire spatial resolution available: between two samples there is no
 * information at all. Consumers must never connect these into a path.
 *
 * Returns [] (never throws) for a missing timeline or a participantId absent
 * from the data — the caller renders an explicit "cannot link" state instead.
 *
 * @param {object|null} timeline - projected timeline
 * @param {number|null} participantId
 * @returns {Array<{frameIndex: number, timestamp: number, position: {x,y}, level: number|undefined}>}
 */
export function extractPositionSeries(timeline, participantId) {
  if (!timeline?.frames || participantId === null || participantId === undefined) return [];

  const key = String(participantId);
  const series = [];

  timeline.frames.forEach((frame, frameIndex) => {
    const position = frame.positions?.[key];
    // Frames missing this participant are skipped, never zero-filled — a
    // (0,0) sample would draw a blob in the corner of the map.
    if (!position) return;
    series.push({
      frameIndex,
      // Read from the frame, never recomputed as frameInterval * index.
      timestamp: frame.timestamp,
      position,
      level: frame.levels?.[key],
    });
  });

  return series;
}

/**
 * Projects a position series into image pixels, flagging samples taken near
 * the team's fountain. Riot keeps reporting a position while a champion is
 * dead, so those samples are visually discounted rather than dropped.
 */
export function projectSeries(series, { width, height, mapId = SUMMONERS_RIFT_MAP_ID, teamId }) {
  return (series || [])
    .map((sample) => {
      const pixel = projectToPixels(sample.position, { width, height, mapId });
      if (!pixel) return null;
      return {
        frameIndex: sample.frameIndex,
        timestamp: sample.timestamp,
        x: pixel.x,
        y: pixel.y,
        inFountain: isInFountain(sample.position, teamId),
      };
    })
    .filter(Boolean);
}

/**
 * Blob radius that makes ~30 samples read as a density rather than 30 dots.
 * Proportional to the rendered size so it holds at any resolution.
 */
export function blobRadiusForSize(size) {
  return size * 0.085;
}

/** Index of the frame at or immediately before a timestamp. */
export function frameIndexAtTimestamp(timeline, timestampMs) {
  const frames = timeline?.frames;
  if (!frames?.length) return 0;

  let index = 0;
  for (let i = 0; i < frames.length; i += 1) {
    if (frames[i].timestamp <= timestampMs) index = i;
    else break;
  }
  return index;
}

/**
 * Builds a participantId -> teamId lookup from normalized match participants.
 * Participants Riot did not give an id are skipped rather than guessed.
 */
export function buildTeamLookup(participants) {
  const lookup = {};
  for (const participant of participants || []) {
    if (participant.participantId === null || participant.participantId === undefined) continue;
    lookup[participant.participantId] = participant.teamId;
  }
  return lookup;
}

/** Builds a participantId -> summonerName lookup, same rules as above. */
export function buildNameLookup(participants) {
  const lookup = {};
  for (const participant of participants || []) {
    if (participant.participantId === null || participant.participantId === undefined) continue;
    lookup[participant.participantId] = participant.summonerName;
  }
  return lookup;
}
