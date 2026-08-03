/**
 * Turrets, inhibitors, nexuses and the neutral objective pits, at their real
 * positions.
 *
 * Drawn beneath the champions and event markers: this is the board, not the
 * action. Every structure coordinate comes from Riot's own BUILDING_KILL
 * positions and every pit from ELITE_MONSTER_KILL positions (see
 * lib/structures.js), and "destroyed" is a plain timestamp comparison — so
 * nothing here is an estimate. The one exception is each nexus, whose position
 * is derived from its two nexus turrets and flagged `approximate`.
 *
 * Each kind gets its own silhouette rather than a colour-only difference, so
 * the map stays readable for colour-blind viewers and in a screenshot.
 */
export function StructureMarkers({ structures, objectives }) {
  return (
    <g>
      {(objectives || []).map((objective) => (
        <g key={objective.id} transform={`translate(${objective.x} ${objective.y})`} opacity={0.5}>
          <ObjectiveGlyph kind={objective.kind} />
          <title>{objective.label}</title>
        </g>
      ))}

      {(structures || []).map((structure) => {
        const color =
          structure.teamId === 100 ? 'var(--color-lol-blue-500)' : 'var(--color-lol-loss)';
        const destroyed = structure.destroyed;

        return (
          <g
            key={structure.id}
            transform={`translate(${structure.x} ${structure.y})`}
            opacity={destroyed ? 0.3 : 1}
          >
            <StructureGlyph kind={structure.kind} color={color} destroyed={destroyed} />
            <title>{describeStructure(structure)}</title>
          </g>
        );
      })}
    </g>
  );
}

/**
 * A destroyed structure keeps its silhouette but loses its fill, so the map
 * still shows where it stood — an empty lane would hide that a turret ever
 * existed there.
 */
function StructureGlyph({ kind, color, destroyed }) {
  const fill = destroyed ? 'none' : color;
  const stroke = destroyed ? 'var(--color-lol-dark-100)' : color;

  if (kind === 'NEXUS') {
    // Eight-pointed star: the biggest, most distinct shape on the board.
    return (
      <g fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round">
        <path d="M0,-9 L2.2,-2.8 L8.5,-4.5 L3.6,0 L8.5,4.5 L2.2,2.8 L0,9 L-2.2,2.8 L-8.5,4.5 L-3.6,0 L-8.5,-4.5 L-2.2,-2.8 Z" />
      </g>
    );
  }

  if (kind === 'INHIBITOR') {
    // Hexagon — clearly not a turret, clearly not the nexus star.
    return (
      <g fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round">
        <path d="M0,-6 L5.2,-3 L5.2,3 L0,6 L-5.2,3 L-5.2,-3 Z" />
      </g>
    );
  }

  // Turret: a crenellated tower — wider base, notched top.
  return (
    <g fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round">
      <path d="M-3.6,-4.6 L-3.6,-2.6 L-2.2,-2.6 L-2.2,-4.6 L-0.7,-4.6 L-0.7,-2.6 L0.7,-2.6 L0.7,-4.6 L2.2,-4.6 L2.2,-2.6 L3.6,-2.6 L3.6,-4.6 L4.4,-4.6 L4.4,-1.4 L3,-1.4 L3.6,4.6 L-3.6,4.6 L-3,-1.4 L-4.4,-1.4 L-4.4,-4.6 Z" />
    </g>
  );
}

/** Neutral pits are gold and never team-coloured — nobody owns them. */
function ObjectiveGlyph({ kind }) {
  const gold = 'var(--color-lol-gold-400)';

  if (kind === 'BARON') {
    // Baron: a horned diamond, deliberately larger than the dragon.
    return (
      <g fill="none" stroke={gold} strokeWidth={1.6} strokeLinejoin="round">
        <path d="M0,-8 L6.5,0 L0,8 L-6.5,0 Z" />
        <path d="M-3.4,-4.2 L-5.6,-7.4 M3.4,-4.2 L5.6,-7.4" strokeLinecap="round" />
      </g>
    );
  }

  // Dragon: a winged chevron.
  return (
    <g fill="none" stroke={gold} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-6.5,-3 L0,3.5 L6.5,-3" />
      <path d="M-3.6,-5.6 L0,-1.6 L3.6,-5.6" />
    </g>
  );
}

const LANE_ES = { TOP_LANE: 'calle superior', MID_LANE: 'calle central', BOT_LANE: 'calle inferior' };
const TIER_ES = {
  OUTER_TURRET: 'exterior',
  INNER_TURRET: 'interior',
  BASE_TURRET: 'de base',
  NEXUS_TURRET: 'del nexo',
};

function describeStructure(structure) {
  const team = structure.teamId === 100 ? 'Azul' : 'Rojo';
  const lane = LANE_ES[structure.lane] ?? structure.lane;

  let what;
  if (structure.kind === 'NEXUS') what = 'Nexo';
  else if (structure.kind === 'INHIBITOR') what = `Inhibidor ${lane}`;
  else what = `Torre ${TIER_ES[structure.tier] ?? ''} ${lane}`.replace(/\s+/g, ' ').trim();

  // The nexus has no BUILDING_KILL to destroy it, so it never claims a state.
  const state = structure.kind === 'NEXUS' ? '' : ` · ${structure.destroyed ? 'destruida' : 'en pie'}`;
  return `${what} (${team})${state}`;
}
