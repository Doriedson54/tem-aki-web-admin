import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackButton from '../components/AnimatedBackButton';
import { getCategories } from '../services/businessService';

const CategoryCard = ({ category, onPress }) => {
  const icon = category.icon || '🏷️';
  const name = category.name || 'Categoria';
  const isIconName = typeof icon === 'string' && /^[a-z0-9-]+$/i.test(icon);

  return (
    <TouchableOpacity style={styles.cardOuter} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.cardInner}>
        <View style={styles.cardHighlight} />
        {isIconName ? (
          <Ionicons name={icon} size={34} color="#8B4513" />
        ) : (
          <Text style={styles.cardIcon}>{icon}</Text>
        )}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Erro ao carregar categorias');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const content = useMemo(() => {
    if (loading) return <Text style={styles.stateText}>Carregando categorias...</Text>;
    if (error) return <Text style={styles.stateText}>⚠️ {error}</Text>;
    if (categories.length === 0) return <Text style={styles.stateText}>Nenhuma categoria encontrada.</Text>;
    return null;
  }, [loading, error, categories.length]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <AnimatedBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Categorias</Text>
        <View style={styles.placeholder} />
      </View>

      {content ? (
        <View style={styles.stateContainer}>{content}</View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={() => navigation.navigate('CategoryBusinesses', { categoryId: item.id, categoryName: item.name })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stateContainer: {
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  stateText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  cardOuter: {
    flex: 1,
    margin: 8,
    height: 150,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
  },
  cardInner: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  cardIcon: {
    fontSize: 34,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default CategoriesScreen;
