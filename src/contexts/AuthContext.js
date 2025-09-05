import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import authService from '../services/AuthService';
import businessService from '../services/BusinessService';

// Estados de autenticação
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
};

// Ações do reducer
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_UNAUTHENTICATED: 'SET_UNAUTHENTICATED',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Estado inicial
const initialState = {
  status: AUTH_STATES.LOADING,
  user: null,
  token: null,
  error: null,
  isLoading: true,
  isAuthenticated: false,
  isAdminAuthenticated: false, // Mantém compatibilidade com código existente
};

// Reducer para gerenciar estado de autenticação
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        status: AUTH_STATES.LOADING,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.SET_AUTHENTICATED:
      const isAdmin = action.payload.user?.role === 'admin';
      return {
        ...state,
        status: AUTH_STATES.AUTHENTICATED,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        isAdminAuthenticated: isAdmin, // Compatibilidade
        error: null,
      };

    case AUTH_ACTIONS.SET_UNAUTHENTICATED:
      return {
        ...state,
        status: AUTH_STATES.UNAUTHENTICATED,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        isAdminAuthenticated: false, // Compatibilidade
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        status: AUTH_STATES.ERROR,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      const updatedUser = { ...state.user, ...action.payload };
      const isAdminUpdated = updatedUser?.role === 'admin';
      return {
        ...state,
        user: updatedUser,
        isAdminAuthenticated: isAdminUpdated, // Compatibilidade
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Criação do contexto
const AuthContext = createContext(null);

// Provider do contexto de autenticação
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Inicialização do serviço de autenticação
  useEffect(() => {
    initializeAuth();
  }, []);

  // Verifica periodicamente se o token está expirando
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        checkTokenExpiry();
      }, 5 * 60 * 1000); // Verifica a cada 5 minutos

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  // ============ FUNÇÕES AUXILIARES ============

  async function initializeAuth() {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      
      // Inicializa o BusinessService para garantir dados locais
      await businessService.initializeStorage();
      
      await authService.initialize();
      
      if (authService.isAuthenticated()) {
        dispatch({
          type: AUTH_ACTIONS.SET_AUTHENTICATED,
          payload: {
            user: authService.getCurrentUser(),
            token: authService.getAuthToken(),
          },
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_UNAUTHENTICATED });
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Erro ao inicializar autenticação',
      });
    }
  }

  async function checkTokenExpiry() {
    try {
      const isExpiringSoon = await authService.isTokenExpiringSoon();
      if (isExpiringSoon) {
        console.log('Token expirando em breve, tentando renovar...');
        const renewed = await authService.refreshToken();
        
        if (renewed) {
          dispatch({
            type: AUTH_ACTIONS.SET_AUTHENTICATED,
            payload: {
              user: authService.getCurrentUser(),
              token: authService.getAuthToken(),
            },
          });
        } else {
          await logout();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
    }
  }

  // ============ FUNÇÕES DE AUTENTICAÇÃO ============

  async function login(email, password) {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_AUTHENTICATED,
          payload: {
            user: result.user,
            token: result.token,
          },
        });
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Erro inesperado ao fazer login';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }

  // Função de compatibilidade com o código existente
  async function loginAdmin(username, password) {
    // Converte para o novo formato de login
    return await login(username, password);
  }

  async function register(userData) {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const result = await authService.register(userData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_AUTHENTICATED,
          payload: {
            user: result.user,
            token: result.token,
          },
        });
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Erro inesperado ao criar conta';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }

  async function logout() {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      
      await authService.logout();
      
      dispatch({ type: AUTH_ACTIONS.SET_UNAUTHENTICATED });
      return { success: true, message: 'Logout realizado com sucesso!' };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpa o estado local
      dispatch({ type: AUTH_ACTIONS.SET_UNAUTHENTICATED });
      return { success: true, message: 'Logout realizado com sucesso!' };
    }
  }

  // Função de compatibilidade com o código existente
  const logoutAdmin = logout;

  // ============ FUNÇÕES DE PERFIL ============

  async function updateProfile(profileData) {
    try {
      const result = await authService.updateProfile(profileData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: result.user,
        });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: 'Erro ao alterar senha' };
    }
  }

  // ============ FUNÇÕES DE RECUPERAÇÃO DE SENHA ============

  async function forgotPassword(email) {
    try {
      const result = await authService.forgotPassword(email);
      return result;
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      return { success: false, error: 'Erro ao enviar email de recuperação' };
    }
  }

  async function resetPassword(token, newPassword) {
    try {
      const result = await authService.resetPassword(token, newPassword);
      return result;
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { success: false, error: 'Erro ao redefinir senha' };
    }
  }

  // ============ FUNÇÕES UTILITÁRIAS ============

  function clearError() {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }

  function isAdmin() {
    return authService.isAdmin();
  }

  function getUserRole() {
    return authService.getUserRole();
  }

  // ============ VALOR DO CONTEXTO ============

  const contextValue = {
    // Estado
    ...state,
    
    // Funções de autenticação
    login,
    register,
    logout,
    
    // Funções de compatibilidade
    loginAdmin,
    logoutAdmin,
    
    // Funções de perfil
    updateProfile,
    changePassword,
    
    // Funções de recuperação de senha
    forgotPassword,
    resetPassword,
    
    // Funções utilitárias
    clearError,
    isAdmin,
    getUserRole,
    
    // Estados derivados
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    hasError: !!state.error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

// Hook para verificar se o usuário está autenticado
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    canAccess: isAuthenticated && !isLoading,
  };
}

// Hook para verificar se o usuário é admin
export function useAdminGuard() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isAdmin: isAdmin(),
    canAccess: isAuthenticated && !isLoading && isAdmin(),
  };
}

export default AuthContext;
export { AUTH_STATES, AUTH_ACTIONS };