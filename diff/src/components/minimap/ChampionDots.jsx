import { getChampionIconUrl, getChampionIconFallbackUrl } from '../../lib/items';
import { describeDot } from './dotLabels';

/**
 * The 10 champion positions at one instant, as SVG so each dot can carry a
 * tooltip and an accessible name.
 *
 * Each dot is the champion's own portrait, clipped to a circle and ringed in
 * its team's color — plain colored dots don't say *who* is where. The ring
 * (not the portrait) carries the `<title>`, so the accessible name and the
 * hit target survive even before the portrait image has loaded.
 *
 * Fountain-flagged dots fade and dash their ring: Riot reports a position
 * for dead champions too, so a full-strength portrait at base would overstate
 * what we know.
 *
 * `deathState` desaturates the portrait, but only ever as an ESTIMATE — Riot
 * reports the death and never the respawn (see lib/deaths.js). 'dead' is the
 * confident bucket, 'possiblyDead' the uncertainty band, and the latter is
 * drawn at half the desaturation so the two never read as the same claim.
 */
export function ChampionDots({ champions, highlightIds = [] }) {
  return (
    <g>
      {(champions || []).map((champion) => {
        const isHighlighted = highlightIds.includes(champion.participantId);
        const color = champion.teamId === 100 ? 'var(--color-lol-blue-500)' : 'var(--color-lol-loss)';
        const radius = isHighlighted ? 12 : 9;
        const clipId = `champ-clip-${champion.participantId}`;
        const grayscale =
          champion.deathState === 'dead' ? 1 : champion.deathState === 'possiblyDead' ? 0.5 : 0;

        return (
          <g
            key={champion.participantId}
            transform={`translate(${champion.x} ${champion.y})`}
            opacity={champion.inFountain ? 0.55 : 1}
          >
            <defs>
              <clipPath id={clipId}>
                <circle r={radius} />
              </clipPath>
            </defs>
            <circle
              r={radius}
              fill={color}
              stroke={color}
              strokeWidth={champion.inFountain ? 1.5 : 1}
              strokeDasharray={champion.inFountain ? '3 2' : undefined}
            >
              <title>{describeDot(champion)}</title>
            </circle>
            <image
              href={getChampionIconUrl(champion.championName)}
              x={-radius}
              y={-radius}
              width={radius * 2}
              height={radius * 2}
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid slice"
              pointerEvents="none"
              style={grayscale ? { filter: `grayscale(${grayscale})` } : undefined}
              // eslint-disable-next-line react/no-unknown-property -- onerror is valid on SVG <image>; the plugin's allowlist just doesn't include it.
              onError={(e) => e.target.setAttribute('href', getChampionIconFallbackUrl())}
            />
            {isHighlighted && (
              <circle
                r={radius + 2.5}
                fill="none"
                stroke="var(--color-lol-gold-400)"
                strokeWidth={2}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
