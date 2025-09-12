import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import businessApiService from './BusinessApiService';
import authService from './AuthService';
import { API_CONFIG, CACHE_CONFIG, SYNC_CONFIG } from '../config/api';

class SyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.pendingOperations = [];
    this.lastSyncTime = null;
    
    // Configurar listener de conectividade
    this.setupNetworkListener();
  }

  // Configurar listener de conectividade
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        wasOffline
      });
      
      // Se voltou online e havia operações pendentes, sincronizar
      if (this.isOnline && wasOffline && this.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    });
  }

  // Verificar status da rede
  async checkNetworkStatus() {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected;
      return this.isOnline;
    } catch (error) {
      console.error('Erro ao verificar status da rede:', error);
      return false;
    }
  }

  // Adicionar operação pendente
  async addPendingOperation(operation) {
    try {
      const operations = await this.getPendingOperations();
      operations.push({
        ...operation,
        timestamp: Date.now(),
        id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      
      await AsyncStorage.setItem(
        CACHE_CONFIG.PENDING_OPERATIONS_KEY,
        JSON.stringify(operations)
      );
      
      this.pendingOperations = operations;
      console.log('Operação adicionada à fila:', operation.type);
    } catch (error) {
      console.error('Erro ao adicionar operação pendente:', error);
    }
  }

  // Obter operações pendentes
  async getPendingOperations() {
    try {
      const stored = await AsyncStorage.getItem(CACHE_CONFIG.PENDING_OPERATIONS_KEY);
      const operations = stored ? JSON.parse(stored) : [];
      this.pendingOperations = operations;
      return operations;
    } catch (error) {
      console.error('Erro ao obter operações pendentes:', error);
      return [];
    }
  }

  // Remover operação pendente
  async removePendingOperation(operationId) {
    try {
      const operations = await this.getPendingOperations();
      const filteredOperations = operations.filter(op => op.id !== operationId);
      
      await AsyncStorage.setItem(
        CACHE_CONFIG.PENDING_OPERATIONS_KEY,
        JSON.stringify(filteredOperations)
      );
      
      this.pendingOperations = filteredOperations;
    } catch (error) {
      console.error('Erro ao remover operação pendente:', error);
    }
  }

  // Sincronizar operações pendentes
  async syncPendingOperations() {
    if (this.syncInProgress || !this.isOnline) {
      console.log(`Sincronização pulada - Online: ${this.isOnline}, Em progresso: ${this.syncInProgress}`);
      return;
    }

    try {
      this.syncInProgress = true;
      const operations = await this.getPendingOperations();
      
      console.log(`=== SINCRONIZAÇÃO DE OPERAÇÕES PENDENTES ===`);
      console.log(`Total de operações pendentes: ${operations.length}`);
      
      if (operations.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        return;
      }

      console.log(`Sincronizando ${operations.length} operações pendentes...`);
      
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        console.log(`Processando operação ${i + 1}/${operations.length}: ${operation.type} (ID: ${operation.id})`);
        
        try {
          const result = await this.executeOperation(operation);
          console.log(`Resultado da operação ${operation.type}:`, result);
          await this.removePendingOperation(operation.id);
          console.log(`✅ Operação ${operation.type} sincronizada com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao sincronizar operação ${operation.type}:`, error);
          
          // Se for erro de autenticação (401), tentar renovar token
          if (error.response && error.response.status === 401) {
            console.log('🔄 Tentando renovar token de autenticação...');
            try {
              await authService.refreshToken();
              console.log('✅ Token renovado com sucesso, operação mantida na fila');
              console.log(`⏳ Operação ${operation.type} mantida na fila para nova tentativa`);
            } catch (refreshError) {
              console.error('❌ Falha ao renovar token:', refreshError);
              await this.removePendingOperation(operation.id);
              console.log(`🗑️ Operação ${operation.type} removida da fila (falha na renovação do token)`);
            }
          }
          // Se for erro de permissão ou dados inválidos, remover da fila
          else if (error.response && [403, 422].includes(error.response.status)) {
            await this.removePendingOperation(operation.id);
            console.log(`🗑️ Operação ${operation.type} removida da fila (erro ${error.response.status})`);
          } else {
            console.log(`⏳ Operação ${operation.type} mantida na fila para nova tentativa`);
          }
        }
      }
      
      const remainingOperations = await this.getPendingOperations();
      console.log(`Operações restantes na fila: ${remainingOperations.length}`);
      
      // Atualizar cache após sincronização
      await this.syncDataFromServer();
      
      // Executar limpeza de dados duplicados periodicamente
      const lastCleanup = await AsyncStorage.getItem('@NegociosDoBairro:lastCleanup');
      const now = Date.now();
      const cleanupInterval = 24 * 60 * 60 * 1000; // 24 horas
      
      if (!lastCleanup || (now - parseInt(lastCleanup)) > cleanupInterval) {
        console.log('Executando limpeza automática de dados...');
        try {
          const BusinessService = require('./BusinessService').default;
          const cleanupResult = await BusinessService.cleanupDuplicateData();
          console.log('Resultado da limpeza:', cleanupResult);
          await AsyncStorage.setItem('@NegociosDoBairro:lastCleanup', now.toString());
        } catch (cleanupError) {
          console.error('Erro na limpeza automática:', cleanupError);
        }
      }
      
      console.log(`=== FIM DA SINCRONIZAÇÃO ===`);
      
    } catch (error) {
      console.error('Erro durante sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Executar operação específica
  async executeOperation(operation) {
    switch (operation.type) {
      case 'CREATE_BUSINESS':
        return await businessApiService.addBusiness(operation.data);
      
      case 'UPDATE_BUSINESS':
        return await businessApiService.updateBusiness(operation.businessId, operation.data);
      
      case 'DELETE_BUSINESS':
        return await businessApiService.deleteBusiness(operation.businessId);
      
      default:
        throw new Error(`Tipo de operação não suportado: ${operation.type}`);
    }
  }

  // Sincronizar dados do servidor
  async syncDataFromServer() {
    try {
      if (!this.isOnline) {
        console.log('Offline - usando dados em cache');
        return;
      }

      console.log('Sincronizando dados do servidor...');
      
      // Sincronizar categorias
      await businessApiService.getCategories();
      
      // Limpar cache antes de sincronizar
      console.log('🗑️ Limpando cache de negócios...');
      await businessApiService.clearCache();
      
      // Sincronizar negócios
      await businessApiService.getAllBusinesses();
      
      // Atualizar timestamp da última sincronização
      this.lastSyncTime = Date.now();
      await AsyncStorage.setItem(
        CACHE_CONFIG.LAST_SYNC_KEY,
        this.lastSyncTime.toString()
      );
      
      console.log('Sincronização concluída');
    } catch (error) {
      console.error('Erro ao sincronizar dados do servidor:', error);
      throw error;
    }
  }

  // Verificar se precisa sincronizar
  async needsSync() {
    try {
      const lastSyncStr = await AsyncStorage.getItem(CACHE_CONFIG.LAST_SYNC_KEY);
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
      const now = Date.now();
      const timeSinceLastSync = now - lastSync;
      
      return timeSinceLastSync > SYNC_CONFIG.SYNC_INTERVAL;
    } catch (error) {
      console.error('Erro ao verificar necessidade de sincronização:', error);
      return true;
    }
  }

  // Sincronização automática
  async autoSync() {
    try {
      const isOnline = await this.checkNetworkStatus();
      
      if (!isOnline) {
        console.log('Offline - sincronização automática cancelada');
        return;
      }

      const needsSync = await this.needsSync();
      
      if (needsSync) {
        await this.syncDataFromServer();
      }
      
      // Sincronizar operações pendentes
      await this.syncPendingOperations();
      
    } catch (error) {
      console.error('Erro na sincronização automática:', error);
    }
  }

  // Operação offline-first para criar negócio
  async createBusinessOfflineFirst(businessData) {
    try {
      if (this.isOnline) {
        // Se online, tentar criar diretamente
        return await businessApiService.addBusiness(businessData);
      } else {
        // Se offline, adicionar à fila de operações pendentes
        await this.addPendingOperation({
          type: 'CREATE_BUSINESS',
          data: businessData
        });
        
        // Retornar um objeto simulado para a UI
        return {
          id: `temp_${Date.now()}`,
          ...businessData,
          status: 'pending_sync'
        };
      }
    } catch (error) {
      // Se falhar online, adicionar à fila offline
      await this.addPendingOperation({
        type: 'CREATE_BUSINESS',
        data: businessData
      });
      throw error;
    }
  }

  // Operação offline-first para atualizar negócio
  async updateBusinessOfflineFirst(businessId, businessData) {
    try {
      if (this.isOnline) {
        return await businessApiService.updateBusiness(businessId, businessData);
      } else {
        await this.addPendingOperation({
          type: 'UPDATE_BUSINESS',
          businessId,
          data: businessData
        });
        
        return {
          id: businessId,
          ...businessData,
          status: 'pending_sync'
        };
      }
    } catch (error) {
      await this.addPendingOperation({
        type: 'UPDATE_BUSINESS',
        businessId,
        data: businessData
      });
      throw error;
    }
  }

  // Operação offline-first para deletar negócio
  async deleteBusinessOfflineFirst(businessId) {
    try {
      // Sempre remove dos dados locais primeiro
      const BusinessService = require('./BusinessService').default;
      
      // Tenta encontrar e remover o negócio dos dados locais
      try {
        await BusinessService.deleteBusiness(null, businessId);
        console.log(`Negócio ${businessId} removido dos dados locais`);
      } catch (localError) {
        console.log(`Negócio ${businessId} não encontrado nos dados locais:`, localError.message);
      }
      
      if (this.isOnline) {
        // Se online, tenta deletar da API também
        try {
          const result = await businessApiService.deleteBusiness(businessId);
          console.log(`Negócio ${businessId} removido da API`);
          return result;
        } catch (apiError) {
          console.log(`Erro ao remover da API, adicionando à fila de sincronização:`, apiError.message);
          await this.addPendingOperation({
            type: 'DELETE_BUSINESS',
            businessId
          });
          return { success: true, status: 'pending_sync' };
        }
      } else {
        // Se offline, apenas adiciona à fila de sincronização
        await this.addPendingOperation({
          type: 'DELETE_BUSINESS',
          businessId
        });
        
        return { success: true, status: 'pending_sync' };
      }
    } catch (error) {
      console.error('Erro na exclusão offline-first:', error);
      await this.addPendingOperation({
        type: 'DELETE_BUSINESS',
        businessId
      });
      throw error;
    }
  }

  // Limpar dados de sincronização
  async clearSyncData() {
    try {
      await AsyncStorage.multiRemove([
        CACHE_CONFIG.PENDING_OPERATIONS_KEY,
      CACHE_CONFIG.LAST_SYNC_KEY
      ]);
      
      this.pendingOperations = [];
      this.lastSyncTime = null;
      
      console.log('Dados de sincronização limpos');
    } catch (error) {
      console.error('Erro ao limpar dados de sincronização:', error);
    }
  }

  // Obter status da sincronização
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.pendingOperations.length,
      lastSyncTime: this.lastSyncTime
    };
  }
}

// Exportar instância singleton
export const syncService = new SyncService();
export default SyncService;