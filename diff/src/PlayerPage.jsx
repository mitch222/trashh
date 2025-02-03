// filepath: /c:/Users/mitch/Documents/Cursos/trashh/diff/src/PlayerPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MatchItem from './MatchItem';

function PlayerPage() {
  const location = useLocation();
  const { playerData } = location.state || {};
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (playerData && playerData.puuid) {
      const fetchMatchData = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5173";
          const response = await fetch(`${apiUrl}/api/match?puuid=${playerData.puuid}&region=${playerData.region}`);
          if (!response.ok) throw new Error('Error fetching match data.');
          const data = await response.json();
          setMatchData(data);
        } catch (err) {
          setError(err.message);
        }
      };

      fetchMatchData();
    }
  }, [playerData]);

  return (
    <div>
      <h1>Datos del Jugador</h1>
      {playerData ? (
        <pre>{JSON.stringify(playerData, null, 2)}</pre>
      ) : (
        <p>No se encontraron datos del jugador.</p>
      )}
      <h2>Historial de Partidas</h2>
      {matchData ? (
        matchData.map((match, index) => (
          <MatchItem key={index} match={match} />
        ))
      ) : (
        error && <p>{error}</p>
      )}
    </div>
  );
}

export default PlayerPage;