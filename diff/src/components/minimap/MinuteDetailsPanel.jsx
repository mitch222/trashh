import { formatGameClock } from '../../lib/format';
import { describeEvent } from '../../lib/matchEvents';

/**
 * Splits what we show into two sections with different epistemic status:
 * facts read straight from Riot data, and estimates computed from placement
 * timestamps plus community-sourced ward durations.
 *
 * Nothing in the estimate section may ever be rendered without the word
 * "estimado" adjacent to it, and no ward is ever given a position.
 */
export function MinuteDetailsPanel({
  timestamp,
  frameInterval,
  events,
  wardSummary,
  wardBuckets,
  nameByParticipantId,
}) {
  const windowEnd = timestamp + frameInterval;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Posiciones: instante <span className="font-semibold">{formatGameClock(timestamp)}</span>
        {' · '}
        Eventos: {formatGameClock(timestamp)}–{formatGameClock(windowEnd)}
      </p>

      <section>
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Hechos</h5>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {wardSummary.supports.map((support) => (
            <p key={support.participantId}>
              Wards de{' '}
              <span className={support.teamId === 100 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                {support.name}
              </span>
              : <span className="font-semibold">{support.placed}</span>
            </p>
          ))}
          <p className="text-gray-500">
            Total de la partida hasta {formatGameClock(timestamp)}:{' '}
            {wardSummary.totalPlaced} colocadas · {wardSummary.killed} destruidas
            {wardSummary.placedUnknownCreator > 0 && (
              <> · {wardSummary.placedUnknownCreator} de origen desconocido</>
            )}
          </p>
        </div>

        {events.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {events.map((event, i) => (
              <li key={`${event.type}-${event.timestamp}-${i}`} className="flex gap-2">
                <span className="tabular-nums text-gray-500 shrink-0">
                  {formatGameClock(event.timestamp)}
                </span>
                <span>{describeEvent(event, { nameByParticipantId })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Sin eventos en este minuto.</p>
        )}
      </section>

      <section className="border-l-4 border-amber-400 pl-3 py-1 bg-amber-50/50 dark:bg-amber-900/10 rounded-r">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Visión activa (estimado)
        </h5>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
          <p>
            Wards probablemente activas:{' '}
            <span className="font-semibold">{wardBuckets.active.length}</span>
          </p>
          {wardBuckets.possiblyActive.length > 0 && (
            <p className="text-gray-500">
              Posiblemente activas: {wardBuckets.possiblyActive.length}
            </p>
          )}
          {wardBuckets.unknown.length > 0 && (
            <p className="text-gray-500">
              Duración desconocida: {wardBuckets.unknown.length}{' '}
              <span className="text-xs">(colocadas en los últimos 5 min)</span>
            </p>
          )}
        </div>

        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            ¿Por qué es una estimación?
          </summary>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Riot <strong>no publica la posición de las wards</strong> ni un identificador que
            permita ligar una ward destruida con la ward que se colocó. Estas cifras se calculan a
            partir del momento de colocación y de la duración estimada de cada tipo de ward (datos
            de la comunidad, no de la API). Las wards de control y las Farsight se consideran
            activas hasta que un evento compatible las cierra; esa asociación es una inferencia, no
            un dato. Para los tipos cuya duración no pudimos verificar no afirmamos cuándo
            vencieron, solo que pasados 5 minutos ninguna ward de duración finita sigue en pie.
          </p>
        </details>
      </section>
    </div>
  );
}
