import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import temAkiLogo from '../assets/celularcomlogo.png';
import logoGif from '../assets/logo.gif';
import SideMenu from '../components/SideMenu';

const HomeScreen = ({ navigation }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleMenu = useCallback(() => {
    setIsMenuVisible(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#4A90E2" translucent={false} />
      
      {/* Menu lateral */}
      <SideMenu 
        isVisible={isMenuVisible} 
        onClose={closeMenu} 
        navigation={navigation} 
      />
      
      <View style={styles.whiteBackground}>
        <StatusBar style="light" />
        
        {/* Header com logo e configurações */}
        <View style={styles.header}>
          {/* Botão hambúrguer */}
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={toggleMenu}
          >
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
          
          {/* Logo no centro */}
          <View style={styles.logoContainer}>
            <Image source={logoGif} style={styles.logoImage} />
          </View>
          
          {/* Botão de configurações no canto superior direito */}
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminLogin')}
          >
            <Ionicons name="settings-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Conteúdo principal */}
        <View style={styles.mainContent}>
          <View style={styles.topContent}>
            {/* Imagem do smartphone com logo */}
            <View style={styles.phoneContainer}>
              <Image source={temAkiLogo} style={styles.phoneImage} />
            </View>
            
            {/* Texto descritivo */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                Os <Text style={styles.highlightText}>negócios</Text> do seu{' '}
                <Text style={styles.accentText}>bairro</Text> na sua{' '}
                <Text style={styles.emphasisText}>mão</Text>
              </Text>
            </View>
          </View>
          
          {/* Botão de entrada */}
          <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity
              style={styles.enterButton}
              onPress={() => navigation.navigate('CategoriesMenu')}
            >
              <Text style={styles.enterButtonText}>Clique para Entrar!</Text>
            </TouchableOpacity>
          </View>
        </View>
       </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
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
  descriptionText: {
     fontSize: 20,
     color: '#2C3E50',
     textAlign: 'center',
     fontWeight: '600',
     lineHeight: 28,
     letterSpacing: 0.5,
     fontFamily: 'Comfortaa',
   },
  highlightText: {
     color: '#E67E22',
     fontWeight: '700',
     fontSize: 22,
     fontFamily: 'Comfortaa',
   },
  accentText: {
     color: '#3498DB',
     fontWeight: '700',
     fontSize: 22,
     fontFamily: 'Comfortaa',
   },
  emphasisText: {
     color: '#E74C3C',
     fontWeight: '700',
     fontSize: 22,
     textShadowColor: 'rgba(231, 76, 60, 0.3)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
     fontFamily: 'Comfortaa',
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
  },
  enterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }

});

export default HomeScreen;