import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import businessApiService from '../services/BusinessApiService';
import { syncService } from '../services/SyncService';
import { useAuth } from '../contexts/AuthContext';

const AddBusinessScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const { isAuthenticated, user } = useAuth();
  
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    // Validação básica
    if (!businessName.trim()) {
      Alert.alert('Erro', 'O nome do negócio é obrigatório');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Erro', 'O endereço é obrigatório');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Erro', 'O telefone é obrigatório');
      return;
    }

    // Validação de email se fornecido
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    try {
      setIsSubmitting(true);

      // Cria o objeto do novo negócio
      const newBusiness = {
        name: businessName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        description: description.trim(),
        category_id: category.id,
        owner_id: user?.id || null,
        status: 'active',
      };

      // Adiciona o negócio usando sincronização offline-first
      await syncService.createBusinessOfflineFirst(newBusiness);

      // Exibe mensagem de sucesso
      Alert.alert(
        'Sucesso',
        'Negócio cadastrado com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('CategoryBusinesses', { 
              category: category,
              refresh: true // Flag para atualizar a lista na tela anterior
            }) 
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao cadastrar negócio:', error);
      
      let errorMessage = 'Ocorreu um erro ao cadastrar o negócio. Tente novamente.';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Você precisa estar logado para cadastrar um negócio';
            break;
          case 403:
            errorMessage = 'Você não tem permissão para cadastrar negócios';
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
  }, [businessName, address, phone, email, description, category, navigation, user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>➕ Novo {category.name.slice(0, -1)}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Negócio</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Digite o nome do negócio"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Digite o endereço completo"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Digite o telefone para contato"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (opcional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o email do negócio"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva o negócio e seus serviços"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar Negócio'}
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
    backgroundColor: '#9b59b6',
    borderBottomWidth: 3,
    borderBottomColor: '#8e44ad',
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
    textAlignVertical: 'top',
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
});

export default AddBusinessScreen;