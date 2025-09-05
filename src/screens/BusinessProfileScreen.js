import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import businessApiService from '../services/BusinessApiService';
import { useAuth } from '../contexts/AuthContext';

const BusinessProfileScreen = ({ route, navigation }) => {
  const { business: initialBusiness, category } = route.params || {};
  const [business, setBusiness] = useState(initialBusiness);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Função para recarregar os dados do negócio
  const reloadBusinessData = useCallback(async () => {
    if (!initialBusiness?.id) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Buscar dados atualizados do negócio via API
      const businesses = await businessApiService.getAllBusinesses();
      const updatedBusiness = businesses.find(b => b.id === initialBusiness.id);
      
      if (updatedBusiness) {
        setBusiness(updatedBusiness);
        console.log('✅ Dados do negócio atualizados da API:', initialBusiness.id);
      } else {
        console.log('ℹ️ Negócio não encontrado na API (usando dados locais):', initialBusiness.id);
        // Manter os dados iniciais se não encontrar na API
        setBusiness(initialBusiness);
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do negócio:', error);
      // Em caso de erro, manter os dados iniciais
      setBusiness(initialBusiness);
    } finally {
      setLoading(false);
    }
  }, [initialBusiness?.id, initialBusiness]);

  // Recarrega os dados quando a tela receber foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadBusinessData();
    });

    return unsubscribe;
  }, [navigation, initialBusiness?.id]);

  // Validação mais robusta para verificar se o negócio existe
  const isValidBusiness = business && business.id && (business.name || business.establishmentName);
  
  // Função para sincronizar dados com a API
  const handleSyncData = async () => {
    Alert.alert(
      'Sincronizar Dados',
      'Isso irá sincronizar os dados com o servidor. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              setLoading(true);
              await businessApiService.syncData();
              await reloadBusinessData();
              
              Alert.alert(
                'Sucesso',
                'Dados sincronizados com sucesso!',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Erro ao sincronizar dados:', error);
              Alert.alert('Erro', 'Falha ao sincronizar os dados. Verifique sua conexão e tente novamente.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!isValidBusiness) {
    console.log('=== DEBUG BusinessProfileScreen ===');
    console.log('Invalid business data:');
    console.log('business:', business);
    console.log('initialBusiness:', initialBusiness);
    console.log('category:', category);
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Negócio não encontrado</Text>
          <Text style={styles.errorSubText}>
            {!business ? 'Dados do negócio não disponíveis' : 
             !business.id ? 'ID do negócio inválido' :
             (!business.name && !business.establishmentName) ? 'Nome do negócio não encontrado' : 'Erro desconhecido'}
          </Text>
          <Text style={styles.helpText}>
            Se este problema persistir, pode haver dados corrompidos no armazenamento.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={reloadBusinessData}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleSyncData}>
            <Text style={styles.resetButtonText}>Sincronizar Dados</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handlePhoneCall = (phone) => {
    if (phone) {
      const phoneNumber = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleWhatsApp = (whatsapp) => {
    if (whatsapp) {
      const whatsappNumber = whatsapp.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=55${whatsappNumber}`);
    }
  };

  const handleEmail = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleSocialMedia = (url, platform) => {
    if (url) {
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (platform === 'instagram') {
          formattedUrl = `https://instagram.com/${url.replace('@', '')}`;
        } else if (platform === 'facebook') {
          formattedUrl = `https://facebook.com/${url}`;
        } else {
          formattedUrl = `https://${url}`;
        }
      }
      Linking.openURL(formattedUrl);
    }
  };

  const handleMapLocation = () => {
    if (business.address) {
      const encodedAddress = encodeURIComponent(business.address);
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      Linking.openURL(mapUrl).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o mapa');
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#e74c3c" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏢 Perfil do Negócio</Text>
        <TouchableOpacity 
          style={styles.headerEditButton} 
          onPress={() => navigation.navigate('EditBusiness', { business, category })}
        >
          <Ionicons name="pencil" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Foto e Nome em Destaque */}
        <View style={styles.profileHeader}>
          <View style={styles.photoContainer}>
            {business.profilePhoto ? (
              <Image source={{ uri: business.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Text style={styles.placeholderPhotoText}>📷</Text>
              </View>
            )}
          </View>
          <Text style={styles.businessName}>{business.name || business.establishmentName}</Text>
          {business.subcategory && (
            <Text style={styles.subcategory}>{business.subcategory}</Text>
          )}
          {business.category && (
            <Text style={styles.category}>{business.category}</Text>
          )}
        </View>

        {/* Produto/Serviço Principal */}
        {business.mainProduct && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produto/Serviço Principal</Text>
            <Text style={styles.sectionContent}>{business.mainProduct}</Text>
          </View>
        )}

        {/* Descrição */}
        {business.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.sectionContent}>{business.description}</Text>
          </View>
        )}

        {/* Localização */}
        {(business.address || business.neighborhood || business.cityState || business.zipCode) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            {business.address && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Endereço:</Text>
                <Text style={styles.sectionContent}>{business.address}</Text>
              </View>
            )}
            {business.neighborhood && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Bairro:</Text>
                <Text style={styles.sectionContent}>{business.neighborhood}</Text>
              </View>
            )}
            {business.cityState && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Cidade/Estado:</Text>
                <Text style={styles.sectionContent}>{business.cityState}</Text>
              </View>
            )}
            {business.zipCode && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>CEP:</Text>
                <Text style={styles.sectionContent}>{business.zipCode}</Text>
              </View>
            )}
            {business.address && (
              <TouchableOpacity style={styles.mapButton} onPress={handleMapLocation}>
                <Text style={styles.mapButtonIcon}>📍</Text>
                <Text style={styles.mapButtonText}>Localizar no Mapa</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Horário de Funcionamento */}
        {business.workingHours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horário de Funcionamento</Text>
            <Text style={styles.sectionContent}>{business.workingHours}</Text>
          </View>
        )}

        {/* Delivery */}
        {business.hasDelivery && (
          <View style={styles.section}>
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryText}>🚚 Faz Delivery</Text>
            </View>
          </View>
        )}

        {/* Contatos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos</Text>
          
          {business.phone && (
            <TouchableOpacity style={styles.contactButton} onPress={() => handlePhoneCall(business.phone)}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{business.phone}</Text>
            </TouchableOpacity>
          )}

          {business.whatsapp && (
            <TouchableOpacity style={styles.contactButton} onPress={() => handleWhatsApp(business.whatsapp)}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.contactIconIonicons} />
              <Text style={styles.contactText}>{business.whatsapp}</Text>
            </TouchableOpacity>
          )}

          {business.email && (
            <TouchableOpacity style={styles.contactButton} onPress={() => handleEmail(business.email)}>
              <Text style={styles.contactIcon}>📧</Text>
              <Text style={styles.contactText}>{business.email}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Redes Sociais */}
        {(business.instagram || business.facebook || business.otherSocialMedia) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redes Sociais</Text>
            
            {business.instagram && (
              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMedia(business.instagram, 'instagram')}>
                <Ionicons name="logo-instagram" size={20} color="#E4405F" style={styles.socialIconIonicons} />
                <Text style={styles.socialText}>Instagram: {business.instagram}</Text>
              </TouchableOpacity>
            )}

            {business.facebook && (
              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMedia(business.facebook, 'facebook')}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.socialIconIonicons} />
                <Text style={styles.socialText}>Facebook: {business.facebook}</Text>
              </TouchableOpacity>
            )}

            {business.otherSocialMedia && (
              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMedia(business.otherSocialMedia, 'other')}>
                <Text style={styles.socialIcon}>🌐</Text>
                <Text style={styles.socialText}>Outras Redes: {business.otherSocialMedia}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
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
  headerEditButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  photoContainer: {
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
  profilePhoto: {
    width: 350,
    height: 220,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#ffffff',
    resizeMode: 'cover',
  },
  placeholderPhoto: {
    width: 350,
    height: 220,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  placeholderPhotoText: {
    fontSize: 50,
    color: '#6c757d',
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subcategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
    textAlign: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  locationItem: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  mapButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryBadge: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  deliveryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  contactIconIonicons: {
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  socialIconIonicons: {
    marginRight: 12,
  },
  socialText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  bottomSpacing: {
    height: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorSubText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 10,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusinessProfileScreen;