import { API_BASE_URL, DEFAULT_HEADERS, PROD_API_BASE_URL } from '../config/api';

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== 'string') return '';
  return baseUrl.replace(/\/+$/, '');
}

function joinUrl(baseUrl, path) {
  const b = normalizeBaseUrl(baseUrl);
  const p = typeof path === 'string' ? path : '';
  if (!p) return b;
  if (p.startsWith('/')) return `${b}${p}`;
  return `${b}/${p}`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const resp = await fetch(url, { ...(options || {}), signal: controller?.signal });
    return resp;
  } finally {
    if (id) clearTimeout(id);
  }
}

async function readJsonResponse(response) {
  const contentType = response.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json().catch(() => null);
  }
  const text = await response.text().catch(() => '');
  if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return { __rawText: text || null };
}

async function apiGetWithBase(baseUrl, path) {
  const url = joinUrl(baseUrl, path);
  const response = await fetchWithTimeout(url, { method: 'GET', headers: DEFAULT_HEADERS }, 12000);
  const json = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      `Erro HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.response = json;
    error.url = url;
    throw error;
  }

  if (json?.success === false) {
    const error = new Error(json?.message || 'Erro ao buscar dados');
    error.status = response.status;
    error.response = json;
    error.url = url;
    throw error;
  }

  return json?.data ?? json;
}

export async function apiGet(path) {
  const bases = [API_BASE_URL, PROD_API_BASE_URL].map(normalizeBaseUrl).filter(Boolean);
  const uniqueBases = Array.from(new Set(bases));

  let lastError = null;
  for (const baseUrl of uniqueBases) {
    try {
      return await apiGetWithBase(baseUrl, path);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Erro ao buscar dados');
}

