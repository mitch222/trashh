/**
 * Time formatters shared between the per-match support card and the
 * PlayerPage aggregates.
 *
 * A single support's per-game `timeCCingOthers` is typically 30-60s.
 * Rendering that as "0.6m" throws away the resolution that makes the
 * number interesting, so sub-minute values are shown in seconds and
 * minute-or-larger values keep the `X.Xm` convention PlayerPage already
 * uses for its aggregate totals.
 */
export function formatCCTime(seconds) {
  const value = seconds || 0;
  if (value < 60) return `${Math.round(value)}s`;
  return `${(value / 60).toFixed(1)}m`;
}

/**
 * Match clock from a timeline timestamp in milliseconds. Used by the
 * minimap scrubber, which must always label the exact frame timestamp
 * rather than a derived "minute N".
 */
export function formatGameClock(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
