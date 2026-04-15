import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Button, Input, Select } from './components/ui';

const REGIONS = [
  { value: 'americas', label: 'Americas (NA, LAN, LAS, BR)' },
  { value: 'europe', label: 'Europe (EUW, EUNE, TR, RU)' },
  { value: 'asia', label: 'Asia (KR, JP)' },
  { value: 'sea', label: 'Sea (OCE, SG, TW, VN)' },
];

const REGION_PLATFORMS = {
  americas: 'americas.api.riotgames.com',
  europe: 'europe.api.riotgames.com',
  asia: 'asia.api.riotgames.com',
  sea: 'sea.api.riotgames.com',
};

function App() {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('americas');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegionChange = (e) => {
    setRegion(e.target.value);
  };

  const fetchPlayerData = async () => {
    if (!gameName.trim() || !tagLine.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/api/player?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
      );
      
      if (!response.ok) {
        throw new Error('Jugador no encontrado');
      }
      
      const data = await response.json();
      data.region = region;
      data.platform = REGION_PLATFORMS[region];
      navigate('/player', { state: { playerData: data } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchPlayerData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-lol-dark-500 dark:to-lol-dark-300">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-lol-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Análisis de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lol-blue-500 to-blue-600">
              Support
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Análisis profundo de estadísticas de soporte. Vision, engage, healing y más métricas 
            diseñadas específicamente para el rol de support en League of Legends.
          </p>
        </div>

        <div className="bg-white dark:bg-lol-dark-100 rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre de Invocador"
                placeholder="Ej: Faker"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Input
                label="Tag Line"
                placeholder="Ej: KR1"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            <Select
              label="Región"
              value={region}
              onChange={handleRegionChange}
              options={REGIONS}
            />

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            <Button 
              onClick={fetchPlayerData} 
              loading={loading}
              className="w-full mt-6"
              size="lg"
            >
              Buscar Jugador
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="p-6 bg-white/50 dark:bg-lol-dark-100/50 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Vision Score</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Análisis detallado de warding</p>
          </div>
          
          <div className="p-6 bg-white/50 dark:bg-lol-dark-100/50 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Engage Stats</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crowd control y playmaking</p>
          </div>
          
          <div className="p-6 bg-white/50 dark:bg-lol-dark-100/50 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Support Core</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Healing, shielding y más</p>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>SupportGG • No afiliado con Riot Games</p>
      </footer>
    </div>
  );
}

export default App;
