import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedBackButton from '../components/AnimatedBackButton';
import BusinessListItem from '../components/BusinessListItem';
import { getBusinessesBySubcategory } from '../services/businessService';

const headerThemeByParent = (parentCategory) => {
  if (parentCategory === 'Serviços' || parentCategory === 'Prestação de Serviços') {
    return { bg: '#e74c3c', border: '#c0392b', title: '🔧' };
  }
  if (parentCategory === 'Comércio') {
    return { bg: '#27ae60', border: '#229954', title: '🛍️' };
  }
  if (parentCategory === 'Escolas') {
    return { bg: '#f39c12', border: '#e67e22', title: '🎓' };
  }
  return { bg: '#0f172a', border: 'rgba(255,255,255,0.18)', title: '📌' };
};

const SubcategoryBusinessesScreen = ({ route, navigation }) => {
  const { subcategory, subcategoryId, subcategoryName, parentCategory } = route.params || {};
  const theme = useMemo(() => headerThemeByParent(parentCategory), [parentCategory]);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinessesBySubcategory(subcategoryId || subcategory);
        setAllBusinesses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Erro ao carregar negócios');
        setAllBusinesses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subcategory, subcategoryId]);

  const businesses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBusinesses;
    return allBusinesses.filter((b) => {
      const hay = `${b.name || ''} ${b.description || ''} ${b.address || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allBusinesses, query]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <AnimatedBackButton onPress={() => navigation.goBack()} style={styles.headerBackButton} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
          {theme.title} {subcategoryName || subcategory || 'Subcategoria'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Filtrar nesta subcategoria..."
          placeholderTextColor="rgba(31, 41, 55, 0.55)"
          style={styles.searchInput}
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
                navigation.navigate('BusinessProfile', { businessId: item.id, business: item, parentCategory, subcategory })
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
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

export default SubcategoryBusinessesScreen;
