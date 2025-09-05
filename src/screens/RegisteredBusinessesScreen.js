import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';

const RegisteredBusinessItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.businessItem} onPress={() => onPress(item)}>
    <View style={styles.businessContent}>
      <View style={styles.photoContainer}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.businessPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderPhotoText}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{item.establishmentName}</Text>
        {item.subcategory && (
          <Text style={styles.subcategory}>{item.subcategory}</Text>
        )}
        {item.category && (
          <Text style={styles.category}>{item.category}</Text>
        )}
        <Text style={styles.businessAddress} numberOfLines={1}>{item.address}</Text>
        {(item.neighborhood || item.cityState) && (
          <Text style={styles.businessLocation} numberOfLines={1}>
            {item.neighborhood && item.cityState ? `${item.neighborhood}, ${item.cityState}` :
             item.neighborhood ? item.neighborhood :
             item.cityState ? item.cityState : ''}
          </Text>
        )}
        {item.phone && (
          <Text style={styles.businessPhone}>{item.phone}</Text>
        )}
      </View>
    </View>
    <Text style={styles.viewProfileText}>Ver perfil →</Text>
  </TouchableOpacity>
);

const RegisteredBusinessesScreen = ({ navigation }) => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega os negócios registrados
  const loadRegisteredBusinesses = async () => {
    try {
      setLoading(true);
      const storedRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      const registrations = storedRegistrations ? JSON.parse(storedRegistrations) : [];
      setBusinesses(registrations);
    } catch (error) {
      console.error('Erro ao carregar negócios registrados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navega para o perfil do negócio
  const handleBusinessPress = (business) => {
    console.log('=== DEBUG RegisteredBusinessesScreen ===');
    console.log('Navigating to BusinessProfile with business:', business);
    
    // Cria um objeto de categoria baseado na categoria do negócio
    const category = { 
      name: business.category || 'Categoria', 
      id: business.categoryId || business.category || '1' // Usa categoryId se disponível, senão usa category como fallback
    };
    
    console.log('Category object:', category);
    navigation.navigate('BusinessProfile', { business, category });
  };

  // Carrega os negócios quando a tela é montada ou quando retorna de outra tela
  useEffect(() => {
    loadRegisteredBusinesses();
    
    // Configura um listener para quando a tela receber foco
    const unsubscribe = navigation.addListener('focus', () => {
      loadRegisteredBusinesses();
    });
    
    // Limpa o listener quando o componente é desmontado
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Negócios Cadastrados</Text>
        <View style={styles.placeholder} />
      </View>
      
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : businesses.length > 0 ? (
        <FlatList
          data={businesses}
          renderItem={({ item }) => <RegisteredBusinessItem item={item} onPress={handleBusinessPress} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum negócio cadastrado ainda.</Text>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.navigate('GeneralRegistration')}
          >
            <Text style={styles.registerButtonText}>Cadastrar Primeiro Negócio</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 15,
  },
  businessItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  businessContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  photoContainer: {
    marginRight: 16,
  },
  businessPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  placeholderPhotoText: {
    fontSize: 20,
    color: '#6c757d',
  },
  businessInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subcategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  businessLocation: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  businessPhone: {
    fontSize: 14,
    color: '#495057',
  },
  viewProfileText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisteredBusinessesScreen;