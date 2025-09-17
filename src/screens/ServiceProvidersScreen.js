import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const ServiceProvidersScreen = ({ navigation }) => {
  const serviceCategories = [
    {
      id: 1,
      title: 'Serviços Domésticos e de Manutenção',
      icon: '🔧',
      color: '#FF6B6B',
      description: 'Limpeza, reparos, jardinagem'
    },
    {
      id: 2,
      title: 'Serviços Comerciais',
      icon: '💼',
      color: '#4ECDC4',
      description: 'Consultoria, marketing, vendas'
    },
    {
      id: 3,
      title: 'Serviços de Saúde e Bem-Estar',
      icon: '🏥',
      color: '#45B7D1',
      description: 'Médicos, terapeutas, estética'
    },
    {
      id: 4,
      title: 'Serviços Educacionais e Culturais',
      icon: '📚',
      color: '#F7DC6F',
      description: 'Aulas, cursos, eventos'
    },
    {
      id: 5,
      title: 'Serviços de Transporte',
      icon: '🚗',
      color: '#BB8FCE',
      description: 'Táxi, delivery, mudanças'
    },
    {
      id: 6,
      title: 'Serviços Digitais e de Comunicação',
      icon: '💻',
      color: '#85C1E9',
      description: 'TI, design, redes sociais'
    },
    {
      id: 7,
      title: 'Serviços Financeiros e Administrativos',
      icon: '💰',
      color: '#82E0AA',
      description: 'Contabilidade, seguros, jurídico'
    },
    {
      id: 8,
      title: 'Serviços Comunitários e Públicos',
      icon: '🏛️',
      color: '#F8C471',
      description: 'ONGs, associações, voluntariado'
    }
  ];

  const handleServicePress = (service) => {
    navigation.navigate('SubcategoryBusinesses', {
      subcategory: service.title,
      parentCategory: 'Prestação de Serviços'
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔧 Prestadores de Serviços</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Services List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.servicesContainer}
        showsVerticalScrollIndicator={false}
      >
        {serviceCategories.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceButton, { backgroundColor: service.color }]}
            onPress={() => handleServicePress(service)}
            activeOpacity={0.8}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceIcon}>{service.icon}</Text>
                <Text style={styles.serviceTitle}>{service.title}</Text>
              </View>
              <Text style={styles.serviceDescription}>{service.description}</Text>
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
    backgroundColor: '#e74c3c',
    borderBottomWidth: 3,
    borderBottomColor: '#c0392b',
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
  servicesContainer: {
    padding: 20,
  },
  serviceButton: {
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
  serviceContent: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  serviceDescription: {
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

export default ServiceProvidersScreen;