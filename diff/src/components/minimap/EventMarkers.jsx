import { getChampionIconUrl, getChampionIconFallbackUrl } from '../../lib/items';

const PORTRAIT_EVENT_TYPES = new Set(['CHAMPION_KILL', 'CHAMPION_SPECIAL_KILL']);
const DEATH_RADIUS = 8;

/**
 * Markers for events that carry exact coordinates. Ward events are
 * structurally excluded upstream (positionedEvents) because Riot does not
 * publish ward positions — nothing here may ever draw one.
 *
 * Kills draw the victim's own portrait, desaturated to gray, rather than a
 * generic glyph — but only when a victim champion could actually be
 * resolved (`marker.championName`). Otherwise they fall back to the X, same
 * as every other unidentifiable case.
 */
export function EventMarkers({ markers }) {
  return (
    <g>
      {(markers || []).map((marker) => (
        <g key={marker.id} transform={`translate(${marker.x} ${marker.y})`}>
          {renderGlyph(marker)}
          <title>{marker.label}</title>
        </g>
      ))}
    </g>
  );
}

function renderGlyph(marker) {
  if (PORTRAIT_EVENT_TYPES.has(marker.type) && marker.championName) {
    return <DeathPortrait id={marker.id} championName={marker.championName} />;
  }

  switch (marker.type) {
    case 'CHAMPION_KILL':
    case 'CHAMPION_SPECIAL_KILL':
      return (
        <g stroke="var(--color-lol-loss)" strokeWidth={2} strokeLinecap="round">
          <line x1={-4} y1={-4} x2={4} y2={4} />
          <line x1={4} y1={-4} x2={-4} y2={4} />
        </g>
      );
    case 'ELITE_MONSTER_KILL':
      return <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" fill="var(--color-lol-gold-400)" />;
    case 'BUILDING_KILL':
      return <rect x={-4} y={-4} width={8} height={8} fill="none" stroke="var(--color-lol-gold-600)" strokeWidth={2} />;
    case 'TURRET_PLATE_DESTROYED':
      return <rect x={-3} y={-3} width={6} height={6} fill="var(--color-lol-gold-600)" opacity={0.8} />;
    default:
      return <circle r={3} fill="currentColor" />;
  }
}

/** The victim's portrait in gray, ringed in red so it still reads as a kill. */
function DeathPortrait({ id, championName }) {
  const clipId = `death-clip-${id}`;
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle r={DEATH_RADIUS} />
        </clipPath>
      </defs>
      <circle
        r={DEATH_RADIUS}
        fill="var(--color-lol-dark-500)"
        stroke="var(--color-lol-loss)"
        strokeWidth={1.5}
      />
      <image
        href={getChampionIconUrl(championName)}
        x={-DEATH_RADIUS}
        y={-DEATH_RADIUS}
        width={DEATH_RADIUS * 2}
        height={DEATH_RADIUS * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
        pointerEvents="none"
        style={{ filter: 'grayscale(1) brightness(0.85)' }}
        // eslint-disable-next-line react/no-unknown-property -- onerror is valid on SVG <image>; the plugin's allowlist just doesn't include it.
        onError={(e) => e.target.setAttribute('href', getChampionIconFallbackUrl())}
      />
    </>
  );
}
