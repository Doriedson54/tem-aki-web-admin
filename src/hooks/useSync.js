import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/SyncService';
import { useAuth } from '../contexts/AuthContext';
import NetInfo from '@react-native-community/netinfo';

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    pendingOperations: 0,
    lastSyncTime: null
  });
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Atualizar status da sincronização
  const updateSyncStatus = useCallback(() => {
    const status = syncService.getSyncStatus();
    setSyncStatus(status);
  }, []);

  // Sincronização manual
  const manualSync = useCallback(async () => {
    try {
      setError(null);
      await syncService.autoSync();
      updateSyncStatus();
    } catch (err) {
      setError(err.message || 'Erro durante a sincronização');
      console.error('Erro na sincronização manual:', err);
    }
  }, [updateSyncStatus]);

  // Operações offline-first
  const createBusinessOffline = useCallback(async (businessData) => {
    try {
      setError(null);
      const result = await syncService.createBusinessOfflineFirst(businessData);
      updateSyncStatus();
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao criar negócio');
      throw err;
    }
  }, [updateSyncStatus]);

  const updateBusinessOffline = useCallback(async (businessId, businessData) => {
    try {
      setError(null);
      const result = await syncService.updateBusinessOfflineFirst(businessId, businessData);
      updateSyncStatus();
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao atualizar negócio');
      throw err;
    }
  }, [updateSyncStatus]);

  const deleteBusinessOffline = useCallback(async (businessId) => {
    try {
      setError(null);
      const result = await syncService.deleteBusinessOfflineFirst(businessId);
      updateSyncStatus();
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao deletar negócio');
      throw err;
    }
  }, [updateSyncStatus]);

  // Limpar dados de sincronização
  const clearSyncData = useCallback(async () => {
    try {
      setError(null);
      await syncService.clearSyncData();
      updateSyncStatus();
    } catch (err) {
      setError(err.message || 'Erro ao limpar dados de sincronização');
      console.error('Erro ao limpar dados de sincronização:', err);
    }
  }, [updateSyncStatus]);

  // Verificar se precisa sincronizar
  const checkNeedsSync = useCallback(async () => {
    try {
      return await syncService.needsSync();
    } catch (err) {
      console.error('Erro ao verificar necessidade de sincronização:', err);
      return true;
    }
  }, []);

  // Configurar listeners e sincronização automática
  useEffect(() => {
    let syncInterval;
    let networkUnsubscribe;

    const setupSync = async () => {
      // Atualizar status inicial
      updateSyncStatus();

      // Configurar sincronização automática se usuário estiver logado
      if (user) {
        // Sincronização inicial
        try {
          await syncService.autoSync();
          updateSyncStatus();
        } catch (err) {
          console.error('Erro na sincronização inicial:', err);
        }

        // Configurar intervalo de sincronização
        syncInterval = setInterval(async () => {
          try {
            await syncService.autoSync();
            updateSyncStatus();
          } catch (err) {
            console.error('Erro na sincronização automática:', err);
          }
        }, 5 * 60 * 1000); // 5 minutos
      }

      // Listener para mudanças de conectividade
      networkUnsubscribe = NetInfo.addEventListener(state => {
        updateSyncStatus();
        
        // Se voltou online e há usuário logado, tentar sincronizar
        if (state.isConnected && user) {
          setTimeout(() => {
            syncService.autoSync().then(() => {
              updateSyncStatus();
            }).catch(err => {
              console.error('Erro na sincronização após reconexão:', err);
            });
          }, 1000); // Aguardar 1 segundo para estabilizar a conexão
        }
      });
    };

    setupSync();

    // Cleanup
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      if (networkUnsubscribe) {
        networkUnsubscribe();
      }
    };
  }, [user, updateSyncStatus]);

  // Atualizar status periodicamente
  useEffect(() => {
    const statusInterval = setInterval(updateSyncStatus, 10000); // A cada 10 segundos
    
    return () => clearInterval(statusInterval);
  }, [updateSyncStatus]);

  return {
    // Status
    syncStatus,
    error,
    
    // Ações
    manualSync,
    clearSyncData,
    checkNeedsSync,
    
    // Operações offline-first
    createBusinessOffline,
    updateBusinessOffline,
    deleteBusinessOffline,
    
    // Utilitários
    updateSyncStatus,
  };
};

export default useSync;