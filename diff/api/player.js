import axios from 'axios';

export default async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://trashh.vercel.app'
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Manejar solicitud OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { gameName, tagLine, region } = req.query;
  const apiKey = process.env.RIOT_API_KEY; // Mejor nombre para variable de entorno

  console.log(apiKey);

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error: API key missing',
      documentation: 'https://developer.riotgames.com/docs/portal' 
    });
  }

  // Validación de parámetros
  if (!gameName || !tagLine || !region) {
    return res.status(400).json({
      error: 'Missing required parameters: gameName, tagLine, region',
      example: '/api/player?gameName=YourName&tagLine=YourTag&region=americas'
    });
  }

  try {
    const response = await axios.get(`https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`, {
      headers: {
        'X-Riot-Token': apiKey
      }
    });

    const summoner = response.data;

    return res.status(200).json(summoner);
  } catch (error) {
    console.error(`Error fetching player data: ${error.message}`);
    return res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
}