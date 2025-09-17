import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// import { Ionicons } from '@expo/vector-icons';

const CategoriesMenuScreen = ({ navigation }) => {
  const categories = [
    {
      id: 1,
      title: 'Prestação de Serviços',
      icon: '🔧',
      color: '#4A90E2',
      screen: 'ServiceProviders'
    },
    {
      id: 2,
      title: 'Comércio',
      icon: '🛍️',
      color: '#7ED321',
      screen: 'Commerce'
    },
    {
      id: 3,
      title: 'Escolas',
      icon: '🎓',
      color: '#F5A623',
      screen: 'Schools'
    },
    {
      id: 7,
      title: 'Instituições Públicas',
      icon: '🏛️',
      color: '#D0021B',
      screen: 'CategoryBusinesses'
    },
    {
      id: 5,
      title: 'Instituições Comunitárias',
      icon: '🤝',
      color: '#9013FE',
      screen: 'CategoryBusinesses'
    },
    {
      id: 6,
      title: 'Instituições Religiosas',
      icon: '⛪',
      color: '#50E3C2',
      screen: 'CategoryBusinesses'
    }
  ];

  const handleCategoryPress = (category) => {
    navigation.navigate(category.screen, {
      categoryName: category.title,
      categoryId: category.id
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 Escolha o que precisa</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Categories Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.categoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryButton, { backgroundColor: category.color }]}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </TouchableOpacity>
        ))}
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  headerBackButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    width: 40,
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
  categoryButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
});

export default CategoriesMenuScreen;