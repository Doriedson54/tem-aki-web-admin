import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/components/NotificationManager';
import HomeScreen from './src/screens/HomeScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import CategoryBusinessesScreen from './src/screens/CategoryBusinessesScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import AddBusinessScreen from './src/screens/AddBusinessScreen';
import EditBusinessScreen from './src/screens/EditBusinessScreen';
import RegisteredBusinessesScreen from './src/screens/RegisteredBusinessesScreen';
import AboutScreen from './src/screens/AboutScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import CommerceScreen from './src/screens/CommerceScreen';
import ServiceProvidersScreen from './src/screens/ServiceProvidersScreen';
import SchoolsScreen from './src/screens/SchoolsScreen';
import CategoriesMenuScreen from './src/screens/CategoriesMenuScreen';
import SubcategoryBusinessesScreen from './src/screens/SubcategoryBusinessesScreen';
import GeneralRegistrationScreen from './src/screens/GeneralRegistrationScreen';
import SearchScreen from './src/screens/SearchScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="CategoryBusinesses" component={CategoryBusinessesScreen} />
          <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
          <Stack.Screen name="AddBusiness" component={AddBusinessScreen} />
          <Stack.Screen name="EditBusiness" component={EditBusinessScreen} />
          <Stack.Screen name="RegisteredBusinesses" component={RegisteredBusinessesScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Commerce" component={CommerceScreen} />
          <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
          <Stack.Screen name="Schools" component={SchoolsScreen} />
          <Stack.Screen name="CategoriesMenu" component={CategoriesMenuScreen} />
          <Stack.Screen name="SubcategoryBusinesses" component={SubcategoryBusinessesScreen} />
          <Stack.Screen name="GeneralRegistration" component={GeneralRegistrationScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </NotificationProvider>
  );
}