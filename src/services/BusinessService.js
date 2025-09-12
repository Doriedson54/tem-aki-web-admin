import AsyncStorage from '@react-native-async-storage/async-storage';

// Chave para armazenar os negócios no AsyncStorage
const BUSINESSES_STORAGE_KEY = '@NegociosDoBairro:businesses';

// Dados iniciais de exemplo para as categorias
const initialCategories = [
  { id: '1', name: 'Restaurantes', icon: '🍽️' },
  { id: '2', name: 'Mercados', icon: '🛒' },
  { id: '3', name: 'Farmácias', icon: '💊' },
  { id: '4', name: 'Serviços', icon: '🔧' },
  { id: '5', name: 'Lazer', icon: '🎮' },
  { id: '6', name: 'Saúde', icon: '🏥' },
  { id: '7', name: 'Educação', icon: '📚' },
  { id: '8', name: 'Beleza', icon: '💇' },
];

// Mapeamento de nomes de categorias para IDs
const categoryNameToId = {
  'Alimentação e Bebidas': '1',
  'Serviços': '2',
  'Comércio': '3',
  'Saúde': '4',
  'Educação': '5',
  'Instituições Religiosas': '6',
  'Instituições Públicas': '7',
  'Restaurantes': '1', // Alias para Alimentação e Bebidas
  'Mercados': '2', // Alias para Serviços
  'Farmácias': '3', // Alias para Comércio
  'Lazer': '5', // Alias para Educação
  'Beleza': '9'
};

// Função para obter ID da categoria pelo nome
const getCategoryIdByName = (categoryName) => {
  return categoryNameToId[categoryName] || null;
};

// Dados iniciais de exemplo para os negócios
const initialBusinesses = {
  '1': [ // Restaurantes
    { id: '101', name: 'Restaurante do João', address: 'Rua das Flores, 123', neighborhood: 'Centro', cityState: 'São Paulo, SP', zipCode: '01234-567', phone: '(11) 1234-5678' },
    { id: '102', name: 'Pizzaria Bella', address: 'Av. Principal, 456', neighborhood: 'Vila Nova', cityState: 'São Paulo, SP', zipCode: '02345-678', phone: '(11) 8765-4321' },
    { id: '103', name: 'Lanchonete Sabor', address: 'Rua dos Sabores, 789', neighborhood: 'Jardim das Flores', cityState: 'São Paulo, SP', phone: '(11) 2345-6789' },
  ],
  '2': [ // Mercados
    { id: '201', name: 'Mercado Bom Preço', address: 'Av. Comercial, 100', neighborhood: 'Vila Comercial', cityState: 'São Paulo, SP', zipCode: '03456-789', phone: '(11) 3456-7890' },
    { id: '202', name: 'Supermercado Economia', address: 'Rua do Comércio, 200', neighborhood: 'Bairro Novo', cityState: 'São Paulo, SP', phone: '(11) 7890-1234' },
  ],
  '3': [ // Farmácias
    { id: '301', name: 'Farmácia Saúde', address: 'Av. da Saúde, 300', neighborhood: 'Centro', cityState: 'São Paulo, SP', zipCode: '04567-890', phone: '(11) 4567-8901' },
    { id: '302', name: 'Drogaria Bem Estar', address: 'Rua do Bem Estar, 400', neighborhood: 'Vila Saúde', cityState: 'São Paulo, SP', phone: '(11) 8901-2345' },
  ],
  '4': [ // Serviços
    { id: '401', name: 'Eletricista 24h', address: 'Rua dos Serviços, 500', phone: '(11) 5678-9012' },
    { id: '402', name: 'Encanador Express', address: 'Av. dos Profissionais, 600', phone: '(11) 9012-3456' },
  ],
  '5': [ // Lazer
    { id: '501', name: 'Cinema Estrela', address: 'Shopping Center, Loja 10', phone: '(11) 6789-0123' },
    { id: '502', name: 'Parque de Diversões', address: 'Av. do Lazer, 700', phone: '(11) 0123-4567' },
  ],
  '6': [ // Saúde
    { id: '601', name: 'Clínica Médica Vida', address: 'Rua da Saúde, 800', phone: '(11) 7890-1234' },
    { id: '602', name: 'Consultório Odontológico Sorriso', address: 'Av. dos Dentes, 900', phone: '(11) 2345-6789' },
  ],
  '7': [ // Instituições Públicas
    { id: '701', name: 'Prefeitura Municipal', address: 'Praça Central, 1', neighborhood: 'Centro', cityState: 'São Paulo, SP', phone: '(11) 3333-1000' },
    { id: '702', name: 'Cartório de Registro Civil', address: 'Rua dos Documentos, 50', neighborhood: 'Centro', cityState: 'São Paulo, SP', phone: '(11) 3333-2000' },
    { id: '703', name: 'Posto de Saúde Central', address: 'Av. da Saúde, 200', neighborhood: 'Vila Saúde', cityState: 'São Paulo, SP', phone: '(11) 3333-3000' },
    { id: '704', name: 'Correios Central', address: 'Rua das Cartas, 100', neighborhood: 'Centro', cityState: 'São Paulo, SP', phone: '(11) 3333-4000' },
  ],
  '8': [ // Educação
    { id: '801', name: 'Escola Futuro', address: 'Rua do Conhecimento, 1000', neighborhood: 'Vila Educação', cityState: 'São Paulo, SP', phone: '(11) 8901-2345' },
    { id: '802', name: 'Curso de Idiomas Global', address: 'Av. das Línguas, 1100', neighborhood: 'Centro', cityState: 'São Paulo, SP', phone: '(11) 3456-7890' },
  ],
  '9': [ // Beleza
    { id: '901', name: 'Salão de Beleza Glamour', address: 'Rua da Beleza, 1200', neighborhood: 'Vila Beleza', cityState: 'São Paulo, SP', phone: '(11) 9012-3456' },
    { id: '902', name: 'Barbearia Estilo', address: 'Av. do Estilo, 1300', neighborhood: 'Centro', cityState: 'São Paulo, SP', phone: '(11) 4567-8901' },
  ],
};

