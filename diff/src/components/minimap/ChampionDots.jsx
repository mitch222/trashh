import { describeDot } from './dotLabels';

/**
 * The 10 champion positions at one instant, as SVG so each dot can carry a
 * tooltip and an accessible name.
 *
 * Fountain-flagged dots render hollow: Riot reports a position for dead
 * champions too, so a solid dot at base would overstate what we know.
 */
export function ChampionDots({ champions, highlightIds = [] }) {
  return (
    <g>
      {(champions || []).map((champion) => {
        const isHighlighted = highlightIds.includes(champion.participantId);
        const color = champion.teamId === 100 ? 'var(--color-lol-blue-500)' : 'var(--color-lol-loss)';
        const radius = isHighlighted ? 7 : 4.5;

        return (
          <g key={champion.participantId}>
            <circle
              cx={champion.x}
              cy={champion.y}
              r={radius}
              fill={champion.inFountain ? 'none' : color}
              stroke={color}
              strokeWidth={champion.inFountain ? 1.5 : 1}
              strokeDasharray={champion.inFountain ? '3 2' : undefined}
              opacity={champion.inFountain ? 0.65 : 1}
            >
              <title>{describeDot(champion)}</title>
            </circle>
            {isHighlighted && (
              <circle
                cx={champion.x}
                cy={champion.y}
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
