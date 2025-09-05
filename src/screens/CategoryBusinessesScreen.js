import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import businessApiService from '../services/BusinessApiService';
import businessService from '../services/BusinessService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationManager';
import { useApiState } from '../hooks/useApiState';

const BusinessItem = React.memo(({ item, onPress, colors }) => (
  <TouchableOpacity style={styles.businessItem} onPress={() => onPress(item)}>
    <Text style={styles.businessName}>{item.name}</Text>
    <Text style={styles.businessInfo}>Endereço: {item.address}</Text>
    {(item.neighborhood || item.cityState) && (
      <Text style={styles.businessLocation}>
        {item.neighborhood && item.cityState ? `${item.neighborhood}, ${item.cityState}` :
         item.neighborhood ? item.neighborhood :
         item.cityState ? item.cityState : ''}
      </Text>
    )}
    <Text style={styles.businessInfo}>Telefone: {item.phone}</Text>
    <Text style={[styles.viewProfileText, { color: colors.primary }]}>Toque para ver perfil →</Text>
  </TouchableOpacity>
));

const CategoryBusinessesScreen = ({ route, navigation }) => {
  const { category, categoryName, categoryId, refresh } = route.params || {};
  const { data: businesses, loading, error, execute: fetchBusinesses } = useApiState([]);
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  // Cria um objeto category se não existir
  const categoryObject = category || {
    id: categoryId,
    name: categoryName
  };

  // Função para obter cores baseadas na categoria
  const getCategoryColors = useCallback((categoryName) => {
    const colorSchemes = {
      'Prestação de Serviços': {
        primary: '#e74c3c', // Vermelho dos serviços
        secondary: '#c0392b',
        accent: '#fadbd8',
        border: '#e74c3c'
      },
      'Comércio': {
        primary: '#27ae60', // Verde do comércio
        secondary: '#229954',
        accent: '#d5f4e6',
        border: '#27ae60'
      },
      'Escolas': {
        primary: '#f39c12', // Laranja das escolas
        secondary: '#e67e22',
        accent: '#fdeaa7',
        border: '#f39c12'
      },
      'Instituições Públicas': {
        primary: '#D0021B', // Vermelho do botão do CategoriesMenuScreen
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Instituições Comunitárias': {
        primary: '#9013FE', // Roxo do botão do CategoriesMenuScreen
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Instituições Religiosas': {
        primary: '#50E3C2', // Verde água do botão do CategoriesMenuScreen
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      }
    };
    
    return colorSchemes[categoryName] || {
      primary: '#A0522D',
      secondary: '#D2691E',
      accent: '#F5DEB3',
      border: '#A0522D'
    };
  }, []);

  // Obtém as cores baseadas na categoria
  const currentColors = getCategoryColors(categoryName || categoryObject.name);

  // Carrega os negócios da categoria
  const loadBusinesses = useCallback(async () => {
    if (!category?.id && !categoryId) {
      showNotification('Categoria não encontrada', 'error');
      return [];
    }

    const targetCategoryId = category?.id || categoryId;
    
    try {
      const data = await businessApiService.getBusinessesByCategory(targetCategoryId);
      if (data && data.length > 0) {
        showNotification(`${data.length} negócios encontrados`, 'success');
        return data;
      } else {
        showNotification('Nenhum negócio encontrado nesta categoria', 'info');
        return [];
      }
    } catch (error) {
      console.error('Erro ao carregar negócios:', error);
      
      // Tentar carregar dados do cache como fallback
      try {
        const cachedData = await businessApiService.getCachedBusinesses();
        const filteredData = cachedData.filter(business => business.category_id === targetCategoryId);
        
        if (filteredData.length > 0) {
          showNotification('Dados carregados do cache local', 'info');
          return filteredData;
        } else {
          showNotification('Nenhum negócio encontrado no cache', 'warning');
          return [];
        }
      } catch (cacheError) {
        console.error('Erro ao carregar dados do cache:', cacheError);
        
        // Fallback final: tentar carregar dados locais do BusinessService
        try {
          const localData = await businessService.getBusinessesByCategory(targetCategoryId);
          if (localData && localData.length > 0) {
            showNotification('Dados carregados do armazenamento local', 'info');
            return localData;
          } else {
            showNotification('Nenhum negócio encontrado', 'warning');
            return [];
          }
        } catch (localError) {
          console.error('Erro ao carregar dados locais:', localError);
          showNotification('Erro ao carregar negócios', 'error');
          return [];
        }
      }
    }
  }, [category, categoryId, showNotification]);

  // Função para refresh
  const handleRefresh = useCallback(() => {
    fetchBusinesses(loadBusinesses);
  }, [fetchBusinesses, loadBusinesses]);

  // Navega para o perfil do negócio
  const handleBusinessPress = useCallback((business) => {
    navigation.navigate('BusinessProfile', { business, category: categoryObject });
  }, [navigation, categoryObject]);

  // Carrega os negócios quando a tela é montada ou quando retorna de outra tela
  useEffect(() => {
    fetchBusinesses(loadBusinesses);
    
    // Configura um listener para quando a tela receber foco
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBusinesses(loadBusinesses);
    });
    
    // Limpa o listener quando o componente é desmontado
    return unsubscribe;
  }, [navigation, category?.id, fetchBusinesses, loadBusinesses]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={[styles.header, { backgroundColor: currentColors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#ffffff' }]}>{categoryName || category?.name || 'Categoria'}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: currentColors.primary }]}
        onPress={() => navigation.navigate('GeneralRegistration')}
      >
        <Text style={styles.addButtonText}>+ Cadastrar Novo Negócio</Text>
      </TouchableOpacity>
      
      {loading && businesses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando negócios...</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          renderItem={({ item }) => <BusinessItem item={item} onPress={handleBusinessPress} colors={currentColors} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={[currentColors.primary]}
              tintColor={currentColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {error ? 'Erro ao carregar negócios' : 'Nenhum negócio encontrado nesta categoria'}
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: currentColors.primary }]} 
                onPress={handleRefresh}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 10,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    margin: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
    paddingTop: 0,
  },
  businessItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  businessInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessLocation: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
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
    color: '#666',
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
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryBusinessesScreen;