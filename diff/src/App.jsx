import React, { useState } from 'react';
import './App.css';

function App() {
  const [gameName, setGameName] = useState(''); // Valor predeterminado
  const [tagLine, setTagLine] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [error, setError] = useState(null);

  const fetchPlayerData = async () => {
    setError(null); // Resetea el error
    setPlayerData(null); // Resetea los datos
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/player?gameName=${gameName}&tagLine=${tagLine}`);
      if (!response.ok) throw new Error('Jugador no encontrado.');
      const data = await response.json();
      setPlayerData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <h1>Clon de OP.GG</h1>
      <input
        type="text"
        placeholder="Ingresa el nombre de la cuenta"
        value={gameName}
        onChange={(e) => setGameName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Ingresa el tag"
        value={tagLine}
        onChange={(e) => setTagLine(e.target.value)}
      />
      <button onClick={fetchPlayerData}>Buscar</button>
      {error && <p>{error}</p>}
      {playerData && <pre>{JSON.stringify(playerData, null, 2)}</pre>}
    </div>
  );
}

export default App;
