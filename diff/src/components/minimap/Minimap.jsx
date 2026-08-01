import { useState } from 'react';
import { HeatmapLayer } from './HeatmapLayer';
import { ChampionDots } from './ChampionDots';
import { EventMarkers } from './EventMarkers';
import { getMinimapUrl, getMinimapFallbackUrl, MINIMAP_SIZE } from '../../lib/map';
import { isSupportedMap } from '../../lib/mapCoords';

/**
 * Layered minimap: map image, heatmap canvas, then SVG overlays.
 *
 * Presentational only — it receives already-projected pixel coordinates and
 * fetches nothing.
 */
export function Minimap({
  mapId = 11,
  size = MINIMAP_SIZE,
  heatLayers = [],
  markers = [],
  champions = [],
  highlightIds = [],
  ariaLabel,
  className = '',
}) {
  const [mapSrc, setMapSrc] = useState(getMinimapUrl(mapId));

  if (!isSupportedMap(mapId)) {
    // Projecting with Summoner's Rift bounds onto another map would place
    // everything wrong, so refuse rather than mislead.
    return (
      <div className={`w-full max-w-[512px] aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <p className="text-sm text-gray-500 px-6 text-center">
          Mapa no soportado: el minimapa solo está calibrado para Grieta del Invocador.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full max-w-[512px] aspect-square rounded-lg overflow-hidden bg-lol-dark-500 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <img
        src={mapSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setMapSrc(getMinimapFallbackUrl(mapId))}
      />

      <HeatmapLayer width={size} height={size} layers={heatLayers} />

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <EventMarkers markers={markers} />
        <ChampionDots champions={champions} highlightIds={highlightIds} />
      </svg>
    </div>
  );
}
