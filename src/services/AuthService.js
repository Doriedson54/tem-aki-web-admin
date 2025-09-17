import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './ApiService';
import { API_ENDPOINTS } from '../config/api';

// Chaves para armazenamento local
const STORAGE_KEYS = {
  TOKEN: '@NegociosDoBairro:auth_token',
  USER: '@NegociosDoBairro:user_data',
  REFRESH_TOKEN: '@NegociosDoBairro:refresh_token',
  LOGIN_TIME: '@NegociosDoBairro:login_time',
};

// Tempo de expiração do token (24 horas)
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000;

class AuthService {
  constructor() {
    this.apiService = apiService;
    this.currentUser = null;
    this.authToken = null;
    this.isInitialized = false;
  }

  // ============ INICIALIZAÇÃO ============

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Carrega dados salvos
      await this.loadStoredAuth();
      
      // Verifica se o token ainda é válido
      if (this.authToken) {
        const isValid = await this.validateToken();
        if (!isValid) {
          await this.logout();
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar AuthService:', error);
      await this.logout();
    }
  }

  async loadStoredAuth() {
    try {
      const [token, userData, loginTime] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.LOGIN_TIME,
      ]);

      if (token[1] && userData[1] && loginTime[1]) {
        const loginTimestamp = parseInt(loginTime[1]);
        const now = Date.now();

        // Verifica se o token não expirou
        if (now - loginTimestamp < TOKEN_EXPIRY_TIME) {
          this.authToken = token[1];
          this.currentUser = JSON.parse(userData[1]);
          
          // Configura o token no ApiService
          await this.apiService.setAuthToken(this.authToken);
        } else {
          // Token expirado, limpa dados
          await this.clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
      await this.clearStoredAuth();
    }
  }

