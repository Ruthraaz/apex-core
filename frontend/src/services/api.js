export const API_BASE_URL = 'http://localhost:8000';

// Configuração do Interceptor de Fetch Global
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('apex_access_token');
  
  const isApiRequest = typeof resource === 'string' && (
    resource.startsWith(API_BASE_URL) || 
    resource.startsWith('/')
  ) && !resource.includes('omdbapi.com') && !resource.includes('spotify.com') && !resource.includes('twitch.tv');

  if (token && isApiRequest) {
    config = config || {};
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await originalFetch(resource, config);
    
    if (response.status === 401 && isApiRequest) {
      if (!resource.includes('/token') && !resource.includes('/register')) {
        localStorage.removeItem('apex_access_token');
        window.dispatchEvent(new Event('apex_auth_unauthorized'));
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Falha ao autenticar operador.');
  }
  return data;
}

export async function registerUser(username, email, password) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Falha ao cadastrar operador.');
  }
  return data;
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/users/me`);
  if (!response.ok) {
    throw new Error('Sessão expirada ou operador não autenticado.');
  }
  return await response.json();
}
