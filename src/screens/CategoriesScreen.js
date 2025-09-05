import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import businessApiService from '../services/BusinessApiService';
import businessService from '../services/BusinessService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationManager';
import { useApiState } from '../hooks/useApiState';

const CategoryItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
    <Text style={styles.categoryIcon}>{item.icon}</Text>
    <Text style={styles.categoryName}>{item.name}</Text>
  </TouchableOpacity>
));

const CategoriesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const {
    data: categories,
    loading,
    error,
    execute: loadCategories
  } = useApiState([]);
  
  const handleCategoryPress = useCallback((category) => {
    navigation.navigate('CategoryBusinesses', { category });
  }, [navigation]);
  
  const fetchCategories = useCallback(async () => {
    try {
      const data = await businessApiService.getCategories();
      return data;
    } catch (error) {
      // Se o erro tem dados de fallback, usa eles
      if (error.fallbackData) {
        showError('Usando dados locais. Verifique sua conexão.');
        return error.fallbackData;
      }
      
      // Fallback final: usar BusinessService local
      try {
        const localCategories = businessService.getCategories();
        showError('Usando dados locais do armazenamento. Verifique sua conexão.');
        return localCategories;
      } catch (localError) {
        console.error('Erro ao carregar categorias locais:', localError);
        throw error; // Lança o erro original
      }
    }
  }, [showError]);
  
  const handleRefresh = useCallback(async () => {
    try {
      await loadCategories(fetchCategories, {
        showSuccessNotification: false,
        showErrorNotification: true
      });
    } catch (error) {
      // Erro já tratado pelo useApiState
    }
  }, [loadCategories, fetchCategories]);
  
  useEffect(() => {
    handleRefresh();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Tem Aki no Bairro</Text>
      </View>
      {loading && categories.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <CategoryItem
              item={item}
              onPress={() => handleCategoryPress(item)}
            />
          )}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {error ? 'Erro ao carregar categorias' : 'Nenhuma categoria encontrada'}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
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
  },
  header: {
    padding: 20,
    backgroundColor: '#A0522D',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  listContainer: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryItem: {
    flex: 1,
    margin: 10,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
});

export default CategoriesScreen;