import { useMemo, useState } from 'react';
import { Card, Button, Slider } from '../ui';
import { Minimap } from './Minimap';
import { SupportToggle } from './SupportToggle';
import { MinuteDetailsPanel } from './MinuteDetailsPanel';
import { useMatchTimeline } from '../../hooks/useMatchTimeline';
import { MINIMAP_SIZE } from '../../lib/map';
import { formatGameClock } from '../../lib/format';
import { projectToPixels } from '../../lib/mapCoords';
import {
  extractPositionSeries,
  projectSeries,
  buildTeamLookup,
  buildNameLookup,
} from '../../lib/heatmap';
import { buildWardWindows, activeWardsAt, summarizeWards, countWardsKilled } from '../../lib/wards';
import { eventsInWindow, positionedEvents, describeEvent } from '../../lib/matchEvents';
import { isInFountain } from '../../lib/mapCoords';

const BLUE_RGB = '10, 102, 255';
const RED_RGB = '232, 64, 87';

export function MatchTimelinePanel({ match, region, blueSupport, redSupport }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [supportView, setSupportView] = useState('both');

  const { timeline, loading, error } = useMatchTimeline({
    matchId: match.id,
    region,
    enabled: true,
  });

  const teamByParticipantId = useMemo(
    () => buildTeamLookup(match.participants),
    [match.participants]
  );
  const nameByParticipantId = useMemo(
    () => buildNameLookup(match.participants),
    [match.participants]
  );

  const levelAt = useMemo(() => {
    if (!timeline) return undefined;
    return (participantId, timestampMs) => {
      let level;
      for (const frame of timeline.frames) {
        if (frame.timestamp > timestampMs) break;
        level = frame.levels?.[String(participantId)] ?? level;
      }
      return level;
    };
  }, [timeline]);

  const wardData = useMemo(() => {
    if (!timeline) return null;
    return buildWardWindows(timeline.events, {
      gameDurationMs: match.duration * 1000,
      teamByParticipantId,
      levelAt,
    });
  }, [timeline, match.duration, teamByParticipantId, levelAt]);

  const heatLayers = useMemo(() => {
    if (!timeline) return [];
    const layers = [];
    const add = (support, color) => {
      if (!support?.participantId) return;
      const series = extractPositionSeries(timeline, support.participantId);
      layers.push({
        key: color === BLUE_RGB ? 'blue' : 'red',
        color,
        points: projectSeries(series, {
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
          teamId: support.teamId,
        }),
      });
    };
    if (supportView === 'blue' || supportView === 'both') add(blueSupport, BLUE_RGB);
    if (supportView === 'red' || supportView === 'both') add(redSupport, RED_RGB);
    return layers;
  }, [timeline, supportView, blueSupport, redSupport]);

  const currentFrame = timeline?.frames?.[frameIndex] ?? null;

  const champions = useMemo(() => {
    if (!currentFrame) return [];
    return match.participants
      .filter((p) => p.participantId !== null && p.participantId !== undefined)
      .map((participant) => {
        const position = currentFrame.positions?.[String(participant.participantId)];
        if (!position) return null;
        const pixel = projectToPixels(position, { width: MINIMAP_SIZE, height: MINIMAP_SIZE });
        if (!pixel) return null;
        return {
          participantId: participant.participantId,
          summonerName: participant.summonerName,
          championName: participant.championName,
          teamId: participant.teamId,
          isSupport:
            participant.participantId === blueSupport?.participantId ||
            participant.participantId === redSupport?.participantId,
          inFountain: isInFountain(position, participant.teamId),
          x: pixel.x,
          y: pixel.y,
        };
      })
      .filter(Boolean);
  }, [currentFrame, match.participants, blueSupport, redSupport]);

  const windowEvents = useMemo(() => {
    if (!timeline || !currentFrame) return [];
    return eventsInWindow(
      timeline.events,
      currentFrame.timestamp,
      currentFrame.timestamp + timeline.frameInterval
    );
  }, [timeline, currentFrame]);

  const markers = useMemo(
    () =>
      positionedEvents(windowEvents)
        .map((event, i) => {
          const pixel = projectToPixels(event.position, {
            width: MINIMAP_SIZE,
            height: MINIMAP_SIZE,
          });
          if (!pixel) return null;
          return {
            id: `${event.type}-${event.timestamp}-${i}`,
            type: event.type,
            x: pixel.x,
            y: pixel.y,
            label: describeEvent(event, { nameByParticipantId }),
          };
        })
        .filter(Boolean),
    [windowEvents, nameByParticipantId]
  );

  const wardSummary = useMemo(() => {
    if (!wardData || !currentFrame) return null;
    const supports = [blueSupport, redSupport].filter((s) => s?.participantId);
    const creatorIds = supports.map((s) => s.participantId);
    const summary = summarizeWards(wardData.windows, currentFrame.timestamp, { creatorIds });
    const totalPlaced = wardData.windows.filter((w) => w.startMs <= currentFrame.timestamp).length;
    return {
      ...summary,
      totalPlaced,
      killed: countWardsKilled(timeline.events, currentFrame.timestamp),
      supports: supports.map((support) => ({
        participantId: support.participantId,
        name: support.championName ?? support.summonerName,
        teamId: support.teamId,
        placed: summary.placedBy[support.participantId] ?? 0,
      })),
    };
  }, [wardData, currentFrame, blueSupport, redSupport, timeline]);

  const wardBuckets = useMemo(() => {
    if (!wardData || !currentFrame) return null;
    return activeWardsAt(wardData.windows, currentFrame.timestamp);
  }, [wardData, currentFrame]);

  // Neither support could be linked to the timeline — say so rather than
  // rendering an empty map that looks like "this support did nothing".
  if (!blueSupport?.participantId && !redSupport?.participantId) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">
          No se puede vincular la línea de tiempo con este support.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-full max-w-[512px] aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (!timeline || !currentFrame) return null;

  const sampleCount = timeline.frames.length;

  return (
    <div className="space-y-4">
      <SupportToggle
        value={supportView}
        onChange={setSupportView}
        blueName={blueSupport?.championName}
        redName={redSupport?.championName}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Minimap
            mapId={11}
            size={MINIMAP_SIZE}
            heatLayers={heatLayers}
            markers={markers}
            champions={champions}
            highlightIds={[blueSupport?.participantId, redSupport?.participantId].filter(Boolean)}
            ariaLabel={`Minimapa de la partida en el instante ${formatGameClock(currentFrame.timestamp)}`}
          />

          <p className="text-xs text-gray-500">
            Presencia muestreada cada {Math.round(timeline.frameInterval / 1000)} s ·{' '}
            {sampleCount} muestras. Las muestras en base pueden corresponder a momentos en que el
            campeón estaba muerto.
          </p>

          <Slider
            label="Minuto de la partida"
            min={0}
            max={timeline.frames.length - 1}
            value={frameIndex}
            onChange={setFrameIndex}
            valueLabel={formatGameClock(currentFrame.timestamp)}
          />

          {/* Always visible, never behind a disclosure. */}
          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-2">
            Las posiciones provienen de la línea de tiempo de Riot, que registra{' '}
            <strong>una muestra por campeón cada {Math.round(timeline.frameInterval / 1000)} s</strong>.
            Entre dos muestras no hay información: el mapa no muestra recorridos, solo posiciones
            puntuales. <strong>Riot no publica la posición de las wards</strong>, por lo que este
            mapa nunca las representa espacialmente.
          </p>
        </div>

        {wardSummary && wardBuckets && (
          <MinuteDetailsPanel
            timestamp={currentFrame.timestamp}
            frameInterval={timeline.frameInterval}
            events={windowEvents}
            wardSummary={wardSummary}
            wardBuckets={wardBuckets}
            nameByParticipantId={nameByParticipantId}
          />
        )}
      </div>
    </div>
  );
}
