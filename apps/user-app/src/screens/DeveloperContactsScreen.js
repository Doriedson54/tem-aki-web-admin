import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnimatedBackButton from '../components/AnimatedBackButton';

const openUrl = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return;
    await Linking.openURL(url);
  } catch {
    return;
  }
};

const DeveloperContactsScreen = ({ navigation }) => {
  const email = 'dsdodo18@hotmail.com';
  const phone = '(98) 99934-5232';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AnimatedBackButton onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={styles.headerTitle}>Contatos do Desenvolvedor</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doriedson Serra</Text>

          <TouchableOpacity style={styles.row} onPress={() => openUrl(`mailto:${email}`)} activeOpacity={0.86}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => openUrl(`tel:${phone}`)} activeOpacity={0.86}>
            <Text style={styles.label}>Telefone</Text>
            <Text style={styles.value}>{phone}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(31, 41, 55, 0.65)',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '900',
    color: '#8B4513',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
});

export default DeveloperContactsScreen;
