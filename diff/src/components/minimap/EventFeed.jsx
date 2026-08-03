import { formatGameClock } from '../../lib/format';
import { describeEvent } from '../../lib/matchEvents';
import { frameIndexAtTimestamp } from '../../lib/heatmap';

/**
 * The whole match as a clickable list of events. Selecting one moves the
 * scrubber to the frame that covers it.
 *
 * The honesty problem this component has to solve: an event has a real
 * second-accurate timestamp (a kill at 2:53 happened at 2:53), but positions
 * only exist once every 60s. Jumping to a 2:53 kill can therefore only ever
 * show the map as of 2:00. Rather than hide that, every row whose event does
 * not sit exactly on its frame renders the frame it will actually show, so the
 * gap is visible before the click rather than discovered after it.
 */
export function EventFeed({ events, frames, frameInterval, selectedIndex, onSelect, nameByParticipantId }) {
  const rows = (events || [])
    .filter((event) => DISPLAYED_TYPES.has(event.type))
    .map((event) => {
      const frameIndex = frameIndexAtTimestamp({ frames }, event.timestamp);
      return {
        event,
        frameIndex,
        frameMs: frames?.[frameIndex]?.timestamp ?? 0,
      };
    });

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">Esta partida no registra eventos ubicables.</p>;
  }

  return (
    <div>
      <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        Eventos de la partida
      </h5>
      <p className="text-xs text-gray-500 mb-2">
        Al elegir un evento el mapa salta al frame de {Math.round(frameInterval / 1000)} s que lo
        contiene, que es la única posición que Riot publica.
      </p>

      <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded">
        {rows.map(({ event, frameIndex, frameMs }, i) => {
          const isSelected = frameIndex === selectedIndex;
          const snapped = frameMs !== event.timestamp;

          return (
            <li key={`${event.type}-${event.timestamp}-${i}`}>
              <button
                type="button"
                onClick={() => onSelect(frameIndex)}
                aria-current={isSelected ? 'true' : undefined}
                className={`w-full text-left px-2 py-1.5 flex items-baseline gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <span className="tabular-nums text-gray-500 shrink-0">
                  {formatGameClock(event.timestamp)}
                </span>
                <span className="text-gray-700 dark:text-gray-300 grow">
                  {describeEvent(event, { nameByParticipantId })}
                </span>
                {snapped && (
                  <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                    mapa {formatGameClock(frameMs)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Ward events are included even though they can never be drawn on the map —
 * they are the support's actual work, and the feed is a list, not a map.
 */
const DISPLAYED_TYPES = new Set([
  'CHAMPION_KILL',
  'CHAMPION_SPECIAL_KILL',
  'ELITE_MONSTER_KILL',
  'BUILDING_KILL',
  'TURRET_PLATE_DESTROYED',
  'WARD_PLACED',
  'WARD_KILL',
]);
