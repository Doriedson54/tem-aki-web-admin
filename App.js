import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { View, Text, AppRegistry } from 'react-native';

// Importando as telas
import HomeScreen from './src/screens/HomeScreen';
import CategoriesMenuScreen from './src/screens/CategoriesMenuScreen';
import ServiceProvidersScreen from './src/screens/ServiceProvidersScreen';
import CommerceScreen from './src/screens/CommerceScreen';
import SchoolsScreen from './src/screens/SchoolsScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import CategoryBusinessesScreen from './src/screens/CategoryBusinessesScreen';
import AddBusinessScreen from './src/screens/AddBusinessScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import GeneralRegistrationScreen from './src/screens/GeneralRegistrationScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import EditBusinessScreen from './src/screens/EditBusinessScreen';
import RegisteredBusinessesScreen from './src/screens/RegisteredBusinessesScreen';
import SubcategoryBusinessesScreen from './src/screens/SubcategoryBusinessesScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import AboutAppScreen from './src/screens/AboutAppScreen';

// Importando o contexto de autenticação e notificações
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/components/NotificationManager';
import { syncService } from './src/services/SyncService';

// Configuração global de tratamento de erros
import { LogBox } from 'react-native';

// Suprimir warnings específicos em desenvolvimento
LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Animated: `useNativeDriver`',
]);

// Handler global para erros não capturados
const originalConsoleError = console.error;
console.error = (...args) => {
  // Log do erro original
  originalConsoleError(...args);
  
  // Aqui você pode adicionar logging para serviços externos
  // como Crashlytics, Sentry, etc.
};

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Comfortaa': require('./assets/fonts/Comfortaa-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.log('Erro ao carregar fonte:', error);
        setFontsLoaded(true); // Continua mesmo com erro
      }
    }
    loadFonts();
  }, []);

  // Inicializar sincronização automática
  useEffect(() => {
    const initializeSync = async () => {
      try {
        console.log('Inicializando sincronização automática...');
        await syncService.autoSync();
        
        // Configurar sincronização periódica (a cada 5 minutos)
        const syncInterval = setInterval(() => {
          syncService.autoSync().catch(error => {
            console.error('Erro na sincronização periódica:', error);
          });
        }, 5 * 60 * 1000); // 5 minutos
        
        return () => clearInterval(syncInterval);
      } catch (error) {
        console.error('Erro ao inicializar sincronização:', error);
      }
    };
    
    initializeSync();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AuthProvider>
          <NavigationContainer>
          <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CategoriesMenu" component={CategoriesMenuScreen} />
            <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
            <Stack.Screen name="Commerce" component={CommerceScreen} />
            <Stack.Screen name="Schools" component={SchoolsScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="CategoryBusinesses" component={CategoryBusinessesScreen} />
            <Stack.Screen name="AddBusiness" component={AddBusinessScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="GeneralRegistration" component={GeneralRegistrationScreen} />
            <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
            <Stack.Screen name="EditBusiness" component={EditBusinessScreen} />
            <Stack.Screen name="RegisteredBusinesses" component={RegisteredBusinessesScreen} />
            <Stack.Screen name="SubcategoryBusinesses" component={SubcategoryBusinessesScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
          </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

// Registrar o componente principal
AppRegistry.registerComponent('main', () => App);