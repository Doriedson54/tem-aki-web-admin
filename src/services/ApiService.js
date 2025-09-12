import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  API_BASE_URL, 
  API_TIMEOUT, 
  DEFAULT_HEADERS, 
  HTTP_STATUS, 
  RETRY_CONFIG 
} from '../config/api';

// Chave para armazenar o token de autenticação
const AUTH_TOKEN_KEY = '@NegociosDoBairro:auth_token';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    this.defaultHeaders = DEFAULT_HEADERS;
  }

  // Método para obter o token de autenticação
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao obter token de autenticação:', error);
      return null;
    }
  }

  // Método para salvar o token de autenticação
  async setAuthToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Erro ao salvar token de autenticação:', error);
    }
  }

  // Método para limpar o token de autenticação
  async clearAuthToken() {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao limpar token de autenticação:', error);
    }
  }

  // Método para obter headers com autenticação
  async getHeaders(additionalHeaders = {}) {
    const token = await this.getAuthToken();
    const headers = {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Método base para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(options.headers);
    
    const config = {
      method: 'GET',
      headers,
      timeout: this.timeout,
      ...options,
    };

    // Remove headers do options para evitar duplicação
    delete config.headers;
    config.headers = headers;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Verifica se a resposta é válida
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Tenta fazer parse do JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error);
      throw this.handleError(error);
    }
  }

  // Método para fazer requisições GET
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  // Método para fazer requisições POST
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Método para fazer requisições PUT
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Método para fazer requisições DELETE
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Método para upload de arquivos
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    
    // Adiciona o arquivo
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'image.jpg',
    });

    // Adiciona dados adicionais
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = await this.getHeaders({
      'Content-Type': 'multipart/form-data',
    });

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }

  // Método para tratar erros
  handleError(error) {
    if (error.name === 'AbortError') {
      return new Error('Timeout: A requisição demorou muito para responder');
    }

    if (error.message.includes('Network request failed')) {
      return new Error('Erro de rede: Verifique sua conexão com a internet');
    }

    if (error.message.includes('HTTP 401')) {
      // Token expirado ou inválido
      this.setAuthToken(null);
      return new Error('Sessão expirada. Faça login novamente.');
    }

    if (error.message.includes('HTTP 403')) {
      return new Error('Acesso negado: Você não tem permissão para esta ação');
    }

    if (error.message.includes('HTTP 404')) {
      return new Error('Recurso não encontrado');
    }

    if (error.message.includes('HTTP 500')) {
      return new Error('Erro interno do servidor. Tente novamente mais tarde.');
    }

    return error;
  }

  // Método para fazer requisições com retry automático melhorado
  async requestWithRetry(endpoint, options = {}, retries = RETRY_CONFIG.MAX_RETRIES) {
    const maxRetries = RETRY_CONFIG.MAX_RETRIES;
    const attempt = maxRetries - retries + 1;
    
    try {
      console.log(`Tentativa ${attempt}/${maxRetries} para ${endpoint}`);
      return await this.request(endpoint, options);
    } catch (error) {
      console.error(`Erro na tentativa ${attempt}/${maxRetries} para ${endpoint}:`, error.message);
      
      if (retries > 0 && this.shouldRetry(error)) {
        // Backoff exponencial com jitter para evitar thundering herd
        const baseDelay = RETRY_CONFIG.RETRY_DELAY;
        const exponentialDelay = baseDelay * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
        const jitter = Math.random() * 1000; // Adiciona até 1s de jitter
        const delay = Math.min(exponentialDelay + jitter, RETRY_CONFIG.MAX_DELAY || 10000);
        
        console.log(`Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
        await this.sleep(delay);
        return this.requestWithRetry(endpoint, options, retries - 1);
      }
      
      console.error(`Falha definitiva após ${attempt} tentativas para ${endpoint}`);
      throw error;
    }
  }

  // Verifica se deve tentar novamente a requisição
  shouldRetry(error) {
    // Retry em casos de timeout, erro de rede ou erros temporários do servidor
    const retryableErrors = [
      'Timeout',
      'Network request failed',
      'HTTP 500', // Internal Server Error
      'HTTP 502', // Bad Gateway
      'HTTP 503', // Service Unavailable
      'HTTP 504', // Gateway Timeout
      'HTTP 408', // Request Timeout
      'HTTP 429', // Too Many Requests
      'AbortError', // Timeout do AbortController
      'TypeError: Network request failed', // Erro de rede específico
      'TypeError: Failed to fetch', // Erro de fetch
      'Connection refused',
      'ECONNRESET',
      'ETIMEDOUT'
    ];
    
    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || 
      error.name === errorType ||
      (error.originalError && error.originalError.message.includes(errorType))
    );
  }

  // Método auxiliar para delay
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para verificar conectividade
  async checkConnectivity() {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton do serviço de API
const apiService = new ApiService();

export default apiService;
export { ApiService };