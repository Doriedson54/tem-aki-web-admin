// Script para limpar cache do aplicativo
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAppCache = async () => {
  try {
    console.log('Limpando cache do aplicativo...');
    
    // Limpar todas as chaves de cache
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => 
      key.includes('_cache') || 
      key.includes('@categories') || 
      key.includes('@businesses') ||
      key.includes('@pending_operations') ||
      key.includes('@last_sync')
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cache limpo! Removidas ${cacheKeys.length} entradas.`);
    } else {
      console.log('Nenhuma entrada de cache encontrada.');
    }
    
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
};

// Executar limpeza
clearAppCache();