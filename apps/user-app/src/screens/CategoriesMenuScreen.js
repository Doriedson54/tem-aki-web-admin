import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedBackButton from '../components/AnimatedBackButton';
import { getCategories } from '../services/businessService';

const CategoriesMenuScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        const all = Array.isArray(data) ? data : [];

        const allowedNames = [
          'Serviços',
          'Comércio',
          'Escolar',
          'Instituições Públicas',
          'Instituições Comunitárias',
          'Instituições Religiosas',
        ];

        const byName = new Map(all.map((c) => [c.name, c]));
        const ordered = allowedNames.map((name) => byName.get(name)).filter(Boolean);

        if (!cancelled) setCategoryItems(ordered);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Erro ao carregar categorias');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const colorByName = {
      Serviços: '#e74c3c',
      Comércio: '#27ae60',
      Escolar: '#f39c12',
      'Instituições Públicas': '#D0021B',
      'Instituições Comunitárias': '#9013FE',
      'Instituições Religiosas': '#16a085',
    };
    const iconByName = {
      Serviços: '🔧',
      Comércio: '🛍️',
      Escolar: '🎓',
      'Instituições Públicas': '🏛️',
      'Instituições Comunitárias': '🤝',
      'Instituições Religiosas': '⛪',
    };

    return (categoryItems || []).map((c) => {
      const name = c?.name || '';
      const displayTitle = name === 'Escolar' ? 'Escolas' : name;
      const isInstitutions = name.startsWith('Instituições');
      return {
        id: c?.id,
        name,
        title: displayTitle,
        icon: iconByName[name] || '📌',
        color: colorByName[name] || '#0f172a',
        screen: isInstitutions ? 'CategoryBusinesses' : name === 'Comércio' ? 'Commerce' : name === 'Escolar' ? 'Schools' : 'ServiceProviders',
      };
    });
  }, [categoryItems]);

  const handleCategoryPress = (category) => {
    if (category.screen === 'CategoryBusinesses') {
      navigation.navigate('CategoryBusinesses', { categoryName: category.title, categoryId: category.id });
      return;
    }
    navigation.navigate(category.screen, {
      categoryId: category.id,
      parentCategory: category.title,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <AnimatedBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          🎯 Escolha o que precisa
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.categoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Carregando categorias...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>⚠️ {error}</Text>
          </View>
        ) : (
          categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, { backgroundColor: category.color }]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    backgroundColor: '#8e44ad',
    borderBottomWidth: 3,
    borderBottomColor: '#9b59b6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 20,
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
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stateContainer: {
    width: '100%',
    paddingTop: 16,
  },
  stateText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(31, 41, 55, 0.85)',
  },
  categoryButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  categoryIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 18,
  },
});

export default CategoriesMenuScreen;
