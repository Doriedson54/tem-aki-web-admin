import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HamburgerMenu from '../components/HamburgerMenu';

const comercioBairro = require('../assets/comerciobairro.png');
const logoImoveis = require('../assets/Logo_TAB.gif');
const logoSemFundo = require('../assets/logosemfundo.png');

const HomeScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ImageBackground source={comercioBairro} style={styles.backgroundImage} imageStyle={styles.backgroundImageStyle}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Math.max(insets.top, 0) + 24}
          >
            <View style={[styles.topBar, { top: Math.max(insets.top, 8) + 8 }]}>
              <HamburgerMenu navigation={navigation} />
              <Image source={logoImoveis} style={styles.topRightLogo} />
            </View>
            <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 22) + 12 }]}>
              <View style={styles.logoSection}>
                <Image source={logoSemFundo} style={styles.mainLogo} />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>🔎 Buscar negócios</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Nome, descrição, endereço..."
                    placeholderTextColor="rgba(31, 41, 55, 0.55)"
                    style={styles.searchInput}
                    returnKeyType="search"
                    onSubmitEditing={() => navigation.navigate('Search', { initialQuery: query })}
                  />
                  <TouchableOpacity
                    style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
                    disabled={!canSearch}
                    onPress={() => navigation.navigate('Search', { initialQuery: query })}
                    activeOpacity={0.86}
                  >
                    <Text style={styles.searchButtonText}>Buscar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <Text style={styles.cardTitle}>📚 Navegar por categorias</Text>
                <TouchableOpacity
                  style={styles.primaryButtonOuter}
                  onPress={() => navigation.navigate('CategoriesMenu')}
                  activeOpacity={0.86}
                >
                  <View style={styles.primaryButtonInner}>
                    <View style={styles.primaryButtonHighlight} />
                    <View style={styles.primaryButtonGlossSpot} />
                    <Text style={styles.primaryButtonTextShadow}>Ver categorias</Text>
                    <Text style={styles.primaryButtonText}>Ver categorias</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.3,
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 72,
    paddingBottom: 22,
    justifyContent: 'flex-start',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },
  topRightLogo: {
    width: 240,
    height: 120,
    resizeMode: 'contain',
  },
  mainLogo: {
    width: 240,
    height: 320,
    resizeMode: 'contain',
  },
  card: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1f2937',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.18)',
    color: '#111827',
    fontWeight: '700',
  },
  searchButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
    marginVertical: 16,
  },
  primaryButtonOuter: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
  },
  primaryButtonInner: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D2691E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  primaryButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  primaryButtonGlossSpot: {
    position: 'absolute',
    top: -44,
    left: -44,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  primaryButtonTextShadow: {
    position: 'absolute',
    top: 18,
    left: 2,
    right: 0,
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.26)',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
});

export default HomeScreen;
