import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { privacyPolicy } from '../assets/privacy_policy';
import { termsOfUse } from '../assets/terms_of_use';

const { width, height } = Dimensions.get('window');

const PrivacyPolicyScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' ou 'terms'

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Documentos Legais</Text>
    </View>
  );

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'privacy' && styles.activeTabButton,
        ]}
        onPress={() => setActiveTab('privacy')}
      >
        <Text
          style={[
            styles.tabButtonText,
            activeTab === 'privacy' && styles.activeTabButtonText,
          ]}
        >
          Política de Privacidade
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'terms' && styles.activeTabButton,
        ]}
        onPress={() => setActiveTab('terms')}
      >
        <Text
          style={[
            styles.tabButtonText,
            activeTab === 'terms' && styles.activeTabButtonText,
          ]}
        >
          Termos de Uso
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    const content = activeTab === 'privacy' ? privacyPolicy : termsOfUse;
    
    return (
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.documentContainer}>
          <Text style={styles.documentText}>{content}</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        {renderTabButtons()}
        <View style={styles.contentWrapper}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 60, // Compensa o espaço do botão voltar
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 25,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#FF6B35',
  },
  contentWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
  },
  documentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    textAlign: 'justify',
    fontFamily: 'Comfortaa',
  },
});

export default PrivacyPolicyScreen;