  async clearStoredAuth() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      this.authToken = null;
      this.currentUser = null;
      await this.apiService.clearAuthToken();
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
    }
  }

  // ============ AUTENTICAÇÃO ============

  async login(email, password) {
    try {
      console.log('=== LOGIN START ===');
      console.log('Iniciando login para:', email);
      console.log('API Service disponível:', !!this.apiService);
      console.log('Endpoint:', API_ENDPOINTS.AUTH.LOGIN);
      
      let response;
      try {
        console.log('Fazendo requisição HTTP...');
        response = await this.apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
          email,
          password,
        });
        console.log('Requisição HTTP concluída com sucesso');
      } catch (httpError) {
        console.error('Erro na requisição HTTP:', httpError);
        throw new Error(`Erro de rede: ${httpError.message}`);
      }

      // Processar resposta da API com múltiplos fallbacks
      console.log('=== RESPONSE ANALYSIS ===');
      console.log('Original response:', JSON.stringify(response, null, 2));
      
      let responseData = response;
      
      // Tentar diferentes estruturas de resposta
      if (response && response.data) {
        responseData = response.data;
        console.log('Using response.data:', JSON.stringify(responseData, null, 2));
      } else {
        console.log('Using direct response:', JSON.stringify(responseData, null, 2));
      }
      
      // Verificar se a resposta tem a estrutura esperada
      if (!responseData || typeof responseData !== 'object') {
        console.error('Resposta inválida:', responseData);
        throw new Error('Resposta de login inválida - formato incorreto');
      }
      
      // Extrair dados com fallbacks
      let success = responseData.success;
      let data = responseData.data;
      let message = responseData.message;
      
      // Fallback: se success não existe, assumir true se há dados válidos
      if (success === undefined && responseData.token && responseData.user) {
        success = true;
        data = {
          token: responseData.token,
          user: responseData.user
        };
      }
      
      // Validação de sucesso
      if (success !== true && success !== 'true' && success !== 1) {
        throw new Error(message || 'Falha na autenticação');
      }
      
      // Validação de dados
      if (!data || typeof data !== 'object') {
        console.error('Dados não encontrados:', data);
        throw new Error('Dados de autenticação não encontrados');
      }
      
      // Validação de token
      if (!data.token || typeof data.token !== 'string') {
        console.error('Token inválido:', data.token);
        throw new Error('Token de autenticação não encontrado');
      }
      
      // Validação de usuário
      if (!data.user || typeof data.user !== 'object') {
        console.error('Usuário inválido:', data.user);
        throw new Error('Dados do usuário não encontrados');
      }
      
      const { token, user } = data;
      const refreshToken = data.refreshToken || null; // refreshToken é opcional

      // Salva dados de autenticação
      await this.saveAuthData(token, user, refreshToken);

      return {
        success: true,
        user: this.currentUser,
        token: this.authToken,
      };
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Email ou senha incorretos';
            break;
          case 403:
            errorMessage = 'Acesso negado';
            break;
          case 429:
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de conexão. Verifique sua internet';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async register(userData) {
    try {
      const response = await this.apiService.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      // Processar resposta da API
      const responseData = response.data || response;
      const { data, success } = responseData;
      
      if (success && data && data.token && data.user) {
        // Auto-login após registro
        const { token, user } = data;
        const refreshToken = data.refreshToken || null; // refreshToken é opcional
        await this.saveAuthData(token, user, refreshToken);
      }

      return {
        success: true,
        user: this.currentUser,
        token: this.authToken,
      };
    } catch (error) {
      console.error('Erro no registro:', error);
      
      let errorMessage = 'Erro ao criar conta';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Dados inválidos';
            break;
          case 409:
            errorMessage = 'Email já está em uso';
            break;
          case 422:
            errorMessage = 'Dados incompletos ou inválidos';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async logout() {
    try {
      // Tenta fazer logout no servidor
      if (this.authToken) {
        await this.apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
      }
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
      // Continua com logout local mesmo se falhar no servidor
    } finally {
      // Limpa dados locais
      await this.clearStoredAuth();
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await this.apiService.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });

      // Processar resposta da API
      const responseData = response.data || response;
      const { data, success } = responseData;
      
      if (success && data && data.token) {
        const { token, user } = data;
        const newRefreshToken = data.refreshToken || refreshToken; // usa o novo ou mantém o atual
        await this.saveAuthData(token, user || this.currentUser, newRefreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      await this.logout();
      return false;
    }
  }

  async validateToken() {
    try {
      if (!this.authToken) return false;

      const response = await this.apiService.post(API_ENDPOINTS.AUTH.VERIFY_TOKEN, {
        token: this.authToken
      });
      return response.success === true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  }

  // ============ GERENCIAMENTO DE DADOS ============

  async saveAuthData(token, user, refreshToken = null) {
    try {
      this.authToken = token;
      this.currentUser = user;

      const loginTime = Date.now().toString();

      const dataToSave = [
        [STORAGE_KEYS.TOKEN, token],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
        [STORAGE_KEYS.LOGIN_TIME, loginTime],
      ];

      if (refreshToken) {
        dataToSave.push([STORAGE_KEYS.REFRESH_TOKEN, refreshToken]);
      }

      await AsyncStorage.multiSet(dataToSave);
      await this.apiService.setAuthToken(token);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
      throw error;
    }
  }

  // ============ GETTERS ============

  isAuthenticated() {
    return !!(this.authToken && this.currentUser);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAuthToken() {
    return this.authToken;
  }

  getUserRole() {
    return this.currentUser?.role || 'user';
  }

  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  // ============ PERFIL DO USUÁRIO ============

  async updateProfile(profileData) {
    try {
      const response = await this.apiService.put(
        API_ENDPOINTS.AUTH.PROFILE,
        profileData
      );

      const updatedUser = response.data || response;
      
      // Atualiza dados locais
      this.currentUser = { ...this.currentUser, ...updatedUser };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      return {
        success: false,
        error: 'Erro ao atualizar perfil',
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      await this.apiService.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      return {
        success: true,
        message: 'Senha alterada com sucesso',
      };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = 'Erro ao alterar senha';
      
      if (error.response?.status === 400) {
        errorMessage = 'Senha atual incorreta';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ============ RECUPERAÇÃO DE SENHA ============

  async forgotPassword(email) {
    try {
      await this.apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      
      return {
        success: true,
        message: 'Email de recuperação enviado',
      };
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      
      return {
        success: false,
        error: 'Erro ao enviar email de recuperação',
      };
    }
  }

  async resetPassword(token, newPassword) {
    try {
      await this.apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword,
      });
      
      return {
        success: true,
        message: 'Senha redefinida com sucesso',
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      
      return {
        success: false,
        error: 'Erro ao redefinir senha',
      };
    }
  }

  // ============ UTILITÁRIOS ============

  async getLoginTime() {
    try {
      const loginTime = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
      return loginTime ? parseInt(loginTime) : null;
    } catch (error) {
      console.error('Erro ao obter tempo de login:', error);
      return null;
    }
  }

  async getTimeUntilExpiry() {
    if (!this.isAuthenticated()) return 0;
    
    const loginTime = await this.getLoginTime();
    if (!loginTime) return 0;
    
    const expiryTime = loginTime + TOKEN_EXPIRY_TIME;
    const timeLeft = expiryTime - Date.now();
    
    return Math.max(0, timeLeft);
  }

  async isTokenExpiringSoon(thresholdMinutes = 30) {
    const timeLeft = await this.getTimeUntilExpiry();
    const threshold = thresholdMinutes * 60 * 1000;
    
    return timeLeft > 0 && timeLeft < threshold;
  }
}

// Instância singleton
const authService = new AuthService();

export default authService;
export { AuthService };