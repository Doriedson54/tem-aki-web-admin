import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import businessApiService from '../services/BusinessApiService';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../hooks/useSync';
import SyncStatusIndicator from '../components/SyncStatusIndicator';

const EditBusinessScreen = ({ route, navigation }) => {
  const { business, category } = route.params;
  const { user } = useAuth();
  const { updateBusinessOffline, deleteBusinessOffline, syncStatus } = useSync();
  
  const [businessName, setBusinessName] = useState(business.establishmentName || business.name || '');
  const [address, setAddress] = useState(business.address || '');
  const [neighborhood, setNeighborhood] = useState(business.neighborhood || '');
  const [cityState, setCityState] = useState(business.cityState || '');
  const [zipCode, setZipCode] = useState(business.zipCode || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [whatsapp, setWhatsapp] = useState(business.whatsapp || '');
  const [email, setEmail] = useState(business.email || '');
  const [mainProduct, setMainProduct] = useState(business.mainProduct || '');
  const [description, setDescription] = useState(business.description || '');
  const [workingHours, setWorkingHours] = useState(business.workingHours || '');
  const [instagram, setInstagram] = useState(business.instagram || '');
  const [facebook, setFacebook] = useState(business.facebook || '');
  const [otherSocialMedia, setOtherSocialMedia] = useState(business.otherSocialMedia || '');
  const [hasDelivery, setHasDelivery] = useState(business.hasDelivery || false);
  const [profilePhoto, setProfilePhoto] = useState(business.profilePhoto || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setProfilePhoto(result.assets[0].uri);
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
        setProfilePhoto(result.assets[0].uri);
        Alert.alert('Sucesso', 'Foto selecionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao acessar galeria:', error);
      Alert.alert('Erro', `Erro ao acessar galeria: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    // Validação básica
    if (!businessName.trim()) {
      Alert.alert('Erro', 'O nome do negócio é obrigatório');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Erro', 'O endereço é obrigatório');
      return;
    }

    if (!neighborhood.trim()) {
      Alert.alert('Erro', 'O bairro é obrigatório');
      return;
    }

    if (!cityState.trim()) {
      Alert.alert('Erro', 'A cidade/estado é obrigatória');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Erro', 'O telefone é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('=== DEBUG EditBusinessScreen ===');
      console.log('Original business:', business);
      console.log('Category:', category);

      // Cria o objeto do negócio atualizado
      const updatedBusiness = {
        ...business,
        establishmentName: businessName.trim(),
        name: businessName.trim(),
        address: address.trim(),
        neighborhood: neighborhood.trim(),
        cityState: cityState.trim(),
        zipCode: zipCode.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        mainProduct: mainProduct.trim(),
        description: description.trim(),
        workingHours: workingHours.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        otherSocialMedia: otherSocialMedia.trim(),
        hasDelivery: hasDelivery,
        profilePhoto: profilePhoto,
      };
      
      console.log('Updated business object:', updatedBusiness);
      console.log('Calling updateBusiness with:', {
        categoryId: category.id,
        businessId: business.id,
        updatedBusiness: updatedBusiness
      });

      // Atualiza o negócio usando sincronização offline-first
      const result = await updateBusinessOffline(business.id, updatedBusiness);
      console.log('Update result:', result);

      // Exibe mensagem de sucesso
      Alert.alert(
        'Sucesso',
        'Negócio atualizado com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          },
        ]
      );
    } catch (error) {
      console.error('=== ERROR in EditBusinessScreen ===');
      console.error('Error details:', error);
      
      let errorMessage = 'Ocorreu um erro ao atualizar o negócio. Tente novamente.';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Você precisa estar logado para editar negócios';
            break;
          case 403:
            errorMessage = 'Você não tem permissão para editar este negócio';
            break;
          case 404:
            errorMessage = 'Negócio não encontrado';
            break;
          case 422:
            errorMessage = 'Dados inválidos. Verifique as informações e tente novamente';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o negócio "${businessName}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);

    try {
      console.log('=== DEBUG EditBusinessScreen confirmDelete ===');
      console.log('Deleting business:', business);
      console.log('Category:', category);

      // Deleta o negócio usando sincronização offline-first
      const result = await deleteBusinessOffline(business.id);
      console.log('Delete result:', result);

      // Exibe mensagem de sucesso
      Alert.alert(
        'Sucesso',
        'Negócio excluído com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Volta para a tela anterior (lista de negócios)
              navigation.goBack();
            }
          },
        ]
      );
    } catch (error) {
      console.error('=== ERROR in EditBusinessScreen confirmDelete ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Erro', `Ocorreu um erro ao excluir o negócio: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#f39c12" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✏️ Editar Negócio</Text>
        <SyncStatusIndicator style={styles.syncIndicator} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* Foto do Perfil */}
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionTitle}>Foto do Perfil</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoSelect}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#666" />
                <Text style={styles.photoText}>Adicionar/Alterar Foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Negócio *</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Digite o nome do negócio"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço (Rua e Número) *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Ex: Rua das Flores, 123"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bairro *</Text>
          <TextInput
            style={styles.input}
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder="Digite o bairro"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cidade/Estado *</Text>
          <TextInput
            style={styles.input}
            value={cityState}
            onChangeText={setCityState}
            placeholder="Ex: São Paulo/SP"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={styles.input}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="00000-000"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Digite o telefone"
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
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="Digite o WhatsApp"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Produto/Serviço Principal</Text>
          <TextInput
            style={styles.input}
            value={mainProduct}
            onChangeText={setMainProduct}
            placeholder="Digite o produto ou serviço principal"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva seu negócio"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Horário de Funcionamento</Text>
          <TextInput
            style={styles.input}
            value={workingHours}
            onChangeText={setWorkingHours}
            placeholder="Ex: Segunda a Sexta: 8h às 18h"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelWithIcon}>
            <Ionicons name="logo-instagram" size={20} color="#E4405F" />
            <Text style={styles.label}>Instagram</Text>
          </View>
          <TextInput
            style={styles.input}
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@seuinstagram ou link completo"
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
            value={facebook}
            onChangeText={setFacebook}
            placeholder="Nome da página ou link completo"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Outras Redes Sociais</Text>
          <TextInput
            style={styles.input}
            value={otherSocialMedia}
            onChangeText={setOtherSocialMedia}
            placeholder="Site, LinkedIn, etc."
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <TouchableOpacity 
            style={[styles.deliveryButton, hasDelivery && styles.deliveryButtonActive]}
            onPress={() => setHasDelivery(!hasDelivery)}
          >
            <Text style={[styles.deliveryButtonText, hasDelivery && styles.deliveryButtonTextActive]}>
              {hasDelivery ? '✅' : '⬜'} Faz Delivery
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, isSubmitting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={isSubmitting}
        >
          <Text style={styles.deleteButtonText}>
            🗑️ Excluir Negócio
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
  },
  deliveryButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  deliveryButtonActive: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  deliveryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
    textAlign: 'center',
  },
  deliveryButtonTextActive: {
    color: '#155724',
  },
  submitButton: {
    backgroundColor: '#A0522D',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#C4A484',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonDisabled: {
    backgroundColor: '#f5c6cb',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  photoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#f39c12',
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  syncIndicator: {
    marginRight: 8,
  },
});

export default EditBusinessScreen;