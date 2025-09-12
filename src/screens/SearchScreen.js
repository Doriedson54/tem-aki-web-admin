import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import businessApiService from '../services/BusinessApiService';
import { useNotification } from '../components/NotificationManager';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();

  // Função para realizar a busca
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      showNotification('Digite algo para buscar', 'warning');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      console.log('Buscando por:', query);
      const results = await businessApiService.searchBusinesses(query.trim());
      
      setSearchResults(results || []);
      
      // Resultados definidos sem notificação
    } catch (error) {
      console.error('Erro na busca:', error);
      showNotification('Erro ao realizar busca', 'error');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Função para navegar para o perfil do negócio
  const navigateToBusinessProfile = useCallback((business) => {
    navigation.navigate('BusinessProfile', { business });
  }, [navigation]);

  // Função para voltar
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Função para limpar a busca
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  // Renderizar item da lista de resultados
  const renderBusinessItem = useCallback(({ item }) => {
    return (
      <TouchableOpacity
        style={styles.businessItem}
        onPress={() => navigateToBusinessProfile(item)}
        activeOpacity={0.7}
      >
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{item.name}</Text>
          <Text style={styles.businessCategory}>{item.category}</Text>
          {item.subcategory && (
            <Text style={styles.businessSubcategory}>{item.subcategory}</Text>
          )}
          {item.address && (
            <Text style={styles.businessAddress}>{item.address}</Text>
          )}
          {item.main_product && (
            <Text style={styles.businessProduct}>Produto principal: {item.main_product}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  }, [navigateToBusinessProfile]);

  // Renderizar estado vazio
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateText}>Buscando...</Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>Nenhum resultado encontrado</Text>
          <Text style={styles.emptyStateSubtext}>
            Tente buscar por nome do negócio, categoria ou produto
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateText}>Busque por negócios</Text>
        <Text style={styles.emptyStateSubtext}>
          Digite o nome, categoria ou produto que você procura
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">🔍 Buscar Negócios</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, categoria ou produto..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => performSearch(searchQuery)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
          onPress={() => performSearch(searchQuery)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {hasSearched && searchResults.length > 0 && (
          <Text style={styles.resultsCount}>
            {searchResults.length} resultado(s) encontrado(s)
          </Text>
        )}
        
        <FlatList
          data={searchResults}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id?.toString() || item.name}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  clearButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContainer: {
    flexGrow: 1,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  businessSubcategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  businessProduct: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SearchScreen;