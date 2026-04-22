import { API_ENDPOINTS } from '../config/api';
import { apiGet } from './apiClient';

function normalizeBusiness(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const categoryName = raw?.category?.name ?? raw?.category_name ?? raw?.category ?? null;
  const subcategoryName = raw?.subcategory?.name ?? raw?.subcategory_name ?? raw?.subcategory ?? null;

  return {
    ...raw,
    category_name: categoryName ?? raw?.category_name,
    category: categoryName ?? raw?.category,
    subcategory: subcategoryName ?? raw?.subcategory,
    image: raw?.image_url ?? raw?.image ?? raw?.profilePhoto ?? raw?.photo ?? raw?.thumbnail ?? null,
    logo: raw?.logo_url ?? raw?.logo ?? null,
  };
}

function normalizeBusinesses(data) {
  if (Array.isArray(data)) return data.map(normalizeBusiness);
  return data;
}

export async function getCategories() {
  return apiGet(API_ENDPOINTS.CATEGORIES.LIST);
}

export async function getSubcategories(categoryId) {
  return apiGet(API_ENDPOINTS.SUBCATEGORIES.LIST(categoryId));
}

export async function getBusinessesByCategory(categoryId) {
  const data = await apiGet(API_ENDPOINTS.BUSINESSES.LIST({ categoryId }));
  return normalizeBusinesses(data);
}

export async function getBusinessesBySubcategory(subcategoryId) {
  const data = await apiGet(API_ENDPOINTS.BUSINESSES.LIST({ subcategoryId }));
  return normalizeBusinesses(data);
}

export async function getBusinessById(id) {
  const data = await apiGet(API_ENDPOINTS.BUSINESSES.BY_ID(id));
  return normalizeBusiness(data);
}

export async function searchBusinesses({ q, categoryId, subcategory } = {}) {
  const data = await apiGet(API_ENDPOINTS.BUSINESSES.SEARCH(q, categoryId, subcategory));
  return normalizeBusinesses(data);
}
