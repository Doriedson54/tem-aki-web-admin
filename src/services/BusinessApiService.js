import apiService from './ApiService';
import { API_ENDPOINTS, CACHE_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheService } from './CacheService';

// Classe personalizada para erros da API
class ApiError extends Error {
  constructor(message, status, code, originalError) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.originalError = originalError;
  }
}

// Usar configurações centralizadas
const CACHE_KEYS = {
  CATEGORIES: CACHE_CONFIG.CATEGORIES_KEY,
  BUSINESSES: CACHE_CONFIG.BUSINESSES_KEY,
  LAST_SYNC: CACHE_CONFIG.LAST_SYNC_KEY,
};

// Usar TTL da configuração
const CACHE_TTL = CACHE_CONFIG.TTL;

class BusinessApiService {
  constructor() {
    this.apiService = apiService;
  }

  // ============ MÉTODOS DE CACHE ============

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log(`Cache hit para ${key}`);
          return data;
        } else {
          console.log(`Cache expirado para ${key}`);
          // Remove cache expirado
          await AsyncStorage.removeItem(key);
        }
      }
      return null;
    } catch (error) {
      console.error(`Erro ao obter dados do cache para ${key}:`, error);
      // Tenta limpar cache corrompido
      try {
        await AsyncStorage.removeItem(key);
      } catch (clearError) {
        console.error(`Erro ao limpar cache corrompido para ${key}:`, clearError);
      }
      return null;
    }
  }

  async setCachedData(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`Dados salvos no cache para ${key}`);
    } catch (error) {
      console.error(`Erro ao salvar dados no cache para ${key}:`, error);
      // Se o erro for de espaço insuficiente, tenta limpar cache antigo
      if (error.message && error.message.includes('quota')) {
        console.log('Tentando limpar cache antigo devido a quota excedida');
        await this.clearOldCache();
        // Tenta salvar novamente
        try {
          await AsyncStorage.setItem(key, JSON.stringify(cacheData));
          console.log(`Dados salvos no cache para ${key} após limpeza`);
        } catch (retryError) {
          console.error(`Erro ao salvar no cache após limpeza para ${key}:`, retryError);
        }
      }
    }
  }

  async clearCache() {
    try {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
      console.log('Cache limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      throw new ApiError('Erro ao limpar cache', null, 'CACHE_CLEAR_ERROR', error);
    }
  }

  async clearOldCache() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        key.includes('_cache') || 
        key.includes('@categories') || 
        key.includes('@businesses')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Removidas ${cacheKeys.length} entradas de cache antigas`);
      }
    } catch (error) {
      console.error('Erro ao limpar cache antigo:', error);
    }
  }

  async getCacheInfo() {
    try {
      const info = {};
      for (const [name, key] of Object.entries(CACHE_KEYS)) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          info[name] = {
            exists: true,
            age: Date.now() - timestamp,
            expired: Date.now() - timestamp > CACHE_TTL
          };
        } else {
          info[name] = { exists: false };
        }
      }
      return info;
    } catch (error) {
      console.error('Erro ao obter informações do cache:', error);
      return {};
    }
  }

  // ============ MÉTODOS DE CATEGORIAS ============

  async getCategories() {
    try {
      console.log('Buscando categorias...');
      
      // Tenta obter do cache primeiro
      const cached = await this.getCachedData(CACHE_KEYS.CATEGORIES);
      if (cached) {
        console.log(`Retornando ${cached.length} categorias do cache`);
        return cached;
      }

      // Se não há cache, busca da API com retry
      console.log('Cache não encontrado, buscando da API...');
      const response = await this.apiService.requestWithRetry(API_ENDPOINTS.CATEGORIES.LIST, { method: 'GET' });
      const categories = response.data || response;

      if (!Array.isArray(categories)) {
        throw new ApiError('Formato de resposta inválido para categorias', response.status, 'INVALID_RESPONSE');
      }

      // Salva no cache
      await this.setCachedData(CACHE_KEYS.CATEGORIES, categories);
      console.log(`${categories.length} categorias obtidas da API e salvas no cache`);

      return categories;
    } catch (error) {
      console.error('Erro ao obter categorias:', error);
      
      // Tenta obter dados expirados do cache como fallback
      try {
        const expiredCache = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
        if (expiredCache) {
          const { data } = JSON.parse(expiredCache);
          console.log('Usando dados expirados do cache como fallback');
          return data;
        }
      } catch (cacheError) {
        console.error('Erro ao acessar cache expirado:', cacheError);
      }
      
      // Fallback final para dados locais
      console.log('Usando categorias de fallback');
      const fallbackCategories = this.getFallbackCategories();
      
      // Lança erro personalizado mantendo os dados de fallback
      const apiError = new ApiError(
        'Erro ao carregar categorias. Usando dados locais.',
        error.response?.status,
        'CATEGORIES_FETCH_ERROR',
        error
      );
      apiError.fallbackData = fallbackCategories;
      throw apiError;
    }
  }

  getFallbackCategories() {
    return [
      { id: '1', name: 'Restaurantes', icon: '🍽️' },
      { id: '2', name: 'Mercados', icon: '🛒' },
      { id: '3', name: 'Farmácias', icon: '💊' },
      { id: '4', name: 'Serviços', icon: '🔧' },
      { id: '5', name: 'Lazer', icon: '🎮' },
      { id: '6', name: 'Saúde', icon: '🏥' },
      { id: '7', name: 'Educação', icon: '📚' },
      { id: '8', name: 'Beleza', icon: '💇' },
    ];
  }

  // ============ MÉTODOS DE NEGÓCIOS ============

  async getCachedBusinesses() {
    try {
      const cached = await this.getCachedData(CACHE_KEYS.BUSINESSES);
      if (cached) {
        // Se os dados estão organizados por categoria, converte para array plano
        if (typeof cached === 'object' && !Array.isArray(cached)) {
          const allBusinesses = [];
          if (cached) {
            Object.values(cached).forEach(categoryBusinesses => {
              if (Array.isArray(categoryBusinesses)) {
                allBusinesses.push(...categoryBusinesses);
              }
            });
          }
          return allBusinesses;
        }
        return cached;
      }
      return [];
    } catch (error) {
      console.error('Erro ao obter negócios do cache:', error);
      return [];
    }
  }

  async getAllBusinesses() {
    try {
      // Tenta obter do cache primeiro
      const cached = await this.getCachedData(CACHE_KEYS.BUSINESSES);
      if (cached) {
        // Se os dados estão organizados por categoria, converte para array plano
        if (typeof cached === 'object' && !Array.isArray(cached)) {
          const allBusinesses = [];
          if (cached) {
            Object.values(cached).forEach(categoryBusinesses => {
              if (Array.isArray(categoryBusinesses)) {
                allBusinesses.push(...categoryBusinesses);
              }
            });
          }
          return allBusinesses;
        }
        return cached;
      }

      // Se não há cache, busca da API com retry
      console.log('🔄 Fazendo requisição para API:', API_ENDPOINTS.BUSINESSES.LIST);
      const response = await this.apiService.requestWithRetry(API_ENDPOINTS.BUSINESSES.LIST, { method: 'GET' });
      console.log('📡 Resposta da API recebida:', response);
      
      const businesses = response.data || response;
      console.log('📊 Negócios extraídos da resposta:', businesses?.length || 0, 'itens');

      // Organiza os negócios por categoria
      const businessesByCategory = this.organizeBusinessesByCategory(businesses);
      console.log('🗂️ Negócios organizados por categoria:', Object.keys(businessesByCategory).length, 'categorias');

      // Salva no cache
      await this.setCachedData(CACHE_KEYS.BUSINESSES, businessesByCategory);
      console.log('💾 Cache atualizado com sucesso');

      // Retorna array plano para getAllBusinesses
      return businesses;
    } catch (error) {
      console.error('Erro ao obter negócios:', error);
      
      // Fallback para dados locais em caso de erro
      return this.getFallbackBusinesses();
    }
  }

  async getBusinessesByCategory(categoryId) {
    try {
      // Primeiro tenta obter do cache
      const cached = await this.getCachedData(CACHE_KEYS.BUSINESSES);
      if (cached) {
        // Se os dados estão organizados por categoria
        if (typeof cached === 'object' && !Array.isArray(cached)) {
          return cached[categoryId] || [];
        }
        // Se é um array plano, filtra por categoria
        if (Array.isArray(cached)) {
          return cached.filter(business => business.category_id === categoryId);
        }
      }

      // Se não há cache, busca da API com retry
      const response = await this.apiService.requestWithRetry(
        API_ENDPOINTS.BUSINESSES.BY_CATEGORY(categoryId), { method: 'GET' }
      );
      const businesses = response.data || response;
      
      // Atualiza o cache com os novos dados
      if (businesses && businesses.length > 0) {
        const allCached = await this.getCachedData(CACHE_KEYS.BUSINESSES) || {};
        allCached[categoryId] = businesses;
        await this.setCachedData(CACHE_KEYS.BUSINESSES, allCached);
      }
      
      return businesses;
    } catch (error) {
      console.error('Erro ao obter negócios por categoria:', error);
      
      // Fallback para cache local
      const allBusinesses = await this.getAllBusinesses();
      return allBusinesses[categoryId] || [];
    }
  }

  async getBusinessesBySubcategory(subcategory) {
    const cacheKey = `${CACHE_KEYS.BUSINESSES}_subcategory_${subcategory}`;
    
    try {
      // 1. Verificar cache inteligente primeiro
      const cacheResult = await CacheService.getCache('businesses/subcategory', { subcategory });
      
      if (cacheResult && cacheResult.data && Array.isArray(cacheResult.data) && cacheResult.data.length > 0) {
        console.log(`Dados encontrados no cache inteligente para subcategoria ${subcategory}: ${cacheResult.data.length} negócios (stale: ${cacheResult.isStale})`);
        
        // Se os dados estão stale, adicionar à fila de sincronização
        if (cacheResult.isStale) {
          CacheService.addToSyncQueue('businesses/subcategory', { subcategory });
        }
        
        return cacheResult.data;
      }
      
      // 2. Fallback para cache legado
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        console.log(`Dados em cache legado encontrados para subcategoria ${subcategory}: ${cachedData.length} negócios`);
      }
      
      // 3. Tenta buscar dados atualizados da API
      let apiError = null;
      try {
        console.log(`Buscando dados da API para subcategoria: ${subcategory}`);
        const response = await this.apiService.requestWithRetry(
          API_ENDPOINTS.BUSINESSES.BY_SUBCATEGORY(subcategory), 
          { method: 'GET' }
        );
        
        const apiData = response.data || response || [];
        console.log(`API retornou ${apiData.length} negócios para subcategoria ${subcategory}`);
        
        // Salva no cache inteligente e legado se obteve dados válidos
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          await Promise.all([
            CacheService.setCache('businesses/subcategory', { subcategory }, apiData),
            this.setCachedData(cacheKey, apiData)
          ]);
          console.log('Dados salvos nos caches inteligente e legado');
          return apiData;
        }
      } catch (error) {
        apiError = error;
        console.log('Erro na API, tentando fallbacks...', error.message);
      }
      
      // 4. Se API não retornou dados válidos, usa cache legado se disponível
      if (cachedData && Array.isArray(cachedData)) {
        console.log(`Usando dados em cache legado para subcategoria ${subcategory}`);
        return cachedData;
      }
      
      return [];
    } catch (error) {
      console.error(`Erro ao obter negócios por subcategoria ${subcategory}:`, error);
      
      // Fallback: tenta usar dados em cache legado
      try {
        const cachedData = await this.getCachedData(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          console.log(`Fallback: usando dados em cache legado para subcategoria ${subcategory} (${cachedData.length} negócios)`);
          return cachedData;
        }
      } catch (cacheError) {
        console.error('Erro ao acessar cache no fallback:', cacheError);
      }
      
      // Último fallback: busca em todos os negócios em cache
      try {
        const allBusinesses = await this.getAllBusinesses();
        if (allBusinesses && typeof allBusinesses === 'object') {
          // Busca em todas as categorias
          const matchingBusinesses = [];
          Object.values(allBusinesses).forEach(categoryBusinesses => {
            if (Array.isArray(categoryBusinesses)) {
              const filtered = categoryBusinesses.filter(business => 
                business.subcategory === subcategory ||
                business.subCategory === subcategory ||
                business.sub_category === subcategory
              );
              matchingBusinesses.push(...filtered);
            }
          });
          
          if (matchingBusinesses.length > 0) {
            console.log(`Fallback final: encontrados ${matchingBusinesses.length} negócios para subcategoria ${subcategory}`);
            return matchingBusinesses;
          }
        }
      } catch (fallbackError) {
        console.error('Erro no fallback final:', fallbackError);
      }
      
      console.log(`Nenhum dado encontrado para subcategoria ${subcategory}`);
      return [];
    }
  }

  async searchBusinesses(query) {
    try {
      const queryString = new URLSearchParams({ q: query }).toString();
      const url = `${API_ENDPOINTS.BUSINESSES.SEARCH}?${queryString}`;
      const response = await this.apiService.requestWithRetry(url, { method: 'GET' });
      return response.data || response;
    } catch (error) {
      console.error('Erro ao buscar negócios:', error);
      return [];
    }
  }

  async addBusiness(businessData) {
    try {
      // Converte os dados do negócio para o formato esperado pela API
      const apiBusinessData = await this.convertBusinessDataForApi(businessData);
      
      const response = await this.apiService.requestWithRetry(
        API_ENDPOINTS.BUSINESSES.CREATE,
        { method: 'POST', body: JSON.stringify(apiBusinessData) }
      );
      
      const newBusiness = response.data || response;
      
      // Atualiza o cache em vez de apenas limpar
      try {
        // Obtém o cache atual
        const cached = await this.getCachedData(CACHE_KEYS.BUSINESSES) || {};
        
        // Se o cache está organizado por categoria
        if (typeof cached === 'object' && !Array.isArray(cached)) {
          const categoryId = newBusiness.category_id;
          if (!cached[categoryId]) {
            cached[categoryId] = [];
          }
          cached[categoryId].push(newBusiness);
        } else {
          // Se é um array plano, adiciona o negócio
          if (Array.isArray(cached)) {
            cached.push(newBusiness);
          } else {
            // Se não há cache, cria um novo
            const categoryId = newBusiness.category_id;
            cached[categoryId] = [newBusiness];
          }
        }
        
        // Salva o cache atualizado
        await this.setCachedData(CACHE_KEYS.BUSINESSES, cached);
        console.log('Cache atualizado com novo negócio');
      } catch (cacheError) {
        console.error('Erro ao atualizar cache:', cacheError);
        // Se falhar ao atualizar cache, limpa para forçar reload
        await this.clearCache();
      }
      
      return newBusiness;
    } catch (error) {
      console.error('Erro ao adicionar negócio:', error);
      throw error;
    }
  }

  // Método para converter dados do negócio para o formato da API
  async convertBusinessDataForApi(businessData) {
    const convertedData = { ...businessData };
    
    try {
      // Converte campos do app (camelCase) para o formato do backend (snake_case)
      if (typeof businessData.mainProduct === 'string' && !convertedData.main_product) {
        convertedData.main_product = businessData.mainProduct;
        delete convertedData.mainProduct;
      }

      if (typeof businessData.hasDelivery !== 'undefined' && typeof convertedData.delivery === 'undefined') {
        convertedData.delivery = Boolean(businessData.hasDelivery);
        delete convertedData.hasDelivery;
      }

      if (typeof businessData.has_delivery !== 'undefined' && typeof convertedData.delivery === 'undefined') {
        convertedData.delivery = Boolean(businessData.has_delivery);
        delete convertedData.has_delivery;
      }

      // Obtém as categorias para fazer a conversão
      const categories = await this.getCategories();
      
      // Converte category (string) para category_id (UUID)
      if (businessData.category && typeof businessData.category === 'string') {
        const category = categories.find(cat => 
          cat.name.toLowerCase() === businessData.category.toLowerCase()
        );
        if (category) {
          convertedData.category_id = category.id;
        } else {
          console.warn(`Categoria '${businessData.category}' não encontrada`);
        }
        // Sempre remove o campo category após tentar a conversão
        delete convertedData.category;
      }
      
      // Converte subcategory (string) para subcategory_id (UUID)
      if (businessData.subcategory && typeof businessData.subcategory === 'string') {
        // Para subcategorias, precisaríamos de um endpoint específico ou incluir na resposta de categorias
        // Por enquanto, vamos remover o campo subcategory se não for um UUID
        if (!businessData.subcategory.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          delete convertedData.subcategory;
        } else {
          convertedData.subcategory_id = businessData.subcategory;
          delete convertedData.subcategory;
        }
      }
      
      // Converte operatingHours para opening_hours (formato JSONB)
      if (businessData.operatingHours) {
        convertedData.opening_hours = businessData.operatingHours;
        delete convertedData.operatingHours;
      }
      
      // Converte zipCode para zip_code
      if (businessData.zipCode) {
        convertedData.zip_code = businessData.zipCode;
        delete convertedData.zipCode;
      }
      
      // Converte socialMedia para campos individuais
      if (businessData.socialMedia) {
        if (businessData.socialMedia.whatsapp) {
          convertedData.whatsapp = businessData.socialMedia.whatsapp;
        }
        if (businessData.socialMedia.instagram) {
          convertedData.instagram = businessData.socialMedia.instagram;
        }
        if (businessData.socialMedia.facebook) {
          convertedData.facebook = businessData.socialMedia.facebook;
        }
        delete convertedData.socialMedia;
      }
      
      // Define status padrão se não especificado
      if (!convertedData.status) {
        convertedData.status = 'pending';
      }
      
      // Converte city_state para city e state separados ANTES da validação
      if (convertedData.city_state) {
        const cityStateParts = convertedData.city_state.split('/');
        if (cityStateParts.length === 2) {
          convertedData.city = cityStateParts[0].trim();
          convertedData.state = cityStateParts[1].trim();
        }
        delete convertedData.city_state;
      }
      
      // Converte working_hours para opening_hours se necessário
      if (convertedData.working_hours && !convertedData.opening_hours) {
        convertedData.opening_hours = convertedData.working_hours;
        delete convertedData.working_hours;
      }
      
      // Remove campos que não existem na tabela
      delete convertedData.isActive;
      delete convertedData.category; // Garantir que category seja removido
      delete convertedData.subcategory; // Garantir que subcategory seja removido
      
      console.log('Dados convertidos para API:', convertedData);
      
      // Verificação final para garantir que não há campos inválidos
      const validFields = [
        'id', 'name', 'description', 'category_id', 'subcategory_id', 'phone', 'whatsapp',
        'email', 'website', 'instagram', 'facebook', 'address', 'neighborhood', 'city',
        'state', 'zip_code', 'latitude', 'longitude', 'opening_hours', 'delivery',
        'takeout', 'dine_in', 'image_url', 'logo_url', 'status', 'featured', 'views',
        'created_at', 'updated_at', 'main_product'
      ];
      
      // Remove campos que não estão na lista de campos válidos
      Object.keys(convertedData).forEach(key => {
        if (!validFields.includes(key)) {
          console.warn(`Removendo campo inválido: ${key}`);
          delete convertedData[key];
        }
      });
      
      console.log('Dados finais para API:', convertedData);
      return convertedData;
      
    } catch (error) {
      console.error('Erro ao converter dados para API:', error);
      // Em caso de erro, retorna os dados originais
      return businessData;
    }
  }

  async updateBusiness(businessId, businessData) {
    try {
      const apiBusinessData = await this.convertBusinessDataForApi(businessData);
      const response = await this.apiService.requestWithRetry(
        API_ENDPOINTS.BUSINESSES.UPDATE(businessId),
        { method: 'PUT', body: JSON.stringify(apiBusinessData) }
      );
      
      // Limpa o cache para forçar atualização
      await this.clearCache();
      
      return response.data || response;
    } catch (error) {
      console.error('Erro ao atualizar negócio:', error);
      throw error;
    }
  }

  async deleteBusiness(businessId) {
    try {
      const response = await this.apiService.requestWithRetry(
        API_ENDPOINTS.BUSINESSES.DELETE(businessId),
        { method: 'DELETE' }
      );
      
      // Limpa o cache para forçar atualização
      await this.clearCache();
      
      return response.data || response;
    } catch (error) {
      console.error('Erro ao deletar negócio:', error);
      throw error;
    }
  }

  async uploadBusinessImage(businessId, imageFile) {
    try {
      const response = await this.apiService.uploadFile(
        API_ENDPOINTS.UPLOAD.IMAGE,
        imageFile,
        { businessId }
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  organizeBusinessesByCategory(businesses) {
    const organized = {};
    
    // Mapeamento de categorias para IDs
    const categoryToId = {
      'Alimentação e Bebidas': '1',
      'Serviços': '2', 
      'Comércio': '3',
      'Saúde': '4',
      'Educação': '5',
      'Instituições Religiosas': '6',
      'Instituições Públicas': '7'
    };
    
    if (businesses && Array.isArray(businesses)) {
      businesses.forEach(business => {
        // Tenta obter o ID da categoria de diferentes formas
        let categoryId = business.category_id || business.categoryId;
        
        // Se não tem ID, tenta mapear pelo nome da categoria
        if (!categoryId && business.category) {
          categoryId = categoryToId[business.category] || business.category;
        }
        
        if (categoryId) {
          if (!organized[categoryId]) {
            organized[categoryId] = [];
          }
          organized[categoryId].push(business);
        }
      });
    }
    
    return organized;
  }

  getFallbackBusinesses() {
    const fallbackData = {
      '1': [ // Restaurantes
        { id: '101', name: 'Restaurante do João', address: 'Rua das Flores, 123', phone: '(11) 1234-5678' },
        { id: '102', name: 'Pizzaria Bella', address: 'Av. Principal, 456', phone: '(11) 8765-4321' },
      ],
      '2': [ // Mercados
        { id: '201', name: 'Mercado Bom Preço', address: 'Av. Comercial, 100', phone: '(11) 3456-7890' },
        { id: '202', name: 'Supermercado Economia', address: 'Rua do Comércio, 200', phone: '(11) 7890-1234' },
      ],
      '3': [ // Farmácias
        { id: '301', name: 'Farmácia Saúde', address: 'Av. da Saúde, 300', phone: '(11) 4567-8901' },
        { id: '302', name: 'Drogaria Bem Estar', address: 'Rua do Bem Estar, 400', phone: '(11) 8901-2345' },
      ],
    };
    
    // Converte para array plano
    const allBusinesses = [];
    if (fallbackData && typeof fallbackData === 'object') {
      Object.values(fallbackData).forEach(categoryBusinesses => {
        if (Array.isArray(categoryBusinesses)) {
          allBusinesses.push(...categoryBusinesses);
        }
      });
    }
    
    return allBusinesses;
  }

  // ============ MÉTODOS DE SINCRONIZAÇÃO ============

  async syncData() {
    try {
      console.log('Iniciando sincronização de dados...');
      
      // Sincroniza categorias
      await this.getCategories();
      
      // Sincroniza negócios
      await this.getAllBusinesses();
      
      // Atualiza timestamp da última sincronização
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
      
      console.log('Sincronização concluída com sucesso');
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  }

  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return lastSync ? parseInt(lastSync) : null;
    } catch (error) {
      console.error('Erro ao obter última sincronização:', error);
      return null;
    }
  }

  async isOnline() {
    return await this.apiService.checkConnectivity();
  }

  // Método para limpar todo o cache

}

// Instância singleton
const businessApiService = new BusinessApiService();

export default businessApiService;
export { BusinessApiService };
