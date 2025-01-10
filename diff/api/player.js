import axios from 'axios';

export default async function handler(req, res) {
  const { gameName, tagLine } = req.query;
  const apiKey = process.env.REACT_APP_RIOT_API_KEY;

  if (!apiKey) {
    console.error('API key is missing');
    return res.status(500).json({ error: 'API key is missing' });
  }

  console.log('Using API key:', apiKey); // Mensaje de depuración
  console.log('Fetching data for gameName:', gameName, 'and tagLine:', tagLine);

  try {
    const response = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      { headers: { 'X-Riot-Token': apiKey } }
    );
    res.status(200).json(response.data); // Envía los datos al frontend
  } catch (error) {
    console.error('Error fetching data from Riot API:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
}
