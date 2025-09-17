import { useState, useEffect, useCallback } from 'react';
import { CacheService } from '../services/CacheService';
import { AppState } from 'react-native';

export const useSmartCache = () => {
  const [cacheStats, setCacheStats] = useState({
    totalItems: 0,
    totalSize: 0,
    oldestAge: 0,
    newestAge: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Atualizar estatísticas do cache
  const updateCacheStats = useCallback(async () => {
    try {
      const stats = await CacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('[useSmartCache] Erro ao obter estatísticas:', error);
    }
  }, []);

  // Forçar sincronização
  const forceSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      await CacheService.forceSync();
      setLastSyncTime(Date.now());
      await updateCacheStats();
    } catch (error) {
      console.error('[useSmartCache] Erro na sincronização forçada:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [updateCacheStats]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    try {
      await CacheService.clearAllCache();
      await updateCacheStats();
      console.log('[useSmartCache] Cache limpo com sucesso');
    } catch (error) {
      console.error('[useSmartCache] Erro ao limpar cache:', error);
    }
  }, [updateCacheStats]);

  // Verificar se precisa sincronizar
  const shouldSync = useCallback(() => {
    return CacheService.shouldSync();
  }, []);

  // Adicionar item à fila de sincronização
  const addToSyncQueue = useCallback((endpoint, params = {}) => {
    CacheService.addToSyncQueue(endpoint, params);
  }, []);

  // Obter dados do cache
  const getCacheData = useCallback(async (endpoint, params = {}) => {
    try {
      return await CacheService.getCache(endpoint, params);
    } catch (error) {
      console.error('[useSmartCache] Erro ao obter dados do cache:', error);
      return null;
    }
  }, []);

  // Salvar dados no cache
  const setCacheData = useCallback(async (endpoint, params, data) => {
    try {
      await CacheService.setCache(endpoint, params, data);
      await updateCacheStats();
    } catch (error) {
      console.error('[useSmartCache] Erro ao salvar dados no cache:', error);
    }
  }, [updateCacheStats]);

  // Monitorar mudanças no estado do app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // App voltou ao foreground, atualizar estatísticas
        updateCacheStats();
        
        // Verificar se precisa sincronizar
        if (shouldSync()) {
          console.log('[useSmartCache] App ativo, verificando sincronização...');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Atualizar estatísticas iniciais
    updateCacheStats();

    return () => {
      subscription?.remove();
    };
  }, [updateCacheStats, shouldSync]);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      updateCacheStats();
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [updateCacheStats]);

  // Formatadores de dados
  const formatCacheSize = useCallback((bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatAge = useCallback((milliseconds) => {
    if (milliseconds === 0) return 'Nunca';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }, []);

  return {
    // Estados
    cacheStats,
    isSyncing,
    lastSyncTime,
    
    // Ações
    forceSync,
    clearCache,
    addToSyncQueue,
    getCacheData,
    setCacheData,
    updateCacheStats,
    
    // Utilitários
    shouldSync,
    formatCacheSize,
    formatAge,
    
    // Dados computados
    formattedStats: {
      totalItems: cacheStats.totalItems,
      totalSize: formatCacheSize(cacheStats.totalSize),
      oldestAge: formatAge(cacheStats.oldestAge),
      newestAge: formatAge(cacheStats.newestAge)
    }
  };
};

export default useSmartCache;