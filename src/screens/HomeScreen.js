import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const temAkiLogo = require('../assets/tem_aki_background.png');
const tabSemFundo = require('../assets/TABsemfundo.png');
const logoSemFundo = require('../assets/logosemfundo.png');
const comercioBairro = require('../assets/comerciobairro.jpg');
import SideMenu from '../components/SideMenu';
import { syncService } from '../services/SyncService';

const HomeScreen = ({ navigation }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Inicializar sincronização quando o app carrega
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Iniciando sincronização automática...');
        await syncService.autoSync();
        console.log('Sincronização inicial concluída');
      } catch (error) {
        console.error('Erro na sincronização inicial:', error);
      }
    };

    initializeApp();
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuVisible(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const navigateToCategories = useCallback(() => {
    navigation.navigate('CategoriesMenu');
  }, [navigation]);

  const navigateToAdmin = useCallback(() => {
    navigation.navigate('AdminLogin');
  }, [navigation]);

  const navigateToSearch = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  // Memoiza o estilo do botão para evitar re-criações
  const buttonContainerStyle = useMemo(() => [
    styles.buttonContainer, 
    { paddingBottom: Math.max(insets.bottom, 20) }
  ], [insets.bottom]);
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.statusBarBackground} />
      
      <ImageBackground 
        source={comercioBairro} 
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <SideMenu 
          isVisible={isMenuVisible} 
          onClose={closeMenu}
          navigation={navigation}
        />
        
        <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        
        <View style={styles.headerLogoContainer}>
          <Image source={tabSemFundo} style={styles.headerLogoImage} />
        </View>
        
        <View style={styles.rightButtons}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={navigateToSearch}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={navigateToAdmin}
          >
            <Text style={styles.adminButtonText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <Image source={logoSemFundo} style={styles.centerImage} />
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Tenha os negócios do seu bairro na sua mão
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.enterButton}
          onPress={navigateToCategories}
        >
          <Text style={styles.enterButtonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.3,
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  headerLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerLogoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  centerImage: {
    width: 300,
    height: 400,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: '#D2691E',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hamburgerButton: {
    backgroundColor: '#D2691E',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginVertical: 1.5,
    borderRadius: 1,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    fontSize: 20,
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  topContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  phoneContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  phoneImage: {
    width: 280,
    height: 500,
    resizeMode: 'contain',
  },
  descriptionContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  descriptionContainer: {
     backgroundColor: 'rgba(139, 69, 19, 0.3)',
     paddingHorizontal: 20,
     paddingVertical: 15,
     borderRadius: 15,
     marginHorizontal: 20,
     marginBottom: 20,
     borderWidth: 1,
     borderColor: 'rgba(139, 69, 19, 0.5)',
   },
   descriptionText: {
     fontSize: 24,
     textAlign: 'center',
     fontWeight: 'bold',
     lineHeight: 32,
     letterSpacing: 0.5,
     fontFamily: 'Caprasimo-Regular',
     color: '#8B4513',
   },

  enterButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 30,
    marginBottom: 20,
    marginHorizontal: 20,
    minWidth: 200,
  },
  enterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsIcon: {
    fontSize: 28,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#4A90E2',
    zIndex: -1,
  }

});

export default HomeScreen;