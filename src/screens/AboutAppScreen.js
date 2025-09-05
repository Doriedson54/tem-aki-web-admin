import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import appInfo from '../assets/app_info';

const { width, height } = Dimensions.get('window');

const AboutAppScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('geral');

  const renderGeneralInfo = useCallback(() => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Informações Gerais</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Nome:</Text>
        <Text style={styles.infoValue}>{appInfo.name}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Versão:</Text>
        <Text style={styles.infoValue}>{appInfo.version}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Descrição:</Text>
        <Text style={styles.infoValue}>{appInfo.description}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Desenvolvedor:</Text>
        <Text style={styles.infoValue}>{appInfo.developer}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Data de Lançamento:</Text>
        <Text style={styles.infoValue}>{appInfo.releaseDate}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Última Atualização:</Text>
        <Text style={styles.infoValue}>{appInfo.lastUpdate}</Text>
      </View>
    </View>
  ), []);

  const renderCompatibility = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Compatibilidade</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Plataformas Suportadas:</Text>
        {appInfo.compatibility.platforms.map((platform, index) => (
          <Text key={index} style={styles.listItem}>• {platform}</Text>
        ))}
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Android Mínimo:</Text>
        <Text style={styles.infoValue}>{appInfo.compatibility.minAndroidVersion}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>iOS Mínimo:</Text>
        <Text style={styles.infoValue}>{appInfo.compatibility.minIOSVersion}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Navegadores Web:</Text>
        {appInfo.compatibility.webBrowsers.map((browser, index) => (
          <Text key={index} style={styles.listItem}>• {browser}</Text>
        ))}
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Funcionalidades</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Principais Recursos:</Text>
        {appInfo.features.map((feature, index) => (
          <Text key={index} style={styles.listItem}>• {feature}</Text>
        ))}
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Categorias Disponíveis:</Text>
        {appInfo.categories.map((category, index) => (
          <Text key={index} style={styles.listItem}>• {category}</Text>
        ))}
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Estatísticas:</Text>
        <Text style={styles.listItem}>• {appInfo.stats.totalBusinesses}</Text>
        <Text style={styles.listItem}>• {appInfo.stats.categories}</Text>
        <Text style={styles.listItem}>• {appInfo.stats.subcategories}</Text>
        <Text style={styles.listItem}>• {appInfo.stats.coverage}</Text>
      </View>
    </View>
  );

  const renderTechnical = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Informações Técnicas</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Tecnologias Utilizadas:</Text>
        <Text style={styles.listItem}>• Framework: {appInfo.technologies.framework}</Text>
        <Text style={styles.listItem}>• Plataforma: {appInfo.technologies.platform}</Text>
        <Text style={styles.listItem}>• Navegação: {appInfo.technologies.navigation}</Text>
        <Text style={styles.listItem}>• Armazenamento: {appInfo.technologies.storage}</Text>
        <Text style={styles.listItem}>• Interface: {appInfo.technologies.ui}</Text>
        <Text style={styles.listItem}>• Gradientes: {appInfo.technologies.gradients}</Text>
        <Text style={styles.listItem}>• Fontes: {appInfo.technologies.fonts}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Requisitos do Sistema:</Text>
        <Text style={styles.listItem}>• {appInfo.systemRequirements.storage}</Text>
        <Text style={styles.listItem}>• {appInfo.systemRequirements.ram}</Text>
        <Text style={styles.listItem}>• {appInfo.systemRequirements.internet}</Text>
        <Text style={styles.listItem}>• {appInfo.systemRequirements.permissions}</Text>
      </View>
    </View>
  );

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'geral':
        return renderGeneralInfo();
      case 'compatibilidade':
        return renderCompatibility();
      case 'funcionalidades':
        return renderFeatures();
      case 'tecnico':
        return renderTechnical();
      default:
        return renderGeneralInfo();
    }
  }, [activeTab, renderGeneralInfo]);

  return (
    <LinearGradient
      colors={['#FF8C00', '#FFA500', '#FFB84D']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre o Aplicativo</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'geral' && styles.activeTab]}
          onPress={() => setActiveTab('geral')}
        >
          <Text style={[styles.tabText, activeTab === 'geral' && styles.activeTabText]}>
            Geral
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'compatibilidade' && styles.activeTab]}
          onPress={() => setActiveTab('compatibilidade')}
        >
          <Text style={[styles.tabText, activeTab === 'compatibilidade' && styles.activeTabText]}>
            Compatibilidade
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'funcionalidades' && styles.activeTab]}
          onPress={() => setActiveTab('funcionalidades')}
        >
          <Text style={[styles.tabText, activeTab === 'funcionalidades' && styles.activeTabText]}>
            Recursos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tecnico' && styles.activeTab]}
          onPress={() => setActiveTab('tecnico')}
        >
          <Text style={[styles.tabText, activeTab === 'tecnico' && styles.activeTabText]}>
            Técnico
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderContent()}
        
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>{appInfo.license.copyright}</Text>
          <Text style={styles.footerText}>{appInfo.license.type}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FF8C00',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 10,
  },
  footerInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default AboutAppScreen;