// Inicializa o armazenamento com dados de exemplo se estiver vazio
const initializeStorage = async () => {
  try {
    const existingData = await AsyncStorage.getItem(BUSINESSES_STORAGE_KEY);
    if (!existingData) {
      await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(initialBusinesses));
    }
  } catch (error) {
    console.error('Erro ao inicializar o armazenamento:', error);
  }
};

// Obtém todas as categorias
const getCategories = () => {
  return initialCategories;
};

// Obtém todos os negócios
const getAllBusinesses = async () => {
  try {
    const businesses = await AsyncStorage.getItem(BUSINESSES_STORAGE_KEY);
    const parsedBusinesses = businesses ? JSON.parse(businesses) : {};
    return parsedBusinesses;
  } catch (error) {
    console.error('Erro ao buscar negócios:', error);
    return {};
  }
};

// Obtém negócios por categoria
const getBusinessesByCategory = async (categoryId) => {
  try {
    const businesses = await getAllBusinesses();
    return businesses[categoryId] || [];
  } catch (error) {
    console.error('Erro ao obter negócios por categoria:', error);
    return [];
  }
};

// Adiciona um novo negócio
const addBusiness = async (categoryId, business) => {
  try {
    const businesses = await getAllBusinesses();
    
    // Gera um ID único para o novo negócio
    const newId = Date.now().toString();
    const newBusiness = { id: newId, ...business };
    
    // Adiciona o negócio à categoria
    if (!businesses[categoryId]) {
      businesses[categoryId] = [];
    }
    
    businesses[categoryId].push(newBusiness);
    
    // Salva os negócios atualizados
    await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
    
    return newBusiness;
  } catch (error) {
    console.error('Erro ao adicionar negócio:', error);
    throw error;
  }
};

