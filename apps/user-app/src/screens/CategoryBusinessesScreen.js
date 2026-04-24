import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedBackButton from '../components/AnimatedBackButton';
import BusinessListItem from '../components/BusinessListItem';
import { getBusinessesByCategory } from '../services/businessService';

const headerThemeByCategoryName = (categoryName) => {
  const c = (categoryName || '').toLowerCase();
  if (c.includes('públic') || c.includes('public')) return { bg: '#D0021B', border: '#b00017', icon: '🏛️' };
  if (c.includes('comunit')) return { bg: '#8e44ad', border: '#7d3c98', icon: '🤝' };
  if (c.includes('relig')) return { bg: '#16a085', border: '#138d75', icon: '⛪' };
  return { bg: '#0f172a', border: 'rgba(255,255,255,0.18)', icon: '📌' };
};

const CategoryBusinessesScreen = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params || {};
  const theme = useMemo(() => headerThemeByCategoryName(categoryName), [categoryName]);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todas');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinessesByCategory(categoryId);
        setAllBusinesses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Erro ao carregar negócios');
        setAllBusinesses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId]);

  const subcategories = useMemo(() => {
    const values = new Set();
    for (const b of allBusinesses) {
      if (b.subcategory) values.add(b.subcategory);
    }
    return ['Todas', ...Array.from(values).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [allBusinesses]);

  const businesses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBusinesses.filter((b) => {
      if (selectedSubcategory !== 'Todas' && b.subcategory !== selectedSubcategory) return false;
      if (!q) return true;
      const hay = `${b.name || ''} ${b.description || ''} ${b.address || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allBusinesses, query, selectedSubcategory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <AnimatedBackButton onPress={() => navigation.goBack()} style={styles.headerBackButton} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
          {theme.icon} {categoryName || 'Categoria'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Filtrar nesta categoria..."
          placeholderTextColor="rgba(31, 41, 55, 0.55)"
          style={styles.searchInput}
        />

        <FlatList
          data={subcategories}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedSubcategory(item)}
              style={[styles.chip, selectedSubcategory === item && styles.chipActive]}
              activeOpacity={0.86}
            >
              <Text style={[styles.chipText, selectedSubcategory === item && styles.chipTextActive]} numberOfLines={1}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Carregando negócios...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>⚠️ {error}</Text>
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Nenhum negócio encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BusinessListItem
              business={item}
              accentColor={theme.bg}
              onPress={() =>
                navigation.navigate('BusinessProfile', {
                  businessId: item.id,
                  business: item,
                  parentCategory: categoryName || null,
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
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 44,
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    color: '#111827',
    fontWeight: '800',
  },
  chipsRow: {
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.10)',
    maxWidth: 220,
  },
  chipActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  chipText: {
    color: '#2c3e50',
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#ffffff',
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

export default CategoryBusinessesScreen;
