import { API_BASE_URL, DEFAULT_HEADERS } from '../config/api';

export async function apiGet(path) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { method: 'GET', headers: DEFAULT_HEADERS });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = json?.message || `Erro HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.response = json;
    throw error;
  }

  if (json?.success === false) {
    throw new Error(json?.message || 'Erro ao buscar dados');
  }

  return json?.data ?? json;
}

