import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSmartCache } from '../hooks/useSmartCache';
import { Ionicons } from '@expo/vector-icons';

const CacheSettingsScreen = ({ navigation }) => {
  const {
    cacheStats,
    isSyncing,
    forceSync,
    clearCache,
    formattedStats,
    updateCacheStats,
  } = useSmartCache();

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache',
      'Tem certeza que deseja limpar todo o cache? Isso pode tornar o app mais lento temporariamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await clearCache();
              Alert.alert('Sucesso', 'Cache limpo com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar o cache.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
      Alert.alert('Sucesso', 'Sincronização concluída!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível sincronizar o cache.');
    }
  };

  const handleRefreshStats = async () => {
    await updateCacheStats();
  };

  const getCacheHealthColor = () => {
    if (cacheStats.totalItems === 0) return '#f44336'; // Vermelho
    if (cacheStats.totalItems < 5) return '#ff9800'; // Laranja
    return '#4caf50'; // Verde
  };

  const getCacheHealthText = () => {
    if (cacheStats.totalItems === 0) return 'Cache vazio';
    if (cacheStats.totalItems < 5) return 'Cache com poucos dados';
    return 'Cache saudável';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações de Cache</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshStats}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status do Cache */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status do Cache</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.healthIndicator, { backgroundColor: getCacheHealthColor() }]} />
              <Text style={styles.healthText}>{getCacheHealthText()}</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formattedStats.totalItems}</Text>
                <Text style={styles.statLabel}>Itens</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formattedStats.totalSize}</Text>
                <Text style={styles.statLabel}>Tamanho</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formattedStats.oldestAge}</Text>
                <Text style={styles.statLabel}>Mais Antigo</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formattedStats.newestAge}</Text>
                <Text style={styles.statLabel}>Mais Recente</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sincronização Automática</Text>
              <Text style={styles.settingDescription}>
                Atualiza o cache automaticamente em background
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={setAutoSyncEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={autoSyncEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.syncButton]}
            onPress={handleForceSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sync" size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearCache}
            disabled={isClearing || cacheStats.totalItems === 0}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash" size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {isClearing ? 'Limpando...' : 'Limpar Cache'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o Cache Inteligente</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              O cache inteligente melhora a performance do app armazenando dados localmente e 
              sincronizando automaticamente em background. Isso permite:
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                <Text style={styles.featureText}>Acesso offline aos dados</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                <Text style={styles.featureText}>Carregamento mais rápido</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                <Text style={styles.featureText}>Menor uso de dados móveis</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                <Text style={styles.featureText}>Sincronização automática</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export default CacheSettingsScreen;