import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../hooks/useSync';

const SyncStatusIndicator = ({ style, showDetails = false, onPress }) => {
  const { syncStatus, manualSync, error } = useSync();
  const { isOnline, syncInProgress, pendingOperations, lastSyncTime } = syncStatus;

  const getStatusIcon = () => {
    if (syncInProgress) {
      return 'sync';
    }
    if (!isOnline) {
      return 'cloud-offline';
    }
    if (pendingOperations > 0) {
      return 'cloud-upload';
    }
    return 'cloud-done';
  };

  const getStatusColor = () => {
    if (syncInProgress) {
      return '#2196F3'; // Azul
    }
    if (!isOnline) {
      return '#FF9800'; // Laranja
    }
    if (pendingOperations > 0) {
      return '#FF5722'; // Vermelho-laranja
    }
    return '#4CAF50'; // Verde
  };

  const getStatusText = () => {
    if (syncInProgress) {
      return 'Sincronizando...';
    }
    if (!isOnline) {
      return 'Offline';
    }
    if (pendingOperations > 0) {
      return `${pendingOperations} pendente${pendingOperations > 1 ? 's' : ''}`;
    }
    return 'Sincronizado';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca';
    
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d atrás`;
    }
    if (hours > 0) {
      return `${hours}h atrás`;
    }
    if (minutes > 0) {
      return `${minutes}min atrás`;
    }
    return 'Agora';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!syncInProgress && isOnline) {
      manualSync();
    }
  };

  if (!showDetails) {
    // Versão compacta - apenas ícone
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={handlePress}
        disabled={syncInProgress}
      >
        <Ionicons
          name={getStatusIcon()}
          size={20}
          color={getStatusColor()}
          style={syncInProgress ? styles.rotating : null}
        />
        {pendingOperations > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingOperations}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Versão detalhada
  return (
    <TouchableOpacity
      style={[styles.detailedContainer, style]}
      onPress={handlePress}
      disabled={syncInProgress}
    >
      <View style={styles.statusRow}>
        <Ionicons
          name={getStatusIcon()}
          size={16}
          color={getStatusColor()}
          style={[styles.statusIcon, syncInProgress ? styles.rotating : null]}
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Última sync: {formatLastSync()}
          </Text>
          {error && (
            <Text style={styles.errorText} numberOfLines={1}>
              Erro: {error}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  detailedContainer: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rotating: {
    // Animação de rotação seria implementada com Animated API
  },
});

export default SyncStatusIndicator;