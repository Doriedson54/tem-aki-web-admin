import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const CommerceScreen = ({ navigation }) => {
  const commerceCategories = [
    {
      id: 1,
      title: 'Alimentação e Bebidas',
      icon: '🍽️',
      color: '#FF6B6B',
      description: 'Restaurantes, bares, mercados'
    },
    {
      id: 2,
      title: 'Automotivo e Acessórios',
      icon: '🚗',
      color: '#4ECDC4',
      description: 'Oficinas, peças, combustível'
    },
    {
      id: 3,
      title: 'Beleza e Cuidados Pessoais',
      icon: '💄',
      color: '#45B7D1',
      description: 'Salões, cosméticos, farmácias'
    },
    {
      id: 4,
      title: 'Casa, Construção e Decoração',
      icon: '🏠',
      color: '#F7DC6F',
      description: 'Materiais, móveis, decoração'
    },
    {
      id: 5,
      title: 'Educação e Cultura',
      icon: '📖',
      color: '#BB8FCE',
      description: 'Livrarias, papelarias, cursos'
    },
    {
      id: 6,
      title: 'Moda e Acessórios',
      icon: '👗',
      color: '#85C1E9',
      description: 'Roupas, calçados, joias'
    },
    {
      id: 7,
      title: 'Pets e outros Animais',
      icon: '🐕',
      color: '#82E0AA',
      description: 'Pet shops, veterinárias, rações'
    },
    {
      id: 8,
      title: 'Utilidades e Variedades',
      icon: '🛒',
      color: '#F8C471',
      description: 'Lojas gerais, presentes, diversos'
    }
  ];

  const handleCommercePress = (commerce) => {
    navigation.navigate('SubcategoryBusinesses', {
      subcategory: commerce.title,
      parentCategory: 'Comércio'
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#27ae60" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛍️ Comércio</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Commerce Categories List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.categoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {commerceCategories.map((commerce) => (
          <TouchableOpacity
            key={commerce.id}
            style={[styles.commerceButton, { backgroundColor: commerce.color }]}
            onPress={() => handleCommercePress(commerce)}
            activeOpacity={0.8}
          >
            <View style={styles.commerceContent}>
              <View style={styles.commerceHeader}>
                <Text style={styles.commerceIcon}>{commerce.icon}</Text>
                <Text style={styles.commerceTitle}>{commerce.title}</Text>
              </View>
              <Text style={styles.commerceDescription}>{commerce.description}</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
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
    backgroundColor: '#27ae60',
    borderBottomWidth: 3,
    borderBottomColor: '#229954',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  backButtonText: {
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
  },
  commerceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
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
  commerceContent: {
    flex: 1,
  },
  commerceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commerceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  commerceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  commerceDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 36,
    lineHeight: 18,
  },
  arrowIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CommerceScreen;