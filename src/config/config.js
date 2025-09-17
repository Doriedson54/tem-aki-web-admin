// Configurações gerais da aplicação

// Configurações da aplicação
export const APP_CONFIG = {
  name: 'Tem Aki no Bairro',
  version: '1.0.0',
  description: 'Aplicativo para encontrar negócios locais no seu bairro',
};

// Configurações de localização
export const LOCATION_CONFIG = {
  defaultRadius: 5000, // 5km em metros
  maxRadius: 50000, // 50km em metros
  enableHighAccuracy: true,
  timeout: 15000, // 15 segundos
  maximumAge: 300000, // 5 minutos
};

// Configurações de cache
export const CACHE_CONFIG = {
  businessesTTL: 300000, // 5 minutos
  categoriesTTL: 3600000, // 1 hora
  userProfileTTL: 1800000, // 30 minutos
};

// Configurações de paginação
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
};

// Configurações de imagem
export const IMAGE_CONFIG = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  allowsEditing: true,
  aspect: [4, 3],
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  enablePushNotifications: true,
  enableLocalNotifications: true,
  defaultSound: true,
};

// Configurações de tema
export const THEME_CONFIG = {
  primaryColor: '#007AFF',
  secondaryColor: '#5856D6',
  backgroundColor: '#F2F2F7',
  textColor: '#000000',
  borderRadius: 8,
};

// Configurações de desenvolvimento
export const DEV_CONFIG = {
  enableLogging: __DEV__,
  enableDebugMode: __DEV__,
  showPerformanceMonitor: __DEV__,
};

// Função para obter configuração completa
export const getAppConfig = () => {
  return {
    app: APP_CONFIG,
    location: LOCATION_CONFIG,
    cache: CACHE_CONFIG,
    pagination: PAGINATION_CONFIG,
    image: IMAGE_CONFIG,
    notification: NOTIFICATION_CONFIG,
    theme: THEME_CONFIG,
    dev: DEV_CONFIG,
  };
};