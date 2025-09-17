import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './ApiService';

class CacheService {
  constructor() {
    this.syncInProgress = false;
    this.syncQueue = new Set();
    this.lastSyncTime = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutos
    this.maxCacheAge = 30 * 60 * 1000; // 30 minutos
    
    // Iniciar sincronização automática
    this.startBackgroundSync();
  }

  // Chaves de cache
  getCacheKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `cache_${endpoint}_${paramString}`;
  }

  getMetadataKey(cacheKey) {
    return `${cacheKey}_metadata`;
  }

  // Salvar dados no cache com metadata
  async setCache(endpoint, params, data) {
    try {
      const cacheKey = this.getCacheKey(endpoint, params);
      const metadataKey = this.getMetadataKey(cacheKey);
      
      const metadata = {
        timestamp: Date.now(),
        endpoint,
        params,
        dataSize: JSON.stringify(data).length,
        version: '1.0'
      };

      await Promise.all([
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)),
        AsyncStorage.setItem(metadataKey, JSON.stringify(metadata))
      ]);

      console.log(`[CacheService] Dados salvos no cache: ${cacheKey}`);
    } catch (error) {
      console.error('[CacheService] Erro ao salvar cache:', error);
    }
  }

  // Recuperar dados do cache
  async getCache(endpoint, params = {}) {
    try {
      const cacheKey = this.getCacheKey(endpoint, params);
      const metadataKey = this.getMetadataKey(cacheKey);
      
      const [cachedData, metadataStr] = await Promise.all([
        AsyncStorage.getItem(cacheKey),
        AsyncStorage.getItem(metadataKey)
      ]);

      if (!cachedData || !metadataStr) {
        return null;
      }

      const metadata = JSON.parse(metadataStr);
      const age = Date.now() - metadata.timestamp;

      // Verificar se o cache expirou
      if (age > this.maxCacheAge) {
        console.log(`[CacheService] Cache expirado: ${cacheKey}`);
        await this.removeCache(endpoint, params);
        return null;
      }

      const data = JSON.parse(cachedData);
      console.log(`[CacheService] Dados recuperados do cache: ${cacheKey} (idade: ${Math.round(age/1000)}s)`);
      
      return {
        data,
        metadata,
        isStale: age > (this.maxCacheAge / 2) // Considera stale após 15 minutos
      };
    } catch (error) {
      console.error('[CacheService] Erro ao recuperar cache:', error);
      return null;
    }
  }

  // Remover cache específico
  async removeCache(endpoint, params = {}) {
    try {
      const cacheKey = this.getCacheKey(endpoint, params);
      const metadataKey = this.getMetadataKey(cacheKey);
      
      await Promise.all([
        AsyncStorage.removeItem(cacheKey),
        AsyncStorage.removeItem(metadataKey)
      ]);

      console.log(`[CacheService] Cache removido: ${cacheKey}`);
    } catch (error) {
      console.error('[CacheService] Erro ao remover cache:', error);
    }
  }

  // Limpar todo o cache
  async clearAllCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`[CacheService] ${cacheKeys.length} itens de cache removidos`);
      }
    } catch (error) {
      console.error('[CacheService] Erro ao limpar cache:', error);
    }
  }

  // Obter estatísticas do cache
  async getCacheStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_') && !key.includes('_metadata'));
      const metadataKeys = keys.filter(key => key.includes('_metadata'));
      
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;
      
      for (const metadataKey of metadataKeys) {
        try {
          const metadataStr = await AsyncStorage.getItem(metadataKey);
          if (metadataStr) {
            const metadata = JSON.parse(metadataStr);
            totalSize += metadata.dataSize || 0;
            oldestTimestamp = Math.min(oldestTimestamp, metadata.timestamp);
            newestTimestamp = Math.max(newestTimestamp, metadata.timestamp);
          }
        } catch (e) {
          // Ignorar erros de metadata corrompida
        }
      }

      return {
        totalItems: cacheKeys.length,
        totalSize,
        oldestAge: oldestTimestamp < Date.now() ? Date.now() - oldestTimestamp : 0,
        newestAge: newestTimestamp > 0 ? Date.now() - newestTimestamp : 0
      };
    } catch (error) {
      console.error('[CacheService] Erro ao obter estatísticas:', error);
      return { totalItems: 0, totalSize: 0, oldestAge: 0, newestAge: 0 };
    }
  }

  // Adicionar endpoint à fila de sincronização
  addToSyncQueue(endpoint, params = {}) {
    const syncKey = this.getCacheKey(endpoint, params);
    this.syncQueue.add(syncKey);
    console.log(`[CacheService] Adicionado à fila de sync: ${syncKey}`);
  }

  // Sincronização em background
  async performBackgroundSync() {
    if (this.syncInProgress || this.syncQueue.size === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`[CacheService] Iniciando sincronização de ${this.syncQueue.size} itens`);

    const syncItems = Array.from(this.syncQueue);
    this.syncQueue.clear();

    for (const syncKey of syncItems) {
      try {
        // Extrair endpoint e params do syncKey
        const parts = syncKey.replace('cache_', '').split('_');
        if (parts.length >= 1) {
          const endpoint = parts[0];
          
          // Para businesses por subcategoria
          if (endpoint === 'businesses' && parts[1] === 'subcategory') {
            const subcategoryId = parts[2];
            if (subcategoryId) {
              await this.syncBusinessesBySubcategory(subcategoryId);
            }
          }
          // Adicionar outros endpoints conforme necessário
        }
      } catch (error) {
        console.error(`[CacheService] Erro na sincronização de ${syncKey}:`, error);
      }

      // Pequena pausa entre sincronizações
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.lastSyncTime = Date.now();
    this.syncInProgress = false;
    console.log('[CacheService] Sincronização concluída');
  }

  // Sincronizar businesses por subcategoria
  async syncBusinessesBySubcategory(subcategoryId) {
    try {
      console.log(`[CacheService] Sincronizando businesses para subcategoria ${subcategoryId}`);
      
      const response = await ApiService.get(`/businesses/subcategory/${subcategoryId}`);
      
      if (response && response.data) {
        await this.setCache('businesses/subcategory', { subcategoryId }, response.data);
        console.log(`[CacheService] Sincronização concluída para subcategoria ${subcategoryId}`);
      }
    } catch (error) {
      console.error(`[CacheService] Erro na sincronização da subcategoria ${subcategoryId}:`, error);
    }
  }

  // Iniciar sincronização automática
  startBackgroundSync() {
    // Sincronização inicial após 30 segundos
    setTimeout(() => {
      this.performBackgroundSync();
    }, 30000);

    // Sincronização periódica
    setInterval(() => {
      this.performBackgroundSync();
    }, this.syncInterval);

    console.log('[CacheService] Sincronização automática iniciada');
  }

  // Verificar se precisa sincronizar
  shouldSync() {
    if (!this.lastSyncTime) return true;
    return (Date.now() - this.lastSyncTime) > this.syncInterval;
  }

  // Forçar sincronização imediata
  async forceSync() {
    console.log('[CacheService] Sincronização forçada iniciada');
    await this.performBackgroundSync();
  }
}

// Instância singleton
const cacheService = new CacheService();

export { cacheService as CacheService };
export default cacheService;