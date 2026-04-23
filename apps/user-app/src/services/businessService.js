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
  try {
    const data = await apiGet(API_ENDPOINTS.BUSINESSES.BY_ID(id));
    const resolved = Array.isArray(data) ? data[0] : data;
    return normalizeBusiness(resolved);
  } catch (error) {
    try {
      const list = await apiGet(API_ENDPOINTS.BUSINESSES.LIST());
      if (Array.isArray(list)) {
        const found = list.find((b) => String(b?.id) === String(id));
        if (found) return normalizeBusiness(found);
      }
    } catch {}
    throw error;
  }
}

export async function searchBusinesses({ q, categoryId, subcategory } = {}) {
  const data = await apiGet(API_ENDPOINTS.BUSINESSES.SEARCH(q, categoryId, subcategory));
  return normalizeBusinesses(data);
}
