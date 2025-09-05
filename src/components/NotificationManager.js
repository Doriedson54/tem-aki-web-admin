import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Contexto para gerenciar notificações globalmente
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// Provider de notificações
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      opacity: new Animated.Value(0)
    };

    setNotifications(prev => [...prev, notification]);

    // Animação de entrada
    Animated.timing(notification.opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    // Auto-remover após duração especificada
    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const hideNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification) {
        // Animação de saída
        Animated.timing(notification.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          setNotifications(current => current.filter(n => n.id !== id));
        });
      }
      return prev;
    });
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration) => {
    return showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration) => {
    return showNotification(message, 'info', duration);
  }, [showNotification]);

  const value = {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onHide={hideNotification} />
    </NotificationContext.Provider>
  );
};

// Container de notificações
const NotificationContainer = ({ notifications, onHide }) => {
  if (notifications.length === 0) return null;

  return (
    <View style={styles.container}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onHide={onHide}
        />
      ))}
    </View>
  );
};

// Item individual de notificação
const NotificationItem = ({ notification, onHide }) => {
  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  return (
    <Animated.View
      style={[
        styles.notification,
        getNotificationStyle(),
        { opacity: notification.opacity }
      ]}
    >
      <View style={styles.notificationContent}>
        <Ionicons
          name={getIcon()}
          size={24}
          color={getIconColor()}
          style={styles.icon}
        />
        <Text style={styles.message}>{notification.message}</Text>
        <TouchableOpacity
          onPress={() => onHide(notification.id)}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notification: {
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  success: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  error: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warning: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  info: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
});

export default NotificationProvider;