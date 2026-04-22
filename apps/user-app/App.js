import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import CategoriesMenuScreen from './src/screens/CategoriesMenuScreen';
import CategoryBusinessesScreen from './src/screens/CategoryBusinessesScreen';
import SubcategoryBusinessesScreen from './src/screens/SubcategoryBusinessesScreen';
import ServiceProvidersScreen from './src/screens/ServiceProvidersScreen';
import CommerceScreen from './src/screens/CommerceScreen';
import SchoolsScreen from './src/screens/SchoolsScreen';
import SearchScreen from './src/screens/SearchScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import AboutScreen from './src/screens/AboutScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfUseScreen from './src/screens/TermsOfUseScreen';
import DeveloperContactsScreen from './src/screens/DeveloperContactsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="CategoriesMenu" component={CategoriesMenuScreen} />
        <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
        <Stack.Screen name="Commerce" component={CommerceScreen} />
        <Stack.Screen name="Schools" component={SchoolsScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="CategoryBusinesses" component={CategoryBusinessesScreen} />
        <Stack.Screen name="SubcategoryBusinesses" component={SubcategoryBusinessesScreen} />
        <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
        <Stack.Screen name="DeveloperContacts" component={DeveloperContactsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
