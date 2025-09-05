import { useState, useCallback } from 'react';
import { useNotification } from '../components/NotificationManager';

/**
 * Hook personalizado para gerenciar estados de API (loading, error, success)
 * Fornece uma interface consistente para operações assíncronas
 */
export const useApiState = (initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useNotification();

  // Executa uma operação assíncrona com tratamento automático de estados
  const execute = useCallback(async (asyncFunction, options = {}) => {
    const {
      showLoadingNotification = false,
      showSuccessNotification = false,
      showErrorNotification = true,
      successMessage = 'Operação realizada com sucesso!',
      loadingMessage = 'Carregando...',
      onSuccess,
      onError,
      resetErrorOnStart = true
    } = options;

    try {
      setLoading(true);
      if (resetErrorOnStart) {
        setError(null);
      }

      if (showLoadingNotification) {
        showSuccess(loadingMessage, 2000);
      }

      const result = await asyncFunction();
      setData(result);

      if (showSuccessNotification) {
        showSuccess(successMessage);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      if (showErrorNotification) {
        showError(errorMessage);
      }

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Reset todos os estados
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  // Limpa apenas o erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    clearError,
    setData
  };
};

/**
 * Extrai uma mensagem de erro legível de diferentes tipos de erro
 */
const getErrorMessage = (error) => {
  // Erro de rede
  if (error.message === 'Network request failed' || error.code === 'NETWORK_ERROR') {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Erro de timeout
  if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
    return 'A operação demorou muito para responder. Tente novamente.';
  }

  // Erros HTTP específicos
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data?.message || 'Dados inválidos. Verifique as informações e tente novamente.';
      case 401:
        return 'Sessão expirada. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para realizar esta ação.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return data?.message || 'Conflito de dados. Este item pode já existir.';
      case 422:
        return data?.message || 'Dados inválidos. Verifique os campos obrigatórios.';
      case 429:
        return 'Muitas tentativas. Aguarde um momento e tente novamente.';
      case 500:
        return 'Erro interno do servidor. Tente novamente em alguns minutos.';
      case 502:
      case 503:
      case 504:
        return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
      default:
        return data?.message || `Erro ${status}: ${error.response.statusText || 'Erro desconhecido'}`;
    }
  }

  // Erro personalizado com mensagem
  if (error.message) {
    return error.message;
  }

  // Erro genérico
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

/**
 * Hook especializado para operações CRUD
 */
export const useCrudState = (initialData = []) => {
  const apiState = useApiState(initialData);
  const { showSuccess } = useNotification();

  const create = useCallback(async (createFunction, item, successMessage = 'Item criado com sucesso!') => {
    const result = await apiState.execute(createFunction, {
      showSuccessNotification: true,
      successMessage,
      onSuccess: (newItem) => {
        // Adiciona o novo item à lista
        apiState.setData(prevData => Array.isArray(prevData) ? [...prevData, newItem] : [newItem]);
      }
    });
    return result;
  }, [apiState]);

  const update = useCallback(async (updateFunction, item, successMessage = 'Item atualizado com sucesso!') => {
    const result = await apiState.execute(updateFunction, {
      showSuccessNotification: true,
      successMessage,
      onSuccess: (updatedItem) => {
        // Atualiza o item na lista
        apiState.setData(prevData => {
          if (!Array.isArray(prevData)) return updatedItem;
          return prevData.map(existing => 
            existing.id === updatedItem.id ? updatedItem : existing
          );
        });
      }
    });
    return result;
  }, [apiState]);

  const remove = useCallback(async (deleteFunction, itemId, successMessage = 'Item removido com sucesso!') => {
    const result = await apiState.execute(deleteFunction, {
      showSuccessNotification: true,
      successMessage,
      onSuccess: () => {
        // Remove o item da lista
        apiState.setData(prevData => {
          if (!Array.isArray(prevData)) return null;
          return prevData.filter(item => item.id !== itemId);
        });
      }
    });
    return result;
  }, [apiState]);

  const fetch = useCallback(async (fetchFunction, showLoading = true) => {
    return apiState.execute(fetchFunction, {
      showLoadingNotification: showLoading
    });
  }, [apiState]);

  return {
    ...apiState,
    create,
    update,
    remove,
    fetch
  };
};

export default useApiState;