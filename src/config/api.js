// Configurações da API para integração com o web-admin
import Constants from 'expo-constants';
// Importar constantes de API do arquivo centralizado
import { HTTP_STATUS, RETRY_CONFIG } from '../constants/api';

// URL base da API do web-admin
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// Obter configurações do .env através do Expo Constants
const getEnvVar = (key, defaultValue) => {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
};

export const API_BASE_URL = getEnvVar('API_BASE_URL', 
  isDev
    ? 'http://localhost:3000/api' // Desenvolvimento - servidor backend local
    : 'https://temakinobairro.com.br/api' // Produção
);

// Versão da API
export const API_VERSION = 'v1';

// Timeout para requisições (60 segundos para melhor estabilidade)
export const API_TIMEOUT = parseInt(getEnvVar('API_TIMEOUT', '60000'), 10);

// Headers padrão para todas as requisições
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    VERIFY_TOKEN: '/auth/verify',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Negócios
  BUSINESSES: {
    LIST: '/businesses',
    CREATE: '/businesses',
    UPDATE: (id) => `/businesses/${id}`,
    DELETE: (id) => `/businesses/${id}`,
    BY_CATEGORY: (categoryId) => `/businesses/category/${categoryId}`,
    BY_SUBCATEGORY: (subcategory) => `/businesses/subcategory/${subcategory}`,
    SEARCH: '/businesses/search',
  },
  
  // Categorias
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  
  // Upload de arquivos
  UPLOAD: {
    IMAGE: '/upload/image',
  },
};

// Re-exportar para compatibilidade
export { HTTP_STATUS, RETRY_CONFIG };

// Configurações de cache
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutos
  MAX_SIZE: 100, // Máximo de 100 itens no cache
  // Chaves para AsyncStorage
  BUSINESSES_KEY: '@businesses_cache',
  CATEGORIES_KEY: '@categories_cache',
  PENDING_OPERATIONS_KEY: '@pending_operations',
  LAST_SYNC_KEY: '@last_sync_time',
};

// Configurações de sincronização offline
export const SYNC_CONFIG = {
  ENABLED: true,
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutos
  MAX_PENDING_OPERATIONS: 50,
  AUTO_SYNC_ON_NETWORK_CHANGE: true,
  RETRY_FAILED_OPERATIONS: true,
};

export default {
  API_BASE_URL,
  API_VERSION,
  API_TIMEOUT,
  DEFAULT_HEADERS,
  API_ENDPOINTS,
  HTTP_STATUS,
  RETRY_CONFIG,
  CACHE_CONFIG,
  SYNC_CONFIG,
};