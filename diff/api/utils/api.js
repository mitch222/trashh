import axios from 'axios';

export const API_KEY = process.env.RIOT_API_KEY;
export const REQUEST_TIMEOUT = 4000;

export const riotApi = axios.create({
  headers: { 'X-Riot-Token': API_KEY },
  timeout: REQUEST_TIMEOUT
});

export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://trashh.vercel.app'
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleOptions(res) {
  if (res.method === 'OPTIONS') {
    return res.status(200).end();
  }
  return null;
}

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));