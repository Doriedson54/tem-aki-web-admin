import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackButton from '../components/AnimatedBackButton';
import { getSubcategories } from '../services/businessService';

const pickIcon = (subcategoryName) => {
  const name = String(subcategoryName || '').toLowerCase();
  if (name.includes('mercad') || name.includes('super') || name.includes('varej') || name.includes('atacad')) return 'cart-outline';
  if (name.includes('farm') || name.includes('drog')) return 'medkit-outline';
  if (name.includes('padar') || name.includes('confe') || name.includes('café') || name.includes('cafe')) return 'cafe-outline';
  if (name.includes('açou') || name.includes('acou') || name.includes('açoug') || name.includes('acoug') || name.includes('carn')) return 'nutrition-outline';
  if (name.includes('hort') || name.includes('frut') || name.includes('verd') || name.includes('legum')) return 'leaf-outline';
  if (name.includes('roup') || name.includes('moda') || name.includes('calç') || name.includes('calc')) return 'shirt-outline';
  if (name.includes('joia') || name.includes('jóia') || name.includes('biju') || name.includes('ouro') || name.includes('prata')) return 'diamond-outline';
  if (name.includes('beleza') || name.includes('salão') || name.includes('salao') || name.includes('barbe') || name.includes('cosm')) return 'sparkles-outline';
  if (name.includes('cel') || name.includes('telefone') || name.includes('smart')) return 'phone-portrait-outline';
  if (name.includes('eletrodom') || name.includes('eletro') || name.includes('tv')) return 'tv-outline';
  if (name.includes('eletr') || name.includes('inform') || name.includes('tec')) return 'hardware-chip-outline';
  if (name.includes('constr') || name.includes('mate') || name.includes('ferr')) return 'construct-outline';
  if (name.includes('livr') || name.includes('papel') || name.includes('escri')) return 'book-outline';
  if (name.includes('brinqu') || name.includes('toy')) return 'balloon-outline';
  if (name.includes('moto') || name.includes('auto') || name.includes('car') || name.includes('peça') || name.includes('peca')) return 'car-outline';
  if (name.includes('móve') || name.includes('move') || name.includes('mobil') || name.includes('decora')) return 'bed-outline';
  if (name.includes('pet')) return 'paw-outline';
  return 'storefront-outline';
};

const CommerceScreen = ({ navigation, route }) => {
  const categoryId = route?.params?.categoryId || null;
  const parentCategory = route?.params?.parentCategory || 'Comércio';
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
  const palette = useMemo(
    () => ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471', '#F1948A', '#7FB3D5'],
    []
  );

  const handleCommercePress = (subcategory) => {
    navigation.navigate('SubcategoryBusinesses', {
      subcategoryId: subcategory.id,
      subcategoryName: subcategory.name,
      parentCategory,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <AnimatedBackButton onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          🛍️ {parentCategory}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.subcategoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Carregando subcategorias...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>⚠️ {error}</Text>
          </View>
        ) : (
          subcategories.map((subcategory, index) => (
            <TouchableOpacity
              key={subcategory.id}
              style={[styles.subcategoryButton, { backgroundColor: palette[index % palette.length], width: cardWidth }]}
              onPress={() => handleCommercePress(subcategory)}
              activeOpacity={0.8}
            >
              <Ionicons name={pickIcon(subcategory.name)} size={34} color="#ffffff" style={styles.subcategoryIcon} />
              <Text style={styles.subcategoryTitle}>{subcategory.name}</Text>
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
    backgroundColor: '#27ae60',
    borderBottomWidth: 3,
    borderBottomColor: '#229954',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  backButton: {
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
  scrollView: {
    flex: 1,
  },
  subcategoriesContainer: {
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
  subcategoryButton: {
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  subcategoryIcon: {
    marginBottom: 8,
  },
  subcategoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 6,
    lineHeight: 18,
  },
});

export default CommerceScreen;
