import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import businessApiService from '../services/BusinessApiService';
import BusinessService from '../services/BusinessService';
import { useAuth } from '../contexts/AuthContext';

const BusinessItem = ({ business, onPress, colors }) => (
  <TouchableOpacity style={[styles.businessItem, { borderLeftColor: colors.border }]} onPress={() => onPress(business)}>
    <View style={styles.businessContent}>
      <View style={styles.photoContainer}>
        {business.profilePhoto ? (
          <Image source={{ uri: business.profilePhoto }} style={styles.businessPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderPhotoText}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{business.establishmentName}</Text>
        <Text style={styles.businessProduct}>{business.mainProduct}</Text>
        <Text style={styles.businessAddress} numberOfLines={1}>{business.address}</Text>
        {(business.neighborhood || business.cityState) && (
          <Text style={styles.businessLocation} numberOfLines={1}>
            {business.neighborhood && business.cityState ? `${business.neighborhood}, ${business.cityState}` :
             business.neighborhood ? business.neighborhood :
             business.cityState ? business.cityState : ''}
          </Text>
        )}
        {business.phone && (
          <Text style={styles.businessPhone}>{business.phone}</Text>
        )}
      </View>
    </View>
    <Text style={[styles.viewProfileText, { color: colors.primary }]}>Ver perfil →</Text>
  </TouchableOpacity>
);

const SubcategoryBusinessesScreen = ({ route, navigation }) => {
  const { subcategory, parentCategory } = route.params || {};
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Função para obter cores baseadas na subcategoria específica
  const getSubcategoryColors = (subcategoryName, parentCategory) => {
    // Cores específicas por subcategoria
    const subcategoryColorSchemes = {
      // Prestação de Serviços
      'Serviços Domésticos e de Manutenção': {
        primary: '#FF6B6B',
        secondary: '#ff8a80',
        accent: '#ffebee',
        border: '#f44336'
      },
      'Serviços Comerciais': {
        primary: '#4ECDC4',
        secondary: '#80cbc4',
        accent: '#e0f2f1',
        border: '#26a69a'
      },
      'Serviços de Saúde e Bem-Estar': {
        primary: '#45B7D1',
        secondary: '#81c784',
        accent: '#e8f5e8',
        border: '#66bb6a'
      },
      'Serviços Educacionais e Culturais': {
        primary: '#F7DC6F',
        secondary: '#fff176',
        accent: '#fffde7',
        border: '#ffeb3b'
      },
      'Serviços de Transporte': {
        primary: '#BB8FCE',
        secondary: '#ce93d8',
        accent: '#f3e5f5',
        border: '#ba68c8'
      },
      'Serviços Digitais e de Comunicação': {
        primary: '#85C1E9',
        secondary: '#90caf9',
        accent: '#e3f2fd',
        border: '#42a5f5'
      },
      'Serviços Financeiros e Administrativos': {
        primary: '#82E0AA',
        secondary: '#a5d6a7',
        accent: '#e8f5e8',
        border: '#66bb6a'
      },
      'Serviços Comunitários e Públicos': {
        primary: '#F8C471',
        secondary: '#ffcc02',
        accent: '#fff8e1',
        border: '#ffc107'
      },
      // Comércio
      'Alimentação e Bebidas': {
        primary: '#FF6B6B',
        secondary: '#ff8a80',
        accent: '#ffebee',
        border: '#f44336'
      },
      'Automotivo e Acessórios': {
        primary: '#4ECDC4',
        secondary: '#80cbc4',
        accent: '#e0f2f1',
        border: '#26a69a'
      },
      'Beleza e Cuidados Pessoais': {
        primary: '#45B7D1',
        secondary: '#81c784',
        accent: '#e8f5e8',
        border: '#66bb6a'
      },
      'Casa, Construção e Decoração': {
        primary: '#F7DC6F',
        secondary: '#fff176',
        accent: '#fffde7',
        border: '#ffeb3b'
      },
      'Educação e Cultura': {
        primary: '#BB8FCE',
        secondary: '#ce93d8',
        accent: '#f3e5f5',
        border: '#ba68c8'
      },
      'Moda e Acessórios': {
        primary: '#85C1E9',
        secondary: '#90caf9',
        accent: '#e3f2fd',
        border: '#42a5f5'
      },
      'Pets e outros Animais': {
        primary: '#82E0AA',
        secondary: '#a5d6a7',
        accent: '#e8f5e8',
        border: '#66bb6a'
      },
      'Utilidades e Variedades': {
        primary: '#F8C471',
        secondary: '#ffcc02',
        accent: '#fff8e1',
        border: '#ffc107'
      },
      // Escolas - cores exatas dos botões do SchoolsScreen
      'Escolas Públicas': {
        primary: '#2E7D32',
        secondary: '#4caf50',
        accent: '#E8F5E8',
        border: '#2E7D32'
      },
      'Escolas Particulares': {
        primary: '#1565C0',
        secondary: '#2196f3',
        accent: '#E3F2FD',
        border: '#1565C0'
      },
      'Escolas Comunitárias': {
        primary: '#7B1FA2',
        secondary: '#9c27b0',
        accent: '#F3E5F5',
        border: '#7B1FA2'
      },
      // Instituições Públicas - cor vermelha do botão do CategoriesMenuScreen
      'Prefeitura': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Câmara Municipal': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Cartório': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Delegacia de Polícia': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Posto de Saúde': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Hospital Público': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Escola Pública': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Biblioteca Pública': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Correios': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Receita Federal': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'INSS': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Detran': {
        primary: '#D0021B',
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      // Instituições Comunitárias - cor roxa do botão do CategoriesMenuScreen
      'Centro Comunitário': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Associação de Moradores': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'ONG': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Cooperativa': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Sindicato': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Fundação': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Instituto Social': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Casa de Apoio': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Centro Cultural': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Grupo de Voluntários': {
        primary: '#9013FE',
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      // Instituições Religiosas - cor verde água do botão do CategoriesMenuScreen
      'Igreja Católica': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Igreja Evangélica': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Igreja Pentecostal': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Igreja Batista': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Igreja Metodista': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Igreja Presbiteriana': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Igreja Adventista': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Centro Espírita': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Terreiro de Umbanda': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Terreiro de Candomblé': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Mesquita': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Sinagoga': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Templo Budista': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      },
      'Centro de Meditação': {
        primary: '#50E3C2',
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      }
    };
    
    // Se existe cor específica para a subcategoria, usa ela
    if (subcategoryColorSchemes[subcategoryName]) {
      return subcategoryColorSchemes[subcategoryName];
    }
    
    // Caso contrário, usa cores baseadas na categoria pai
    const parentColorSchemes = {
      'Instituições Públicas': {
        primary: '#1e3a8a', // Azul governamental
        secondary: '#3b82f6',
        accent: '#dbeafe',
        border: '#2563eb'
      },
      'Instituições Comunitárias': {
        primary: '#166534', // Verde comunidade
        secondary: '#22c55e',
        accent: '#dcfce7',
        border: '#16a34a'
      },
      'Instituições Religiosas': {
        primary: '#7c2d12', // Marrom/dourado espiritual
        secondary: '#d97706',
        accent: '#fef3c7',
        border: '#f59e0b'
      }
    };
    
    return parentColorSchemes[parentCategory] || {
      primary: '#28a745',
      secondary: '#3498db',
      accent: '#e8f4fd',
      border: '#3498db'
    };
  };

  // Obtém as cores baseadas na subcategoria específica
  const currentColors = getSubcategoryColors(subcategory, parentCategory);

  // Carrega os negócios da subcategoria
  const loadBusinesses = async () => {
    try {
      setLoading(true);
      if (subcategory) {
        // Busca dados da API
        let apiBusinesses = [];
        try {
          const allBusinesses = await businessApiService.getAllBusinesses();
          apiBusinesses = allBusinesses.filter(business => 
            business.subcategory === subcategory || 
            business.mainProduct?.toLowerCase().includes(subcategory.toLowerCase())
          );
        } catch (apiError) {
          console.log('Erro ao buscar da API, tentando cache:', apiError);
          try {
            const cachedData = await businessApiService.getCachedBusinesses();
            apiBusinesses = cachedData.filter(business => 
              business.subcategory === subcategory || 
              business.mainProduct?.toLowerCase().includes(subcategory.toLowerCase())
            );
          } catch (cacheError) {
            console.log('Erro ao buscar do cache:', cacheError);
          }
        }
        
        // Busca dados locais (salvos offline)
        let localBusinesses = [];
        try {
          localBusinesses = await BusinessService.getBusinessesBySubcategory(subcategory);
          console.log(`Encontrados ${localBusinesses.length} negócios locais para subcategoria ${subcategory}`);
        } catch (localError) {
          console.log('Erro ao buscar dados locais:', localError);
        }
        
        // Combina dados da API e locais, removendo duplicatas
        const allBusinesses = [...apiBusinesses];
        localBusinesses.forEach(localBusiness => {
          // Verifica se o negócio local já existe na lista da API
          const exists = allBusinesses.some(apiBusiness => {
            // Compara por ID primeiro (mais confiável)
            if (apiBusiness.id === localBusiness.id) {
              return true;
            }
            // Compara por nome e telefone (fallback)
            const apiName = (apiBusiness.establishmentName || apiBusiness.name || '').toLowerCase().trim();
            const localName = (localBusiness.establishmentName || localBusiness.name || '').toLowerCase().trim();
            const apiPhone = (apiBusiness.phone || '').replace(/\D/g, '');
            const localPhone = (localBusiness.phone || '').replace(/\D/g, '');
            
            return apiName === localName && apiPhone === localPhone && apiName !== '' && apiPhone !== '';
          });
          if (!exists) {
            allBusinesses.push(localBusiness);
          }
        });
        
        // Remove duplicatas internas (caso existam)
        const uniqueBusinesses = [];
        const seenIds = new Set();
        const seenNamePhone = new Set();
        
        allBusinesses.forEach(business => {
          const id = business.id;
          const name = (business.establishmentName || business.name || '').toLowerCase().trim();
          const phone = (business.phone || '').replace(/\D/g, '');
          const namePhoneKey = `${name}_${phone}`;
          
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueBusinesses.push(business);
          } else if (!id && name && phone && !seenNamePhone.has(namePhoneKey)) {
            seenNamePhone.add(namePhoneKey);
            uniqueBusinesses.push(business);
          } else if (!id && (!name || !phone)) {
            // Para negócios sem ID e sem nome/telefone válidos, adiciona mesmo assim
            uniqueBusinesses.push(business);
          }
        });
        
        console.log(`Total de negócios encontrados: ${uniqueBusinesses.length} (${apiBusinesses.length} da API + ${localBusinesses.length} locais, ${allBusinesses.length - uniqueBusinesses.length} duplicatas removidas)`);
        setBusinesses(uniqueBusinesses);
      }
    } catch (error) {
      console.error('Erro ao carregar negócios:', error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  // Navega para o perfil do negócio
  const handleBusinessPress = (business) => {
    // Cria um objeto de categoria baseado no parentCategory
    const category = { name: parentCategory || 'Categoria', id: parentCategory };
    navigation.navigate('BusinessProfile', { business, category });
  };

  // Carrega os negócios quando a tela é montada ou quando retorna de outra tela
  useEffect(() => {
    loadBusinesses();
    
    // Configura um listener para quando a tela receber foco
    const unsubscribe = navigation.addListener('focus', () => {
      loadBusinesses();
    });
    
    // Limpa o listener quando o componente é desmontado
    return unsubscribe;
  }, [navigation, subcategory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentColors.primary }]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>{subcategory}</Text>
          {parentCategory && (
            <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>{parentCategory}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>
      
      {/* Add Business Button */}
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: currentColors.primary }]}
        onPress={() => navigation.navigate('GeneralRegistration', { 
          category: parentCategory, 
          subcategory: subcategory 
        })}
      >
        <Text style={styles.addButtonText}>+ Cadastrar Novo Negócio</Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : businesses.length > 0 ? (
        <FlatList
          data={businesses}
          renderItem={({ item }) => (
            <BusinessItem 
              business={item} 
              onPress={handleBusinessPress}
              colors={currentColors}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum negócio cadastrado nesta subcategoria.</Text>
          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: currentColors.primary }]}
            onPress={() => navigation.navigate('GeneralRegistration', { 
              category: parentCategory, 
              subcategory: subcategory 
            })}
          >
            <Text style={styles.registerButtonText}>Cadastrar Primeiro Negócio</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  addButton: {
    margin: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  businessItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,

  },
  businessContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  photoContainer: {
    marginRight: 16,
  },
  businessPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  placeholderPhotoText: {
    fontSize: 20,
    color: '#6c757d',
  },
  businessInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  businessProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  businessLocation: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  businessPhone: {
    fontSize: 14,
    color: '#495057',
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  registerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SubcategoryBusinessesScreen;