// filepath: /c:/Users/mitch/Documents/Cursos/trashh/diff/src/PlayerPage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

function PlayerPage() {
  const location = useLocation();
  const { playerData } = location.state || {};

  return (
    <div>
      <h1>Datos del Jugador</h1>
      {playerData ? (
        <pre>{JSON.stringify(playerData, null, 2)}</pre>
      ) : (
        <p>No se encontraron datos del jugador.</p>
      )}
    </div>
  );
}

export default PlayerPage;