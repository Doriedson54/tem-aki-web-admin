import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config/api';

const getApiHost = () => API_BASE_URL.replace(/\/api\/?$/i, '');

const normalizeImageUri = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    const v = value.uri || value.url || value.path;
    return typeof v === 'string' ? v.trim() || null : null;
  }
  return null;
};

const resolveUri = (uri) => {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri) || /^data:/i.test(uri)) return uri;
  if (uri.startsWith('/')) return `${getApiHost()}${uri}`;
  return `${API_BASE_URL}/${uri}`.replace(/\/{2,}/g, '/').replace(':/', '://');
};

const pickFirstImage = (business) => {
  const candidates = [
    business?.profilePhoto,
    business?.image,
    business?.image_url,
    business?.logo_url,
    business?.photo,
    business?.thumbnail,
    ...(Array.isArray(business?.images) ? business.images : []),
    ...(Array.isArray(business?.photos) ? business.photos : []),
  ];
  for (const c of candidates) {
    const normalized = normalizeImageUri(c);
    const resolved = resolveUri(normalized);
    if (resolved) return resolved;
  }
  return null;
};

const BusinessListItem = ({ business, onPress, accentColor = '#3498db' }) => {
  const name = business?.name || business?.establishmentName || 'Negócio';
  const address = business?.address || '';
  const neighborhood = business?.neighborhood || '';
  const cityState = business?.cityState || (business?.city && business?.state ? `${business.city}/${business.state}` : '') || '';
  const phone = business?.phone || '';
  const subcategory = typeof business?.subcategory === 'object' ? business?.subcategory?.name || '' : business?.subcategory || '';
  const category =
    business?.category?.name || business?.category_name || (typeof business?.category === 'string' ? business.category : '') || '';
  const mainProduct = business?.main_product || business?.mainProduct || '';

  const imageUri = useMemo(() => pickFirstImage(business), [business]);
  const location = useMemo(() => {
    const parts = [];
    if (neighborhood) parts.push(neighborhood);
    if (cityState) parts.push(cityState);
    return parts.join(', ');
  }, [cityState, neighborhood]);

  return (
    <TouchableOpacity style={styles.businessItem} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.businessContent}>
        <View style={styles.photoContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.businessPhoto} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Text style={styles.placeholderPhotoText}>📷</Text>
            </View>
          )}
        </View>

        <View style={styles.businessInfo}>
          <Text style={styles.businessName} numberOfLines={1}>
            {name}
          </Text>
          {!!subcategory && (
            <Text style={[styles.subcategory, { color: accentColor }]} numberOfLines={1}>
              {subcategory}
            </Text>
          )}
          {!!category && (
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
          )}
          {!!address && (
            <Text style={styles.businessAddress} numberOfLines={1}>
              {address}
            </Text>
          )}
          {!!location && (
            <Text style={styles.businessLocation} numberOfLines={1}>
              {location}
            </Text>
          )}
          {!!phone && (
            <Text style={styles.businessPhone} numberOfLines={1}>
              {phone}
            </Text>
          )}
          {!!mainProduct && (
            <Text style={styles.businessProduct} numberOfLines={1}>
              {mainProduct}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.viewProfileText, { color: accentColor }]}>Ver perfil →</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  businessItem: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  businessContent: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  photoContainer: {
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  businessPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  placeholderPhotoText: {
    fontSize: 20,
    color: '#6c757d',
  },
  businessInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subcategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  businessLocation: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  businessPhone: {
    fontSize: 14,
    color: '#495057',
  },
  businessProduct: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default BusinessListItem;