// Atualiza um negócio existente
// Encontra a categoria de um negócio pelo ID
const findBusinessCategory = async (businessId) => {
  try {
    const businesses = await getAllBusinesses();
    
    for (const categoryId in businesses) {
      const business = businesses[categoryId].find(b => b.id === businessId);
      if (business) {
        return categoryId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao encontrar categoria do negócio:', error);
    return null;
  }
};

// Função auxiliar para buscar negócio por ID em todas as categorias
const findBusinessById = async (businessId) => {
  try {
    const businesses = await getAllBusinesses();
    
    for (const categoryId in businesses) {
      const categoryBusinesses = businesses[categoryId];
      
      if (categoryBusinesses && Array.isArray(categoryBusinesses)) {
        for (const business of categoryBusinesses) {
          // Comparação tanto como string quanto como número
          if (business.id === businessId || business.id === String(businessId) || String(business.id) === String(businessId)) {
            return { business, categoryId };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar negócio por ID:', error);
    return null;
  }
};

// Função para garantir que os dados iniciais estejam no AsyncStorage
const ensureInitialData = async () => {
  try {
    const businesses = await AsyncStorage.getItem(BUSINESSES_STORAGE_KEY);
    if (!businesses) {
      await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(initialBusinesses));
    }
  } catch (error) {
    console.error('Error ensuring initial data:', error);
  }
};

// Função para limpar e reinicializar todos os dados (útil quando há problemas de corrupção)
const clearAndResetData = async () => {
  try {
    // Remove todos os dados relacionados ao app
    await AsyncStorage.removeItem(BUSINESSES_STORAGE_KEY);
    await AsyncStorage.removeItem('@NegociosDoBairro:categories');
    await AsyncStorage.removeItem('@NegociosDoBairro:user_data');
    
    // Reinicializa com dados padrão
    await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(initialBusinesses));
    
    return true;
  } catch (error) {
    console.error('Error clearing and resetting data:', error);
    return false;
  }
};

const updateBusiness = async (categoryId, businessId, updatedBusiness) => {
  try {
    // Primeiro, tenta encontrar o negócio nos dados das categorias iniciais
    const businesses = await getAllBusinesses();
    
    // Converte nome da categoria para ID se necessário
    let actualCategoryId = categoryId;
    if (categoryId && !businesses[categoryId]) {
      const convertedId = getCategoryIdByName(categoryId);
      if (convertedId && businesses[convertedId]) {
        actualCategoryId = convertedId;
      }
    }
    
    // Se ainda não tiver um categoryId válido, tenta encontrar automaticamente
    if (!actualCategoryId || !businesses[actualCategoryId]) {
      actualCategoryId = await findBusinessCategory(businessId);
    }
    
    // Se encontrou o negócio nas categorias iniciais, atualiza lá
    if (actualCategoryId && businesses[actualCategoryId]) {
      const index = businesses[actualCategoryId].findIndex(b => b.id === businessId);
      
      if (index !== -1) {
        businesses[actualCategoryId][index] = { ...businesses[actualCategoryId][index], ...updatedBusiness };
        
        // Salva os negócios atualizados
        await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
        
        return businesses[actualCategoryId][index];
      }
    }
    
    // Se não encontrou nas categorias iniciais, tenta nos negócios registrados pelos usuários
    const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';
    const storedRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = storedRegistrations ? JSON.parse(storedRegistrations) : [];
    
    const registrationIndex = registrations.findIndex(b => b.id === businessId);
    
    if (registrationIndex !== -1) {
      registrations[registrationIndex] = { ...registrations[registrationIndex], ...updatedBusiness };
      
      // Salva os registros atualizados
      await AsyncStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
      
      return registrations[registrationIndex];
    }
    
    // Se chegou até aqui, o negócio não foi encontrado em lugar nenhum
    throw new Error('Negócio não encontrado');
    
  } catch (error) {
    console.error('Erro ao atualizar negócio:', error);
    throw error;
  }
};

// Remove um negócio
const removeBusiness = async (categoryId, businessId) => {
  try {
    const businesses = await getAllBusinesses();
    
    if (!businesses[categoryId]) {
      throw new Error('Categoria não encontrada');
    }
    
    businesses[categoryId] = businesses[categoryId].filter(b => b.id !== businessId);
    
    // Salva os negócios atualizados
    await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
    
    return true;
  } catch (error) {
    console.error('Erro ao remover negócio:', error);
    throw error;
  }
};

// Obtém negócios registrados por subcategoria
const getBusinessesBySubcategory = async (subcategory) => {
  try {
    const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';
    const storedRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = storedRegistrations ? JSON.parse(storedRegistrations) : [];
    
    // Filtra negócios pela subcategoria
    return registrations.filter(business => business.subcategory === subcategory);
  } catch (error) {
    console.error('Erro ao obter negócios por subcategoria:', error);
    return [];
  }
};

// Obtém todas as subcategorias que têm negócios cadastrados
const getSubcategoriesWithBusinesses = async () => {
  try {
    const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';
    const storedRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = storedRegistrations ? JSON.parse(storedRegistrations) : [];
    
    // Extrai subcategorias únicas
    const subcategories = [...new Set(registrations.map(business => business.subcategory).filter(Boolean))];
    return subcategories;
  } catch (error) {
    console.error('Erro ao obter subcategorias com negócios:', error);
    return [];
  }
};

// Deleta um negócio
const deleteBusiness = async (categoryId, businessId) => {
  try {
    // Primeiro, tenta encontrar o negócio nos dados das categorias iniciais
    const businesses = await getAllBusinesses();
    
    // Converte nome da categoria para ID se necessário
    let actualCategoryId = categoryId;
    if (categoryId && !businesses[categoryId]) {
      const convertedId = getCategoryIdByName(categoryId);
      if (convertedId && businesses[convertedId]) {
        actualCategoryId = convertedId;
      }
    }
    
    // Se ainda não tiver um categoryId válido, tenta encontrar automaticamente
    if (!actualCategoryId || !businesses[actualCategoryId]) {
      actualCategoryId = await findBusinessCategory(businessId);
    }
    
    // Se encontrou o negócio nas categorias iniciais, deleta de lá
    if (actualCategoryId && businesses[actualCategoryId]) {
      const index = businesses[actualCategoryId].findIndex(b => b.id === businessId);
      
      if (index !== -1) {
        const deletedBusiness = businesses[actualCategoryId][index];
        
        // Remove o negócio da categoria
        businesses[actualCategoryId].splice(index, 1);
        
        // Salva os negócios atualizados
        await AsyncStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
        
        return deletedBusiness;
      }
    }
    
    // Se não encontrou nas categorias iniciais, tenta nos negócios registrados pelos usuários
    const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';
    const storedRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = storedRegistrations ? JSON.parse(storedRegistrations) : [];
    
    const registrationIndex = registrations.findIndex(b => b.id === businessId);
    
    if (registrationIndex !== -1) {
      const deletedRegistration = registrations[registrationIndex];
      
      // Remove o registro
      registrations.splice(registrationIndex, 1);
      
      // Salva os registros atualizados
      await AsyncStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
      
      return deletedRegistration;
    }
    
    // Se chegou até aqui, o negócio não foi encontrado em lugar nenhum
    throw new Error('Negócio não encontrado');
    
  } catch (error) {
    console.error('Erro ao deletar negócio:', error);
    throw error;
  }
};

// Função para limpar dados duplicados ou órfãos
const cleanupDuplicateData = async () => {
  try {
    console.log('=== INICIANDO LIMPEZA DE DADOS ===');
    
    // Limpar registros duplicados
    const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';
    const storedRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = storedRegistrations ? JSON.parse(storedRegistrations) : [];
    
    console.log(`Total de registros antes da limpeza: ${registrations.length}`);
    
    // Remove duplicatas baseado em ID, nome e telefone
    const uniqueRegistrations = [];
    const seenIds = new Set();
    const seenNamePhone = new Set();
    
    if (registrations && Array.isArray(registrations)) {
      registrations.forEach(business => {
        const id = business.id;
        const name = (business.establishmentName || business.name || '').toLowerCase().trim();
        const phone = (business.phone || '').replace(/\D/g, '');
        const namePhoneKey = `${name}_${phone}`;
        
        // Verifica se é um registro válido
        const isValid = name && phone && name.length > 2 && phone.length >= 8;
        
        if (id && !seenIds.has(id) && isValid) {
          seenIds.add(id);
          uniqueRegistrations.push(business);
        } else if (!id && name && phone && !seenNamePhone.has(namePhoneKey) && isValid) {
          seenNamePhone.add(namePhoneKey);
          uniqueRegistrations.push(business);
        } else if (!isValid) {
          console.log(`Registro inválido removido: ${JSON.stringify({name, phone, id})}`);
        } else {
          console.log(`Duplicata removida: ${JSON.stringify({name, phone, id})}`);
        }
      });
    }
    
    console.log(`Total de registros após limpeza: ${uniqueRegistrations.length}`);
    console.log(`Registros removidos: ${registrations.length - uniqueRegistrations.length}`);
    
    // Salva os registros limpos
    await AsyncStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(uniqueRegistrations));
    
    // Limpar dados órfãos do cache
    const allKeys = await AsyncStorage.getAllKeys();
    const orphanKeys = allKeys.filter(key => 
      key.includes('temp_') || 
      key.includes('_backup') || 
      key.includes('_old') ||
      (key.includes('business_') && !key.includes('businesses'))
    );
    
    if (orphanKeys.length > 0) {
      console.log(`Removendo ${orphanKeys.length} chaves órfãs:`, orphanKeys);
      await AsyncStorage.multiRemove(orphanKeys);
    }
    
    console.log('=== LIMPEZA DE DADOS CONCLUÍDA ===');
    
    return {
      originalCount: registrations.length,
      cleanedCount: uniqueRegistrations.length,
      removedCount: registrations.length - uniqueRegistrations.length,
      orphanKeysRemoved: orphanKeys.length
    };
    
  } catch (error) {
    console.error('Erro na limpeza de dados:', error);
    throw error;
  }
};

export default {
  initializeStorage,
  getCategories,
  getAllBusinesses,
  getBusinessesByCategory,
  getBusinessesBySubcategory,
  getSubcategoriesWithBusinesses,
  addBusiness,
  updateBusiness,
  deleteBusiness,
  removeBusiness,
  getCategoryIdByName,
  findBusinessById,
  ensureInitialData,
  clearAndResetData,
  cleanupDuplicateData,
};