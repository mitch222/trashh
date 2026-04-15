import { Badge } from './components/ui';

function MatchItem({ match, playerName }) {
  const team1 = match.participants.slice(0, 5);
  const team2 = match.participants.slice(5, 10);
  
  const currentPlayer = match.participants.find(p => p.summonerName === playerName);
  const isWin = currentPlayer?.win;
  const duration = match.duration;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const formatKDA = (kills, deaths, assists) => {
    return `${kills} / ${deaths} / ${assists}`;
  };

  const getKDAColor = (kills, deaths, assists) => {
    if (deaths === 0) return 'text-purple-500';
    const kda = (kills + assists) / deaths;
    if (kda >= 5) return 'text-green-500';
    if (kda >= 3) return 'text-blue-500';
    if (kda >= 2) return 'text-yellow-500';
    return 'text-gray-500';
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
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-48 p-4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isWin ? 'win' : 'loss'}>
              {isWin ? 'Victoria' : 'Derrota'}
            </Badge>
            <span className="text-xs text-gray-500">{minutes}m {seconds}s</span>
          </div>
          {currentPlayer && (
            <div className="flex items-center gap-3">
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/champion/${currentPlayer.championName}.png`}
                alt={currentPlayer.championName}
                className="w-14 h-14 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  e.target.src = `https://ddragon.leagueoflegends.com/cdn/15.4.1/img/champion/Ahri.png`;
                }}
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
                {team1.map((participant, index) => {
                  const isPlayer = participant.summonerName === playerName;
                  return (
                    <div 
                      key={index} 
                      className={`
                        flex items-center gap-2 p-1.5 rounded
                        ${isPlayer ? 'bg-lol-blue-500/20 ring-1 ring-lol-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                      `}
                    >
                      <img 
                        src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/champion/${participant.championName}.png`}
                        alt={participant.championName}
                        className="w-6 h-6 rounded"
                        onError={(e) => {
                          e.target.src = `https://ddragon.leagueoflegends.com/cdn/15.4.1/img/champion/Ahri.png`;
                        }}
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
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Equipo Rojo
              </h4>
              <div className="space-y-1">
                {team2.map((participant, index) => {
                  const isPlayer = participant.summonerName === playerName;
                  return (
                    <div 
                      key={index} 
                      className={`
                        flex items-center gap-2 p-1.5 rounded
                        ${isPlayer ? 'bg-lol-blue-500/20 ring-1 ring-lol-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                      `}
                    >
                      <img 
                        src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/champion/${participant.championName}.png`}
                        alt={participant.championName}
                        className="w-6 h-6 rounded"
                        onError={(e) => {
                          e.target.src = `https://ddragon.leagueoflegends.com/cdn/15.4.1/img/champion/Ahri.png`;
                        }}
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
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchItem;
