// Configurações da API para integração com o web-admin

// URL base da API do web-admin
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const API_BASE_URL = isDev
  ? 'http://192.168.3.195:3000/api' // Desenvolvimento - IP da máquina para Expo Go
  : 'https://temakinobairro.com.br/api'; // Produção

// Versão da API
export const API_VERSION = 'v1';

// Timeout para requisições (em milissegundos)
export const API_TIMEOUT = 10000;

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

// Códigos de status HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Configurações de retry para requisições falhadas
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  RETRY_MULTIPLIER: 2, // Dobra o delay a cada retry
};

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