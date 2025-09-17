// Utilitários para API

import { HTTP_STATUS, ERROR_MESSAGES, RETRY_CONFIG } from '../constants/api';

/**
 * Função para criar uma URL com parâmetros de query
 * @param {string} baseUrl - URL base
 * @param {object} params - Parâmetros de query
 * @returns {string} URL completa com parâmetros
 */
export const buildUrlWithParams = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

/**
 * Função para tratar erros de API
 * @param {Error} error - Erro capturado
 * @returns {object} Objeto de erro padronizado
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Erro de rede ou timeout
  if (error.name === 'AbortError') {
    return {
      type: 'TIMEOUT',
      message: ERROR_MESSAGES.TIMEOUT_ERROR,
      originalError: error,
    };
  }
  
  // Erro de rede
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: 'NETWORK',
      message: ERROR_MESSAGES.NETWORK_ERROR,
      originalError: error,
    };
  }
  
  // Erro HTTP
  if (error.status) {
    const errorType = getErrorTypeFromStatus(error.status);
    return {
      type: errorType,
      status: error.status,
      message: getErrorMessageFromStatus(error.status),
      originalError: error,
    };
  }
  
  // Erro desconhecido
  return {
    type: 'UNKNOWN',
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    originalError: error,
  };
};

/**
 * Função para obter tipo de erro baseado no status HTTP
 * @param {number} status - Status HTTP
 * @returns {string} Tipo do erro
 */
export const getErrorTypeFromStatus = (status) => {
  if (status === HTTP_STATUS.UNAUTHORIZED) return 'UNAUTHORIZED';
  if (status === HTTP_STATUS.FORBIDDEN) return 'FORBIDDEN';
  if (status === HTTP_STATUS.NOT_FOUND) return 'NOT_FOUND';
  if (status >= 500) return 'SERVER_ERROR';
  if (status >= 400) return 'CLIENT_ERROR';
  return 'UNKNOWN';
};

/**
 * Função para obter mensagem de erro baseada no status HTTP
 * @param {number} status - Status HTTP
 * @returns {string} Mensagem de erro
 */
export const getErrorMessageFromStatus = (status) => {
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return ERROR_MESSAGES.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    default:
      if (status >= 500) return ERROR_MESSAGES.SERVER_ERROR;
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};

/**
 * Função para verificar se um status deve ser retentado
 * @param {number} status - Status HTTP
 * @returns {boolean} Se deve tentar novamente
 */
export const shouldRetry = (status) => {
  return RETRY_CONFIG.retryOn.includes(status);
};

/**
 * Função para calcular delay de retry com backoff exponencial
 * @param {number} attempt - Número da tentativa (começando em 0)
 * @param {number} baseDelay - Delay base em milissegundos
 * @returns {number} Delay calculado
 */
export const calculateRetryDelay = (attempt, baseDelay = RETRY_CONFIG.retryDelay) => {
  return baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
};

/**
 * Função para validar resposta da API
 * @param {Response} response - Resposta do fetch
 * @returns {boolean} Se a resposta é válida
 */
export const isValidResponse = (response) => {
  return response && response.ok && response.status >= 200 && response.status < 300;
};

/**
 * Função para extrair dados da resposta
 * @param {Response} response - Resposta do fetch
 * @returns {Promise} Dados extraídos
 */
export const extractResponseData = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
};

/**
 * Função para criar headers de autorização
 * @param {string} token - Token de autorização
 * @param {string} type - Tipo de autorização (Bearer, Basic, etc.)
 * @returns {object} Headers com autorização
 */
export const createAuthHeaders = (token, type = 'Bearer') => {
  if (!token) return {};
  
  return {
    Authorization: `${type} ${token}`,
  };
};

/**
 * Função para sanitizar dados antes de enviar para API
 * @param {object} data - Dados a serem sanitizados
 * @returns {object} Dados sanitizados
 */
export const sanitizeApiData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Remove valores null, undefined ou strings vazias
    if (value !== null && value !== undefined && value !== '') {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};