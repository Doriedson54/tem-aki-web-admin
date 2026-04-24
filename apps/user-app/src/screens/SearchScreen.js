import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedBackButton from '../components/AnimatedBackButton';
import BusinessListItem from '../components/BusinessListItem';
import { searchBusinesses } from '../services/businessService';

const SearchScreen = ({ route, navigation }) => {
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  const performSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      const data = await searchBusinesses({ q });
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Erro ao buscar negócios');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      performSearch();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <AnimatedBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          Buscar
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchArea}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Digite ao menos 2 letras..."
          placeholderTextColor="rgba(31, 41, 55, 0.55)"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        <TouchableOpacity
          style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
          onPress={performSearch}
          disabled={!canSearch || loading}
          activeOpacity={0.86}
        >
          <Text style={styles.searchButtonText}>{loading ? '...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Buscando...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>⚠️ {error}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>
            {hasSearched ? 'Nenhum resultado encontrado.' : 'Digite para buscar negócios.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BusinessListItem
              business={item}
              accentColor="#007AFF"
              onPress={() =>
                navigation.navigate('BusinessProfile', {
                  businessId: item?.id ?? item?.business_id ?? item?._id ?? item?.uuid ?? null,
                  business: item,
                  parentCategory: item.category_name || item.category || null,
                  subcategory: item.subcategory || null,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    backgroundColor: '#007AFF',
    borderBottomWidth: 3,
    borderBottomColor: '#0068db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  placeholder: {
    width: 44,
  },
  searchArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    color: '#111827',
    fontWeight: '800',
  },
  searchButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  stateContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stateText: {
    color: 'rgba(31, 41, 55, 0.85)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 6,
  },
});

export default SearchScreen;
