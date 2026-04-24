import { NativeModules, Platform } from 'react-native';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const PROD_API_BASE_URL = 'https://temakinobairro.com.br/api';

function getBundleHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL || typeof scriptURL !== 'string') return null;

  const match = scriptURL.match(/^https?:\/\/([^/:]+)/i);
  if (!match) return null;
  return match[1];
}

function getDefaultApiBaseUrl() {
  if (!isDev) return PROD_API_BASE_URL;

  const host = getBundleHost();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiBaseUrl();

export const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const API_ENDPOINTS = {
  CATEGORIES: {
    LIST: '/categories',
  },
  SUBCATEGORIES: {
    LIST: (categoryId) => `/subcategories?category=${encodeURIComponent(categoryId)}`,
  },
  BUSINESSES: {
    LIST: ({ search, categoryId, subcategoryId, neighborhood } = {}) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryId) params.set('category', categoryId);
      if (subcategoryId) params.set('subcategory', subcategoryId);
      if (neighborhood) params.set('neighborhood', neighborhood);
      const queryString = params.toString();
      return `/businesses${queryString ? `?${queryString}` : ''}`;
    },
    BY_ID: (id) => `/businesses/${id}`,
    BY_CATEGORY: (categoryId) => `/businesses/category/${categoryId}`,
    BY_SUBCATEGORY: (subcategoryId) => `/businesses/subcategory/${encodeURIComponent(subcategoryId)}`,
    SEARCH: (q, categoryId, subcategory) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (categoryId) params.set('category', categoryId);
      if (subcategory) params.set('subcategory', subcategory);
      const queryString = params.toString();
      return `/businesses/search${queryString ? `?${queryString}` : ''}`;
    },
  },
};
