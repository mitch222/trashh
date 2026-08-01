export const POSITIONED_EVENT_TYPES = [
  'CHAMPION_KILL',
  'CHAMPION_SPECIAL_KILL',
  'ELITE_MONSTER_KILL',
  'BUILDING_KILL',
  'TURRET_PLATE_DESTROYED',
];

export const EVENT_LABELS_ES = {
  CHAMPION_KILL: 'Asesinato',
  CHAMPION_SPECIAL_KILL: 'Asesinato especial',
  ELITE_MONSTER_KILL: 'Monstruo épico',
  BUILDING_KILL: 'Estructura destruida',
  TURRET_PLATE_DESTROYED: 'Placa de torre',
  WARD_PLACED: 'Ward colocada',
  WARD_KILL: 'Ward destruida',
};

export const MONSTER_LABELS_ES = {
  DRAGON: 'Dragón',
  BARON_NASHOR: 'Barón',
  RIFTHERALD: 'Heraldo',
  HORDE: 'Cangrejo vacío',
  ATAKHAN: 'Atakhan',
};

const UNKNOWN_PARTICIPANT = 'Desconocido';

/** Events in the half-open interval [startMs, endMsExclusive). */
export function eventsInWindow(events, startMs, endMsExclusive) {
  return (events || []).filter((e) => e.timestamp >= startMs && e.timestamp < endMsExclusive);
}

/** Only the events that carry exact coordinates and can be drawn on the map. */
export function positionedEvents(events) {
  return (events || []).filter(
    (e) => POSITIONED_EVENT_TYPES.includes(e.type) && e.position !== undefined
  );
}

/**
 * Human-readable summary of one event, in Spanish.
 *
 * An absent or unmapped participant renders as "Desconocido" — never as an
 * empty string and never as a fabricated name.
 */
export function describeEvent(event, { nameByParticipantId = {} } = {}) {
  const name = (id) =>
    id === undefined || id === null ? UNKNOWN_PARTICIPANT : (nameByParticipantId[id] ?? UNKNOWN_PARTICIPANT);

  switch (event.type) {
    case 'CHAMPION_KILL':
      return `${name(event.killerId)} eliminó a ${name(event.victimId)}`;
    case 'CHAMPION_SPECIAL_KILL':
      return event.killType === 'KILL_FIRST_BLOOD'
        ? `${name(event.killerId)} consiguió la primera sangre`
        : `${name(event.killerId)} consiguió un asesinato especial`;
    case 'ELITE_MONSTER_KILL': {
      const monster = MONSTER_LABELS_ES[event.monsterType] ?? 'Monstruo épico';
      return `${name(event.killerId)} mató ${monster}`;
    }
    case 'BUILDING_KILL':
      return `${name(event.killerId)} destruyó una estructura`;
    case 'TURRET_PLATE_DESTROYED':
      return `${name(event.killerId)} rompió una placa de torre`;
    case 'WARD_PLACED':
      return `${name(event.creatorId)} colocó una ward`;
    case 'WARD_KILL':
      return `${name(event.killerId)} destruyó una ward`;
    default:
      return EVENT_LABELS_ES[event.type] ?? event.type;
  }
}
