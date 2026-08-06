import { useSearchParams, Link } from 'react-router-dom';
import { Header } from './components/Header';
import { Button, Card, Badge, StatCard } from './components/ui';
import { useEffect, useState } from 'react';
import MatchItem from './MatchItem';
import { usePlayerData } from './hooks/usePlayerData';
import { getProfileIconUrl } from './lib/items';
import { QUEUES, QUEUE_KEYS, DEFAULT_QUEUE, isValidQueue } from '../shared/queues.js';

function PlayerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const region = searchParams.get('region');
  const gameName = searchParams.get('gameName');
  const tagLine = searchParams.get('tagLine');
  // Kept in the URL like every other input on this page, so a filtered view
  // survives a refresh and can be shared. An unknown value (hand-edited URL)
  // falls back instead of being sent to the API.
  const queueParam = searchParams.get('queue');
  const queue = isValidQueue(queueParam) ? queueParam : DEFAULT_QUEUE;
  const [activeTab, setActiveTab] = useState('overview');
  const [iconFailed, setIconFailed] = useState(false);

  // A stale iconFailed from a previous search must not hide the next
  // player's otherwise-valid icon.
  useEffect(() => {
    setIconFailed(false);
  }, [region, gameName, tagLine]);

  const {
    matches, stats, profileIconId, loading, error, hasMore, loadingMore, loadMoreMatches,
  } = usePlayerData({ region, gameName, tagLine, queue });

  const selectQueue = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set('queue', next);
    setSearchParams(params);
  };
  const profileIconUrl = getProfileIconUrl(profileIconId);

  if (!region || !gameName || !tagLine) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-lol-dark-500">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">No se encontraron datos del jugador.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="secondary">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-lol-dark-500">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-lol-blue-500 transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>

          <div className="bg-white dark:bg-lol-dark-100 rounded-2xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {profileIconUrl && !iconFailed ? (
                <img
                  src={profileIconUrl}
                  alt={`Ícono de invocador de ${gameName}`}
                  className="w-20 h-20 rounded-xl shadow-lg object-cover shrink-0"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-lol-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {gameName}
                  <span className="text-gray-500 ml-1">#{tagLine}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Badge variant="blue">{region.toUpperCase()}</Badge>
                  <Badge variant="support">Support Main</Badge>
                </div>
              </div>

              {stats && (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-lol-blue-500">{stats.winRate}%</p>
                    <p className="text-sm text-gray-500">Win Rate</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.kda}</p>
                    <p className="text-sm text-gray-500">KDA</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-500">{stats.games}</p>
                    <p className="text-sm text-gray-500">Partidas</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'vision', label: 'Vision' },
            { id: 'engage', label: 'Engage' },
            { id: 'core', label: 'Support Core' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-lol-blue-500 text-white'
                  : 'bg-white dark:bg-lol-dark-100 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-500">{error}</p>
              <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                  label="Victorias"
                  value={stats.wins}
                  subValue={`${stats.games - stats.wins} derrotas`}
                  highlight
                />
                <StatCard
                  label="Kills"
                  value={stats.kills}
                  subValue={`${(stats.kills / stats.games).toFixed(1)} / partido`}
                />
                <StatCard
                  label="Deaths"
                  value={stats.deaths}
                  subValue={`${(stats.deaths / stats.games).toFixed(1)} / partido`}
                />
                <StatCard
                  label="Assists"
                  value={stats.assists}
                  subValue={`${(stats.assists / stats.games).toFixed(1)} / partido`}
                />
                <StatCard
                  label="Vision Score"
                  value={stats.visionScore}
                  subValue={`${stats.avgVision} promedio`}
                  icon={
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                />
                <StatCard
                  label="KDA"
                  value={stats.kda}
                  subValue="General"
                />
              </div>
            )}

            {activeTab === 'vision' && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Vision Score"
                  value={stats.visionScore}
                  subValue="Total en partidas"
                  highlight
                  icon={
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Promedio Vision"
                  value={stats.avgVision}
                  subValue="Por partida"
                />
                <StatCard
                  label="Wards Placed"
                  value={stats.wardsPlaced}
                  subValue={`${stats.avgWardsPlaced} / partido`}
                  icon={
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  }
                />
                <StatCard
                  label="Wards Destroyed"
                  value={stats.wardsDestroyed}
                  subValue={`${stats.avgWardsDestroyed} / partido`}
                  icon={
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                />
                <StatCard
                  label="Control Wards"
                  value={stats.controlWardsPlaced}
                  subValue="Compradas"
                  icon={
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Vision Wards"
                  value={stats.visionWardsBought}
                  subValue="Totales"
                />
              </div>
            )}

            {activeTab === 'engage' && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Time CCing"
                  value={`${(stats.timeCCingOthers / 60).toFixed(1)}m`}
                  subValue="Tiempo total CC"
                  icon={
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Avg CC per Game"
                  value={`${(stats.timeCCingOthers / stats.games / 60).toFixed(1)}m`}
                  subValue="Por partida"
                  highlight
                />
                <StatCard
                  label="Gold Earned"
                  value={stats.goldEarned.toLocaleString()}
                  subValue={`${stats.avgGold.toLocaleString()} / partido`}
                  icon={
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/>
                    </svg>
                  }
                />
                <StatCard
                  label="Damage Dealt"
                  value={stats.damageDealt.toLocaleString()}
                  subValue="A campeones"
                />
              </div>
            )}

            {activeTab === 'core' && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Healing"
                  value={stats.totalHealSelfInclusive.toLocaleString()}
                  subValue={`${stats.avgHealing.toLocaleString()} / partido`}
                  highlight
                  icon={
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                    </svg>
                  }
                />
                <StatCard
                  label="Healing Allies"
                  value={stats.healingDoneToAllies.toLocaleString()}
                  subValue="A aliados"
                />
                <StatCard
                  label="Shielding"
                  value={stats.shielding.toLocaleString()}
                  subValue="Total absorbido"
                  icon={
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd"/>
                    </svg>
                  }
                />
                <StatCard
                  label="Assisted Kills"
                  value={stats.assists}
                  subValue="Asistencias"
                  icon={
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Partidas</h2>

                <div
                  role="group"
                  aria-label="Tipo de partida"
                  className="inline-flex rounded-lg bg-gray-100 dark:bg-lol-dark-400 p-1"
                >
                  {QUEUE_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectQueue(key)}
                      aria-pressed={queue === key}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        queue === key
                          ? 'bg-lol-blue-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {QUEUES[key].label}
                    </button>
                  ))}
                </div>
              </div>

              {matches && matches.length > 0 ? (
                matches.map((match, index) => (
                  <MatchItem
                    key={match.id || index}
                    match={match}
                    playerName={gameName}
                    region={region}
                  />
                ))
              ) : (
                <Card className="p-6">
                  <p className="text-center text-gray-500">
                    No se encontraron partidas de {QUEUES[queue].label}
                  </p>
                </Card>
              )}

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="secondary" disabled={loadingMore} onClick={loadMoreMatches}>
                    {loadingMore ? 'Cargando...' : 'Cargar más partidas'}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default PlayerPage;
