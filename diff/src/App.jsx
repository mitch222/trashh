import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const [gameName, setGameName] = useState(''); // Valor predeterminado
  const [tagLine, setTagLine] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [region, setRegion] = useState('americas');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchPlayerData = async () => {
    setError(null); // Resetea el error
    setPlayerData(null); // Resetea los datos
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/player?gameName=${gameName}&tagLine=${tagLine}&region=${region}`);
      if (!response.ok) throw new Error('Jugador no encontrado.');
      const data = await response.json();
      data.region = region;
      console.log(data);
      setPlayerData(data);
      navigate('/player', { state: { playerData: data}});
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <h1>Clon de OP.GG</h1>
      <select value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="americas">North America</option>
        <option value="americas">LAN</option>
        <option value="americas">LAS</option>
        <option value="europe">Europe West</option>
        <option value="europe">Europe Nordic & East</option>
        <option value="asia">Korea</option>
        <option value="asia">Japan</option>
        <option value="americas">Brazil</option>
        <option value="asia">Oceania</option>
        <option value="europe">Turkey</option>
        <option value="asia">Russia</option>
      </select>
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
    </div>
  );
}

export default App;
