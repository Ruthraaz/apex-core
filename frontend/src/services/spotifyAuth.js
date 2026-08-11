// spotifyAuth.js - PKCE OAuth & Spotify Web API Helper

const CLIENT_ID_KEY = 'spotify_client_id';
// Client ID configurável pelo ambiente (import.meta.env) ou localStorage / fallback
const DEFAULT_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '94be4c8124724d9cb53c05646f7c71dd';

export const getClientId = () => {
  return localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
};

export const setClientId = (clientId) => {
  localStorage.setItem(CLIENT_ID_KEY, clientId);
};

export const REDIRECT_URI = 'http://127.0.0.1:5173/';

export const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

// Gerador de strings aleatórias para o desafio PKCE
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Inicia o redirecionamento OAuth com PKCE
export async function loginWithSpotify() {
  const clientId = getClientId();
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Trata o retorno do callback OAuth na URL
export async function handleSpotifyCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    const verifier = localStorage.getItem('spotify_code_verifier');
    const clientId = getClientId();

    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier || '',
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('spotify_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        localStorage.setItem('spotify_token_expires_at', Date.now() + data.expires_in * 1000);

        // Limpa o ?code=... da barra de navegação mantendo o estado limpo
        window.history.replaceState({}, document.title, window.location.pathname);
        return data.access_token;
      }
    } catch (e) {
      console.error('Erro ao trocar código OAuth do Spotify por token:', e);
    }
  }

  return getStoredToken();
}

// Retorna o token se estiver válido no localStorage
export function getStoredToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = localStorage.getItem('spotify_token_expires_at');

  if (token && expiresAt && Date.now() < Number(expiresAt)) {
    return token;
  }
  return null;
}

// Limpa sessão do Spotify
export function logoutSpotify() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expires_at');
  localStorage.removeItem('spotify_code_verifier');
}
