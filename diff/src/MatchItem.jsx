import { useState } from 'react';
import { Badge } from './components/ui';
import { getSupport } from './lib/support';
import { formatKDA, getKDAColor } from './lib/kda';
import { getItemIcon, getChampionIconUrl, getChampionIconFallbackUrl } from './lib/items';
import { formatCCTime } from './lib/format';
import { MatchTimelinePanel } from './components/minimap/MatchTimelinePanel';

function MatchItem({ match, playerName, region }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTab, setExpandedTab] = useState('supports');
  const team1 = match.participants.filter((p) => p.teamId === 100);
  const team2 = match.participants.filter((p) => p.teamId === 200);

  // The minimap projection is calibrated for Summoner's Rift only — offering
  // the tab on another map would silently misplace everything.
  const canShowMap = match.gameMode === 'CLASSIC' && Boolean(region);
  const tabs = [
    { id: 'supports', label: 'Supports' },
    ...(canShowMap ? [{ id: 'map', label: 'Minimapa' }] : []),
  ];

  const currentPlayer = match.participants.find(p => p.summonerName === playerName);
  const isWin = currentPlayer?.win;
  const duration = match.duration;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const blueSupport = getSupport(team1);
  const redSupport = getSupport(team2);

  const renderItems = (participant) => {
    const items = [
      participant.item0,
      participant.item1,
      participant.item2,
      participant.item3,
      participant.item4,
      participant.item5,
    ];
    const trinket = participant.item6;

    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex gap-0.5">
          {items.map((itemId, idx) => (
            itemId && itemId !== 0 ? (
              <img
                key={idx}
                src={getItemIcon(itemId)}
                alt={`Item ${idx + 1}`}
                className="w-5 h-5 rounded-sm border border-gray-300 dark:border-gray-600"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div
                key={idx}
                className="w-5 h-5 rounded-sm bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
              />
            )
          ))}
        </div>
        {trinket && trinket !== 0 && (
          <img
            src={getItemIcon(trinket)}
            alt="Trinket"
            className="w-5 h-5 rounded-sm border border-yellow-500/50 ml-1"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
    );
  };

  const renderSupportStats = (support) => {
    if (!support) {
      return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
          <p className="text-sm text-gray-500">Support no identificado</p>
        </div>
      );
    }
    const isPlayer = support.summonerName === playerName;

    return (
      <div className={`p-4 rounded-lg ${isPlayer ? 'bg-lol-blue-500/20 ring-2 ring-lol-blue-500' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        <div className="flex items-center gap-3 mb-3">
          <img
            src={getChampionIconUrl(support.championName)}
            alt={support.championName}
            className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700"
            onError={(e) => { e.target.src = getChampionIconFallbackUrl(); }}
          />
          <div className="flex-1">
            <p className={`font-semibold ${isPlayer ? 'text-lol-blue-500' : 'text-gray-900 dark:text-white'}`}>
              {support.summonerName}
            </p>
            <p className={`text-lg font-bold ${getKDAColor(support.kills, support.deaths, support.assists)}`}>
              {formatKDA(support.kills, support.deaths, support.assists)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Healing (aliados):</span>
            <span className="font-semibold text-gray-900 dark:text-white">{support.healingDoneToAllies?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Tiempo CC:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCCTime(support.timeCCingOthers)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 019 10.172V9.242a31.16 31.16 0 00.4-2.51c.163.288.33.575.5.85.4.65.9 1.25 1.5 1.9A5 5 0 0113 13.5a3 3 0 01-.88 1.62z" clipRule="evenodd"/>
            </svg>
            {/* Damage to champions, not total damage: total includes minions
                and jungle, which says nothing about a support's teamfighting. */}
            <span className="text-gray-600 dark:text-gray-400">Daño a campeones:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {support.totalDamageDealtToChampions?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Shield:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{support.shielding?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Vision:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{support.visionScore || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Wards:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{support.wardsPlaced || 0}</span>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">Items:</p>
          {renderItems(support)}
        </div>
      </div>
    );
  };

  const renderParticipantRow = (participant) => {
    const isPlayer = participant.summonerName === playerName;
    return (
      <div 
        key={participant.summonerName}
        className={`
          flex items-center gap-2 p-1.5 rounded
          ${isPlayer ? 'bg-lol-blue-500/20 ring-1 ring-lol-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
        `}
      >
        <img
          src={getChampionIconUrl(participant.championName)}
          alt={participant.championName}
          className="w-6 h-6 rounded"
          onError={(e) => { e.target.src = getChampionIconFallbackUrl(); }}
        />
        <span className={`text-sm flex-1 truncate ${isPlayer ? 'font-bold text-lol-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
          {participant.summonerName}
        </span>
        <span className={`text-xs font-medium ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}>
          {participant.kills}/{participant.deaths}/{participant.assists}
        </span>
        {participant.visionScore !== undefined && (
          <span className="text-xs text-emerald-500 flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clipRule="evenodd"/>
            </svg>
            {participant.visionScore}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`
      rounded-xl overflow-hidden transition-all hover:shadow-lg
      ${isWin 
        ? 'bg-lol-win/5 border-l-4 border-lol-win' 
        : 'bg-lol-loss/5 border-l-4 border-lol-loss'
      }
      bg-white dark:bg-lol-dark-100 border border-gray-100 dark:border-gray-800
    `}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Ver detalles de la partida"
        className="w-full"
      >
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-48 p-4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isWin ? 'win' : 'loss'}>
                  {isWin ? 'Victoria' : 'Derrota'}
                </Badge>
                <span className="text-xs text-gray-500">{minutes}m {seconds}s</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {currentPlayer && (
              <div className="flex items-center gap-3">
                <img
                  src={getChampionIconUrl(currentPlayer.championName)}
                  alt={currentPlayer.championName}
                  className="w-14 h-14 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  onError={(e) => { e.target.src = getChampionIconFallbackUrl(); }}
                />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {currentPlayer.summonerName}
                  </p>
                  <p className={`text-lg font-bold ${getKDAColor(currentPlayer.kills, currentPlayer.deaths, currentPlayer.assists)}`}>
                    {formatKDA(currentPlayer.kills, currentPlayer.deaths, currentPlayer.assists)}
                  </p>
                  <p className="text-sm text-gray-500">
                    VS: {match.participants.filter(p => p.teamId !== currentPlayer.teamId)[0]?.summonerName || 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Equipo Azul
                </h4>
                <div className="space-y-1">
                  {team1.map(renderParticipantRow)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Equipo Rojo
                </h4>
                <div className="space-y-1">
                  {team2.map(renderParticipantRow)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex gap-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExpandedTab(tab.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${expandedTab === tab.id
                    ? 'bg-lol-blue-500 text-white'
                    : 'bg-white dark:bg-lol-dark-100 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {expandedTab === 'supports' && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                Comparación de Supports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Support Azul
                  </p>
                  {renderSupportStats(blueSupport)}
                </div>
                <div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Support Rojo
                  </p>
                  {renderSupportStats(redSupport)}
                </div>
              </div>
            </>
          )}

          {/* Mounted only on selection, so the timeline request needs explicit
              intent — expanding a row to read KDAs costs nothing. */}
          {expandedTab === 'map' && (
            <MatchTimelinePanel
              match={match}
              region={region}
              blueSupport={blueSupport}
              redSupport={redSupport}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default MatchItem;
