import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const MoreScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opções</Text>
        <Text style={styles.headerSubtitle}>Informações e políticas</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')} activeOpacity={0.86}>
          <Text style={styles.rowIcon}>ℹ️</Text>
          <Text style={styles.rowText}>Sobre</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          activeOpacity={0.86}
        >
          <Text style={styles.rowIcon}>🔒</Text>
          <Text style={styles.rowText}>Política de privacidade</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  headerSubtitle: {
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  rowIcon: {
    fontSize: 18,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#1f2937',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
});

export default MoreScreen;
