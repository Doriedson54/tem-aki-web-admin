import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import businessApiService from '../services/BusinessApiService';
import { syncService } from '../services/SyncService';

const REGISTRATIONS_STORAGE_KEY = '@NegociosDoBairro:registrations';

const GeneralRegistrationScreen = ({ navigation }) => {
  const { logoutAdmin, login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    establishmentName: '',
    category: '',
    subcategory: '',
    mainProduct: '',
    description: '',
    profilePhoto: null,
    address: '',
    neighborhood: '',
    cityState: '',
    zipCode: '',
    phone: '',
    whatsapp: '',
    email: '',
    workingHours: '',
    instagram: '',
    facebook: '',
    otherSocialMedia: '',
    hasDelivery: false,
  });

  const [subcategories, setSubcategories] = useState([]);
  
  // Função para obter cores baseadas na categoria
  const getCategoryColors = (category) => {
    const colorSchemes = {
      'Instituições Públicas': {
        primary: '#D0021B', // Vermelho do botão do CategoriesMenuScreen
        secondary: '#e53e3e',
        accent: '#fed7d7',
        border: '#D0021B'
      },
      'Instituições Comunitárias': {
        primary: '#9013FE', // Roxo do botão do CategoriesMenuScreen
        secondary: '#a855f7',
        accent: '#f3e8ff',
        border: '#9013FE'
      },
      'Instituições Religiosas': {
        primary: '#50E3C2', // Verde água do botão do CategoriesMenuScreen
        secondary: '#4dd0b1',
        accent: '#e6fffa',
        border: '#50E3C2'
      }
    };
    
    return colorSchemes[category] || {
      primary: '#2c3e50',
      secondary: '#3498db',
      accent: '#e8f4fd',
      border: '#3498db'
    };
  };
  
  // Obtém as cores baseadas na categoria selecionada
  const currentColors = getCategoryColors(formData.category);

  const categories = [
    'Prestação de Serviços',
    'Comércio',
    'Escolas',
    'Instituições Públicas',
    'Instituições Comunitárias',
    'Instituições Religiosas'
  ];

  // Subcategorias baseadas nas categorias existentes no sistema
  const subcategoriesData = {
    'Prestação de Serviços': [
      { id: 1, title: 'Serviços Domésticos e de Manutenção' },
      { id: 2, title: 'Serviços Comerciais' },
      { id: 3, title: 'Serviços de Saúde e Bem-Estar' },
      { id: 4, title: 'Serviços Educacionais e Culturais' },
      { id: 5, title: 'Serviços de Transporte' },
      { id: 6, title: 'Serviços Digitais e de Comunicação' },
      { id: 7, title: 'Serviços Financeiros e Administrativos' },
      { id: 8, title: 'Serviços Comunitários e Públicos' }
    ],
    'Comércio': [
      { id: 1, title: 'Alimentação e Bebidas' },
      { id: 2, title: 'Automotivo e Acessórios' },
      { id: 3, title: 'Beleza e Cuidados Pessoais' },
      { id: 4, title: 'Casa, Construção e Decoração' },
      { id: 5, title: 'Educação e Cultura' },
      { id: 6, title: 'Moda e Acessórios' },
      { id: 7, title: 'Pets e outros Animais' },
      { id: 8, title: 'Utilidades e Variedades' }
    ],
    'Escolas': [],
    'Instituições Públicas': [
      { id: 1, title: 'Prefeitura' },
      { id: 2, title: 'Câmara Municipal' },
      { id: 3, title: 'Cartório' },
      { id: 4, title: 'Delegacia de Polícia' },
      { id: 5, title: 'Posto de Saúde' },
      { id: 6, title: 'Hospital Público' },
      { id: 7, title: 'Escola Pública' },
      { id: 8, title: 'Biblioteca Pública' },
      { id: 9, title: 'Correios' },
      { id: 10, title: 'Receita Federal' },
      { id: 11, title: 'INSS' },
      { id: 12, title: 'Detran' }
    ],
    'Instituições Comunitárias': [
      { id: 1, title: 'Centro Comunitário' },
      { id: 2, title: 'Associação de Moradores' },
      { id: 3, title: 'ONG' },
      { id: 4, title: 'Cooperativa' },
      { id: 5, title: 'Sindicato' },
      { id: 6, title: 'Fundação' },
      { id: 7, title: 'Instituto Social' },
      { id: 8, title: 'Casa de Apoio' },
      { id: 9, title: 'Centro Cultural' },
      { id: 10, title: 'Grupo de Voluntários' }
    ],
    'Instituições Religiosas': [
      { id: 1, title: 'Igreja Católica' },
      { id: 2, title: 'Igreja Evangélica' },
      { id: 3, title: 'Igreja Pentecostal' },
      { id: 4, title: 'Igreja Batista' },
      { id: 5, title: 'Igreja Metodista' },
      { id: 6, title: 'Igreja Presbiteriana' },
      { id: 7, title: 'Igreja Adventista' },
      { id: 8, title: 'Centro Espírita' },
      { id: 9, title: 'Terreiro de Umbanda' },
      { id: 10, title: 'Terreiro de Candomblé' },
      { id: 11, title: 'Mesquita' },
      { id: 12, title: 'Sinagoga' },
      { id: 13, title: 'Templo Budista' },
      { id: 14, title: 'Centro de Meditação' }
    ]
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Quando a categoria muda, atualiza as subcategorias disponíveis
    if (field === 'category') {
      const availableSubcategories = subcategoriesData[value] || [];
      setSubcategories(availableSubcategories);
      // Limpa a subcategoria selecionada quando a categoria muda
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handlePhotoSelect = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Funcionalidade Indisponível',
        'A seleção de fotos não está disponível na versão web. Use um dispositivo móvel para acessar câmera e galeria.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Selecionar Foto',
      'Escolha uma opção:',
      [
        {
          text: 'Câmera',
          onPress: () => openCamera(),
        },
        {
          text: 'Galeria',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      console.log('Solicitando permissão de câmera...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Status da permissão de câmera:', permissionResult.status);
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permissão Negada', 
          'Para usar a câmera, você precisa permitir o acesso nas configurações do seu dispositivo.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Abrindo câmera...');
      const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      console.log('Resultado da câmera:', result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleInputChange('profilePhoto', result.assets[0].uri);
        Alert.alert('Sucesso', 'Foto capturada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', `Erro ao abrir câmera: ${error.message}`);
    }
  };

  const openGallery = async () => {
    try {
      console.log('Solicitando permissão de galeria...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Status da permissão de galeria:', permissionResult.status);
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permissão Negada', 
          'Para acessar a galeria, você precisa permitir o acesso nas configurações do seu dispositivo.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Abrindo galeria...');
      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
       });

      console.log('Resultado da galeria:', result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleInputChange('profilePhoto', result.assets[0].uri);
        Alert.alert('Sucesso', 'Foto selecionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao acessar galeria:', error);
      Alert.alert('Erro', `Erro ao acessar galeria: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    // Validação básica
    if (!formData.establishmentName.trim()) {
      Alert.alert('Erro', 'Nome do estabelecimento é obrigatório.');
      return;
    }
    
    if (!formData.category) {
      Alert.alert('Erro', 'Categoria é obrigatória.');
      return;
    }
    
    if (!formData.subcategory && subcategories.length > 0) {
      Alert.alert('Erro', 'Subcategoria é obrigatória.');
      return;
    }
    
    if (!formData.mainProduct.trim()) {
      Alert.alert('Erro', 'Produto/Serviço principal é obrigatório.');
      return;
    }
    
    if (!formData.address.trim()) {
      Alert.alert('Erro', 'Endereço é obrigatório.');
      return;
    }
    
    if (!formData.neighborhood.trim()) {
      Alert.alert('Erro', 'Bairro é obrigatório.');
      return;
    }
    
    if (!formData.cityState.trim()) {
      Alert.alert('Erro', 'Cidade/Estado é obrigatório.');
      return;
    }

    try {
      // Prepara os dados para envio à API
      const businessData = {
        name: formData.establishmentName,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description,
        main_product: formData.mainProduct,
        address: formData.address,
        neighborhood: formData.neighborhood,
        city_state: formData.cityState,
        zip_code: formData.zipCode,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        working_hours: formData.workingHours,
        instagram: formData.instagram,
        facebook: formData.facebook,
        other_social_media: formData.otherSocialMedia,
        has_delivery: formData.hasDelivery,
        profile_photo: formData.profilePhoto
      };

      let apiSuccess = false;
      let apiError = null;

      // Tenta enviar para a API primeiro
      try {
        // Verifica se está autenticado, se não, tenta fazer login automático
        if (!isAuthenticated) {
          console.log('Usuário não autenticado, tentando login automático...');
          const loginResult = await login('admin', 'admin123');
          if (!loginResult.success) {
            throw new Error('Falha na autenticação automática');
          }
        }
        
        await syncService.createBusinessOfflineFirst(businessData);
        apiSuccess = true;
        console.log('Negócio enviado para API com sucesso');
      } catch (error) {
        console.error('Erro ao enviar para API:', error);
        apiError = error;
      }

      // Salva localmente como backup (sempre)
      const existingRegistrations = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      const registrations = existingRegistrations ? JSON.parse(existingRegistrations) : [];
      
      const newRegistration = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        syncedToApi: apiSuccess
      };
      
      registrations.push(newRegistration);
      await AsyncStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
      
      // Mensagem de sucesso baseada no resultado da API
      const successMessage = apiSuccess 
        ? 'Cadastro realizado e enviado para o servidor com sucesso!' 
        : 'Cadastro salvo localmente. Será sincronizado quando houver conexão.';
      
      const alertTitle = apiSuccess ? 'Sucesso' : 'Salvo Localmente';
      
      Alert.alert(
        alertTitle, 
        successMessage,
        [
          {
            text: 'Novo Cadastro',
            onPress: () => {
              // Limpa o formulário
              setFormData({
                establishmentName: '',
                category: '',
                subcategory: '',
                mainProduct: '',
                description: '',
                profilePhoto: null,
                address: '',
                neighborhood: '',
                cityState: '',
                zipCode: '',
                phone: '',
                whatsapp: '',
                email: '',
                workingHours: '',
                instagram: '',
                facebook: '',
                otherSocialMedia: '',
                hasDelivery: false,
              });
            }
          }
        ]
      );
      
      // Se houve erro na API, loga para debug
      if (apiError) {
        console.warn('Cadastro salvo localmente devido a erro na API:', apiError.message);
      }
    } catch (error) {
      console.error('Erro ao salvar cadastro:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cadastro. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Deseja sair da área administrativa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logoutAdmin();
            navigation.navigate('Home');
          }
        }
      ]
    );
  };

  return (
    <ProtectedRoute navigation={navigation}>
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentColors.primary, borderBottomColor: currentColors.border }]}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Cadastro Geral</Text>
        <TouchableOpacity 
          style={styles.headerLogoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Foto do Perfil */}
        <View style={[styles.section, { borderLeftColor: currentColors.border }]}>
          <Text style={styles.sectionTitle}>Foto do Perfil</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoSelect}>
            {formData.profilePhoto ? (
              <Image source={{ uri: formData.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#666" />
                <Text style={styles.photoText}>Adicionar Foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Informações Básicas */}
        <View style={[styles.section, { borderLeftColor: currentColors.border }]}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Estabelecimento *</Text>
            <TextInput
              style={styles.input}
              value={formData.establishmentName}
              onChangeText={(value) => handleInputChange('establishmentName', value)}
              placeholder="Digite o nome do estabelecimento"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                style={styles.picker}
              >
                <Picker.Item label="Selecione uma categoria" value="" />
                {categories.map((category, index) => (
                  <Picker.Item key={index} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>

          {subcategories.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subcategoria *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.subcategory}
                  onValueChange={(value) => handleInputChange('subcategory', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione uma subcategoria" value="" />
                  {subcategories.map((subcategory) => (
                    <Picker.Item key={subcategory.id} label={subcategory.title} value={subcategory.title} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Produto/Serviço Principal *</Text>
            <TextInput
              style={styles.input}
              value={formData.mainProduct}
              onChangeText={(value) => handleInputChange('mainProduct', value)}
              placeholder="Ex: Corte de cabelo, Venda de roupas, etc."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição dos Produtos/Serviços</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Descreva os produtos ou serviços oferecidos"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Localização e Contato */}
        <View style={[styles.section, { borderLeftColor: currentColors.border }]}>
          <Text style={styles.sectionTitle}>Localização e Contato</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço (Rua e Número) *</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Ex: Rua das Flores, 123"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro *</Text>
            <TextInput
              style={styles.input}
              value={formData.neighborhood}
              onChangeText={(value) => handleInputChange('neighborhood', value)}
              placeholder="Digite o bairro"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade/Estado *</Text>
            <TextInput
              style={styles.input}
              value={formData.cityState}
              onChangeText={(value) => handleInputChange('cityState', value)}
              placeholder="Ex: São Paulo/SP"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP</Text>
            <TextInput
              style={styles.input}
              value={formData.zipCode}
              onChangeText={(value) => handleInputChange('zipCode', value)}
              placeholder="00000-000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="(00) 0000-0000"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.label}>WhatsApp</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.whatsapp}
              onChangeText={(value) => handleInputChange('whatsapp', value)}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-Mail</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="exemplo@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Horário de Funcionamento</Text>
            <TextInput
              style={styles.input}
              value={formData.workingHours}
              onChangeText={(value) => handleInputChange('workingHours', value)}
              placeholder="Ex: Segunda a Sexta: 8h às 18h"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Redes Sociais e Serviços Extras */}
        <View style={[styles.section, { borderLeftColor: currentColors.border }]}>
          <Text style={styles.sectionTitle}>Redes Sociais e Serviços Extras</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="logo-instagram" size={20} color="#E4405F" />
              <Text style={styles.label}>Instagram</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.instagram}
              onChangeText={(value) => handleInputChange('instagram', value)}
              placeholder="@seuinstagram"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              <Text style={styles.label}>Facebook</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.facebook}
              onChangeText={(value) => handleInputChange('facebook', value)}
              placeholder="facebook.com/seuperfil"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Outra Rede Social</Text>
            <TextInput
              style={styles.input}
              value={formData.otherSocialMedia}
              onChangeText={(value) => handleInputChange('otherSocialMedia', value)}
              placeholder="Link ou usuário de outra rede social"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Oferece Serviço de Entrega (Delivery)</Text>
            <View style={styles.deliveryContainer}>
              <TouchableOpacity 
                style={[
                  styles.deliveryOption, 
                  formData.hasDelivery === true && { borderColor: currentColors.border, backgroundColor: currentColors.accent }
                ]}
                onPress={() => handleInputChange('hasDelivery', true)}
              >
                <Text style={[
                  styles.deliveryText,
                  formData.hasDelivery === true && { color: currentColors.primary }
                ]}>Sim</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.deliveryOption, 
                  formData.hasDelivery === false && { borderColor: currentColors.border, backgroundColor: currentColors.accent }
                ]}
                onPress={() => handleInputChange('hasDelivery', false)}
              >
                <Text style={[
                  styles.deliveryText,
                  formData.hasDelivery === false && { color: currentColors.primary }
                ]}>Não</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: currentColors.primary }]} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Cadastrar Estabelecimento</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
    </ProtectedRoute>
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
    backgroundColor: '#2c3e50',
    borderBottomWidth: 3,
    borderBottomColor: '#3498db',
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
  headerLogoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderStyle: 'dashed',
  },
  photoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  deliveryContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  deliverySelected: {
    borderColor: '#3498db',
    backgroundColor: '#e8f4fd',
  },
  deliveryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deliveryTextSelected: {
    color: '#3498db',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});

export default GeneralRegistrationScreen;