import axios from 'axios';

export default async function handler(req, res) {
  const { summonerName } = req.query;
  const [gameName, tagLine] = summonerName.split('#');
  try {
    const response = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } } // Usa tu API Key desde variables de entorno
    );
    res.status(200).json(response.data); // Envía los datos al frontend
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
}
