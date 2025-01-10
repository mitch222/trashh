import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [summonerName, setSummonerName] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [error, setError] = useState(null);

  const fetchPlayerData = async () => {
    setError(null); // Resetea el error
    setPlayerData(null); // Resetea los datos
    try {
      const response = await fetch(`/api/player?summonerName=${summonerName}`);
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
      <div>
        <input
          type="text"
          placeholder="Ingresa el nombre del invocador"
          value={summonerName}
          onChange={(e) => setSummonerName(e.target.value)}
        />
        <button onClick={fetchPlayerData}>Buscar</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {playerData && (
        <div>
          <h2>Información del Jugador</h2>
          <p><strong>Nombre:</strong> {playerData.name}</p>
          <p><strong>Nivel:</strong> {playerData.summonerLevel}</p>
        </div>
      )}
    </div>
  );
}

export default App;
