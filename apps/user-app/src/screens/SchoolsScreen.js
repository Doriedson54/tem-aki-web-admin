import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackButton from '../components/AnimatedBackButton';
import { getSubcategories } from '../services/businessService';

const pickIcon = (subcategoryName) => {
  const name = String(subcategoryName || '').toLowerCase();
  if (name.includes('infantil') || name.includes('creche')) return 'balloon-outline';
  if (name.includes('fundamental') || name.includes('médio') || name.includes('medio')) return 'school-outline';
  if (name.includes('técnic') || name.includes('tecnic') || name.includes('profiss') || name.includes('curso')) return 'hammer-outline';
  if (name.includes('idioma') || name.includes('inglês') || name.includes('ingles')) return 'language-outline';
  if (name.includes('univers') || name.includes('faculd')) return 'library-outline';
  return 'book-outline';
};

const SchoolsScreen = ({ navigation, route }) => {
  const categoryId = route?.params?.categoryId || null;
  const parentCategory = route?.params?.parentCategory || 'Escolas';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!categoryId) {
        setError('Categoria inválida');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getSubcategories(categoryId);
        if (!cancelled) setSubcategories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Erro ao carregar subcategorias');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const columns = subcategories.length <= 6 ? 2 : 3;
  const cardWidth = columns === 2 ? '48%' : '31%';
  const palette = useMemo(() => ['#2E7D32', '#1565C0', '#7B1FA2', '#f39c12', '#e74c3c', '#16a085'], []);

  const handleSchoolPress = (school) => {
    navigation.navigate('SubcategoryBusinesses', {
      subcategoryId: school.id,
      subcategoryName: school.name,
      parentCategory,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <AnimatedBackButton onPress={() => navigation.goBack()} style={styles.headerBackButton} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          🎓 {parentCategory}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesContainer}>
          {loading ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>Carregando subcategorias...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>⚠️ {error}</Text>
            </View>
          ) : (
            subcategories.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, { backgroundColor: palette[index % palette.length], width: cardWidth }]}
                onPress={() => handleSchoolPress(category)}
                activeOpacity={0.7}
              >
                <Ionicons name={pickIcon(category.name)} size={34} color="#ffffff" style={styles.categoryIcon} />
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
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
    backgroundColor: '#f39c12',
    borderBottomWidth: 3,
    borderBottomColor: '#e67e22',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingVertical: 20,
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
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryIcon: {
  },
});

export default SchoolsScreen;
