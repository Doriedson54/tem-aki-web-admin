// Script de debug para verificar dados do AsyncStorage
const AsyncStorage = require('@react-native-async-storage/async-storage');

const BUSINESSES_STORAGE_KEY = '@NegociosDoBairro:businesses';

async function debugStorage() {
  try {
    console.log('=== DEBUG STORAGE ===');
    
    // Verificar se há dados no AsyncStorage
    const rawData = await AsyncStorage.getItem(BUSINESSES_STORAGE_KEY);
    console.log('Raw data from AsyncStorage:', rawData ? 'Data exists' : 'No data found');
    
    if (rawData) {
      const parsedData = JSON.parse(rawData);
      console.log('Categories found:', Object.keys(parsedData));
      
      // Verificar cada categoria
      for (const categoryId in parsedData) {
        const businesses = parsedData[categoryId];
        console.log(`Category ${categoryId}:`, businesses.length, 'businesses');
        
        // Mostrar IDs dos negócios
        const businessIds = businesses.map(b => b.id);
        console.log(`Business IDs in category ${categoryId}:`, businessIds);
      }
    } else {
      console.log('No data in AsyncStorage - initializing...');
      
      // Dados iniciais
      const initialBusinesses = {
        '1': [ // Restaurantes
          { id: '101', name: 'Restaurante do João', address: 'Rua das Flores, 123', phone: '(11) 1234-5678' },
          { id: '102', name: 'Pizzaria Bella', address: 'Av. Principal, 456', phone: '(11) 8765-4321' },
        ],
        '2': [ // Mercados
          { id: '201', name: 'Mercado Bom Preço', address: 'Av. Comercial, 100', phone: '(11) 3456-7890' },
        ]
      };
      
      await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(initialBusinesses));
      console.log('Initial data saved to AsyncStorage');
    }
    
  } catch (error) {
    console.error('Error in debug storage:', error);
  }
}

// Função para buscar um negócio específico
async function findSpecificBusiness(businessId) {
  try {
    console.log('=== SEARCHING FOR BUSINESS ===');
    console.log('Looking for business ID:', businessId);
    
    const rawData = await AsyncStorage.getItem(BUSINESSES_STORAGE_KEY);
    if (!rawData) {
      console.log('No data in storage');
      return null;
    }
    
    const businesses = JSON.parse(rawData);
    
    for (const categoryId in businesses) {
      const business = businesses[categoryId].find(b => b.id === businessId);
      if (business) {
        console.log('Business found in category:', categoryId);
        console.log('Business data:', business);
        return { business, categoryId };
      }
    }
    
    console.log('Business not found');
    return null;
    
  } catch (error) {
    console.error('Error searching for business:', error);
    return null;
  }
}

module.exports = { debugStorage, findSpecificBusiness };