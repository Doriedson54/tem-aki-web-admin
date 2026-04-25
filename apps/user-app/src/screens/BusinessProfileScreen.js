import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Linking, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedBackButton from '../components/AnimatedBackButton';
import { API_BASE_URL } from '../config/api';
import { getBusinessById } from '../services/businessService';
import { getCategoryColors } from '../theme/categoryColors';
import { getSubcategoryColors } from '../theme/subcategoryColors';

const getApiHost = () => API_BASE_URL.replace(/\/api\/?$/i, '');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

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

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const getImages = (business) => {
  const raw = [
    business?.profilePhoto,
    business?.image,
    business?.image_url,
    business?.logo_url,
    business?.photo,
    business?.thumbnail,
    ...toArray(business?.images),
    ...toArray(business?.photos),
    ...toArray(business?.galleryPhotos),
  ];

  const uris = [];
  const seen = new Set();
  for (const item of raw) {
    const normalized = normalizeImageUri(item);
    const resolved = resolveUri(normalized);
    if (!resolved) continue;
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    uris.push(resolved);
  }
  return uris;
};

const openUrl = async (url) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir', 'Verifique se há um aplicativo compatível instalado.');
  }
};

const BusinessProfileScreen = ({ route, navigation }) => {
  const initialBusiness = route.params?.business || {};
  const routeBusinessId = route.params?.businessId || null;
  const [business, setBusiness] = useState(initialBusiness);
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { width } = useWindowDimensions();
  const photoWidth = Math.min(width - 40, 380);
  const photoHeight = Math.round(photoWidth * 0.63);

  const resolveBusinessId = useCallback(() => {
    const candidates = [
      routeBusinessId,
      business?.id,
      initialBusiness?.id,
      business?.business_id,
      initialBusiness?.business_id,
      business?._id,
      initialBusiness?._id,
      business?.uuid,
      initialBusiness?.uuid,
    ];
    for (const c of candidates) {
      if (c === null || typeof c === 'undefined') continue;
      const v = typeof c === 'string' ? c.trim() : String(c);
      if (v) return v;
    }
    return null;
  }, [routeBusinessId, business?.id, business?.business_id, business?._id, business?.uuid, initialBusiness]);

  const reload = useCallback(async () => {
    const id = resolveBusinessId();
    if (!id) {
      Alert.alert('Falha ao carregar', `ID do negócio não encontrado.\n\nAPI: ${API_BASE_URL}`);
      return;
    }
    try {
      setLoading(true);
      const data = await getBusinessById(id);
      if (data && typeof data === 'object') {
        setBusiness({ ...(initialBusiness || {}), ...data });
      } else {
        setBusiness(initialBusiness);
      }
      setLastLoadedAt(new Date().toISOString());
    } catch (e) {
      const msg = typeof e?.message === 'string' ? e.message : 'Não foi possível carregar os detalhes do negócio.';
      Alert.alert('Falha ao carregar', `${msg}\n\nAPI: ${API_BASE_URL}`);
      setBusiness(initialBusiness);
    } finally {
      setLoading(false);
    }
  }, [initialBusiness, resolveBusinessId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return undefined;
    }, [reload])
  );

  const businessId = resolveBusinessId();
  const name = business?.name || business?.establishmentName || business?.title || 'Negócio';
  const routeParentCategory = route.params?.parentCategory || null;
  const routeSubcategory = route.params?.subcategory || null;
  const category =
    routeParentCategory ||
    business?.category?.name ||
    business?.category_name ||
    (typeof business?.category === 'string' ? business.category : null) ||
    null;
  const subcategory =
    routeSubcategory ||
    business?.subcategory?.name ||
    business?.subcategory_name ||
    (typeof business?.subcategory === 'string' ? business.subcategory : null) ||
    null;
  const formality = business?.formality || null;
  const mainProduct = business?.main_product || business?.mainProduct || null;
  const description = business?.description || null;
  const address = business?.address || null;
  const neighborhood = business?.neighborhood || null;
  const cityState = business?.cityState || (business?.city && business?.state ? `${business.city}/${business.state}` : null);
  const zipCode = business?.zipCode || business?.zip_code || null;
  const phone = normalizeString(business?.phone) || null;
  const whatsapp = normalizeString(business?.whatsapp) || null;
  const email = normalizeString(business?.email) || null;
  const workingHours =
    business?.opening_hours?.description ||
    business?.working_hours ||
    business?.openingHours ||
    business?.workingHours ||
    null;
  const website = normalizeString(business?.website || business?.site) || null;
  const instagram = normalizeString(business?.instagram) || null;
  const facebook = normalizeString(business?.facebook) || null;
  const otherSocialMedia = normalizeString(business?.otherSocialMedia || business?.other_social_media) || null;
  const hasDelivery = Boolean(business?.hasDelivery || business?.has_delivery || business?.delivery);
  const hasTakeout = Boolean(business?.takeout || business?.hasTakeout || business?.has_takeout);
  const hasDineIn = Boolean(business?.dine_in || business?.dineIn || business?.hasDineIn || business?.has_dine_in);
  const rating = business?.rating ?? null;
  const isOpen = typeof business?.isOpen === 'boolean' ? business.isOpen : null;

  const images = useMemo(() => getImages(business), [business]);
  const coverImageUri = images[0] || null;
  const extraGalleryUris = images.slice(1);
  const colors = useMemo(() => {
    if (subcategory) return getSubcategoryColors(subcategory, category);
    return getCategoryColors(category);
  }, [category, subcategory]);

  const mapUrl = useMemo(() => {
    if (!address) return null;
    const q = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [address]);

  const handlePhoneCall = useCallback(() => {
    if (!phone) return;
    const phoneNumber = String(phone).replace(/[^0-9]/g, '');
    openUrl(`tel:${phoneNumber}`);
  }, [phone]);

  const handleWhatsApp = useCallback(() => {
    if (!whatsapp) return;
    const digits = String(whatsapp).replace(/[^0-9]/g, '');
    const phoneNumber = digits.startsWith('55') ? digits : `55${digits}`;
    openUrl(`https://wa.me/${phoneNumber}`);
  }, [whatsapp]);

  const handleEmail = useCallback(() => {
    if (!email) return;
    openUrl(`mailto:${email}`);
  }, [email]);

  const handleWebsite = useCallback(() => {
    if (!website) return;
    const w = String(website);
    const url = w.startsWith('http://') || w.startsWith('https://') ? w : `https://${w}`;
    openUrl(url);
  }, [website]);

  const handleInstagram = useCallback(() => {
    if (!instagram) return;
    const raw = String(instagram).trim();
    if (/^https?:\/\//i.test(raw)) {
      openUrl(raw);
      return;
    }
    const handle = raw
      .replace(/^@/, '')
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .split(/[/?#]/)[0];
    openUrl(`https://instagram.com/${handle}`);
  }, [instagram]);

  const handleFacebook = useCallback(() => {
    if (!facebook) return;
    const raw = String(facebook).trim();
    const url = /^https?:\/\//i.test(raw)
      ? raw
      : `https://facebook.com/${raw.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '').split(/[/?#]/)[0]}`;
    openUrl(url);
  }, [facebook]);

  const handleOtherSocial = useCallback(() => {
    if (!otherSocialMedia) return;
    const o = String(otherSocialMedia);
    const url = o.startsWith('http://') || o.startsWith('https://') ? o : `https://${o}`;
    openUrl(url);
  }, [otherSocialMedia]);

  const submitRating = useCallback(async () => {
    if (!businessId || !userRating) return;

    try {
      setSubmittingRating(true);
      setBusiness((prev) => ({ ...(prev || {}), user_rating: userRating }));
      Alert.alert('Obrigado!', 'Sua avaliação foi registrada.');
    } catch (e) {
      Alert.alert('Não foi possível registrar a avaliação', e?.message || 'Tente novamente.');
    } finally {
      setSubmittingRating(false);
    }
  }, [businessId, userRating]);

  const openGalleryAt = useCallback(
    (index) => {
      const safeIndex = Math.max(0, Math.min(index || 0, Math.max(images.length - 1, 0)));
      setGalleryIndex(safeIndex);
      setGalleryVisible(true);
    },
    [images.length]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { backgroundColor: colors.primary, borderBottomColor: colors.secondary }]}>
        <AnimatedBackButton onPress={() => navigation.goBack()} style={styles.headerBackButton} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
          🏢 Perfil do Negócio
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={styles.scrollContent}>
        <Modal visible={galleryVisible} transparent={false} animationType="fade" onRequestClose={() => setGalleryVisible(false)}>
          <SafeAreaView style={styles.galleryContainer}>
            <View style={styles.galleryHeader}>
              <TouchableOpacity style={styles.galleryCloseButton} onPress={() => setGalleryVisible(false)} activeOpacity={0.86}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.galleryTitle} numberOfLines={1}>
                Fotos
              </Text>
              <View style={styles.galleryHeaderSpacer} />
            </View>
            <FlatList
              data={images}
              keyExtractor={(uri) => uri}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={images.length > 0 ? galleryIndex : undefined}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              renderItem={({ item }) => (
                <View style={[styles.gallerySlide, { width }]}>
                  <Image source={{ uri: item }} style={styles.galleryImage} />
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>

        <View style={styles.metaBar}>
          <Text style={styles.metaText} numberOfLines={1}>
            {businessId ? `ID: ${businessId}` : 'ID: -'}
            {lastLoadedAt ? `  •  Atualizado: ${new Date(lastLoadedAt).toLocaleTimeString('pt-BR')}` : ''}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            API: {getApiHost()}
          </Text>
          <Text style={styles.metaText} numberOfLines={2}>
            {(business?.name || business?.establishmentName || business?.title || '-')}{business?.address ? `  •  ${business.address}` : ''}
          </Text>
        </View>
        <View style={styles.profileHeader}>
          <View style={styles.photoContainer}>
            {coverImageUri ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => openGalleryAt(0)}>
                <Image source={{ uri: coverImageUri }} style={[styles.profilePhoto, { width: photoWidth, height: photoHeight }]} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.placeholderPhoto, { width: photoWidth, height: photoHeight }]}>
                <Text style={styles.placeholderPhotoText}>📷</Text>
              </View>
            )}
          </View>
          {extraGalleryUris.length > 0 && (
            <View style={[styles.thumbsRow, { width: photoWidth }]}>
              {extraGalleryUris.slice(0, 6).map((uri, idx) => (
                <TouchableOpacity key={uri} activeOpacity={0.86} onPress={() => openGalleryAt(idx + 1)}>
                  <Image source={{ uri }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
              {extraGalleryUris.length > 6 && (
                <TouchableOpacity style={styles.moreThumbs} activeOpacity={0.86} onPress={() => openGalleryAt(1)}>
                  <Text style={styles.moreThumbsText}>+{extraGalleryUris.length - 6}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.businessName} numberOfLines={2}>
            {name}
          </Text>
          {subcategory && (
            <Text style={[styles.subcategory, { color: colors.primary }]} numberOfLines={1}>
              {subcategory}
            </Text>
          )}
          {category && (
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
          )}
          {formality && (
            <Text style={styles.formality}>
              {formality === 'formal' ? '✅ Formal' : '🟡 Informal'}
            </Text>
          )}
          {(rating !== null || isOpen !== null) && (
            <View style={styles.badgesRow}>
              {rating !== null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>⭐ {Number(rating).toFixed(1)}</Text>
                </View>
              )}
              {isOpen !== null && (
                <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
                  <Text style={styles.badgeText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                </View>
              )}
              {loading && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Atualizando…</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliação</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.starButton}
                onPress={() => setUserRating(value)}
                activeOpacity={0.86}
              >
                <Ionicons
                  name={(userRating || 0) >= value ? 'star' : 'star-outline'}
                  size={28}
                  color={(userRating || 0) >= value ? '#f59e0b' : '#9ca3af'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.rateButton, { backgroundColor: colors.primary }, (!userRating || submittingRating || !businessId) && styles.rateButtonDisabled]}
            onPress={submitRating}
            activeOpacity={0.86}
            disabled={!userRating || submittingRating || !businessId}
          >
            <Text style={styles.rateButtonText}>{submittingRating ? 'Enviando…' : 'Enviar avaliação'}</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>{userRating ? `Sua avaliação: ${userRating}/5` : 'Escolha de 1 a 5 estrelas'}</Text>
          <Text style={styles.helperText}>{rating !== null ? `Média atual: ${Number(rating).toFixed(1)}` : 'Sem média de avaliações no momento'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produto/Serviço Principal</Text>
          <Text style={styles.sectionContent}>{normalizeString(mainProduct) || 'Não informado'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.sectionContent}>{normalizeString(description) || 'Não informado'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização</Text>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Endereço:</Text>
            <Text style={styles.sectionContent}>{normalizeString(address) || 'Não informado'}</Text>
          </View>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Bairro:</Text>
            <Text style={styles.sectionContent}>{normalizeString(neighborhood) || 'Não informado'}</Text>
          </View>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Cidade/Estado:</Text>
            <Text style={styles.sectionContent}>{normalizeString(cityState) || 'Não informado'}</Text>
          </View>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>CEP:</Text>
            <Text style={styles.sectionContent}>{normalizeString(zipCode) || 'Não informado'}</Text>
          </View>
          {mapUrl && (
            <TouchableOpacity style={[styles.mapButton, { backgroundColor: colors.primary }]} onPress={() => openUrl(mapUrl)} activeOpacity={0.86}>
              <Text style={styles.mapButtonIcon}>📍</Text>
              <Text style={styles.mapButtonText}>Localizar no Mapa</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário de Funcionamento</Text>
          <Text style={styles.sectionContent}>{normalizeString(workingHours) || 'Não informado'}</Text>
        </View>

        <View style={styles.section}>
          <View style={[styles.deliveryBadge, { backgroundColor: hasDelivery ? colors.primary : '#6b7280' }]}>
            <Text style={styles.deliveryText}>{hasDelivery ? '🚚 Faz Delivery' : '🚫 Não faz Delivery'}</Text>
          </View>
          {(hasTakeout || hasDineIn) && (
            <View style={styles.serviceBadgesRow}>
              {hasTakeout && (
                <View style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>🥡 Retirada</Text>
                </View>
              )}
              {hasDineIn && (
                <View style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>🍽️ Consumo no local</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos</Text>

          {phone ? (
            <TouchableOpacity style={styles.contactButton} onPress={handlePhoneCall} activeOpacity={0.86}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{normalizeString(phone)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>Telefone não informado</Text>
          )}

          {whatsapp ? (
            <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp} activeOpacity={0.86}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.contactIconIonicons} />
              <Text style={styles.contactText}>{normalizeString(whatsapp)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>WhatsApp não informado</Text>
          )}

          {email ? (
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail} activeOpacity={0.86}>
              <Text style={styles.contactIcon}>📧</Text>
              <Text style={styles.contactText}>{normalizeString(email)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>E-mail não informado</Text>
          )}

          {website ? (
            <TouchableOpacity style={styles.contactButton} onPress={handleWebsite} activeOpacity={0.86}>
              <Text style={styles.contactIcon}>🌐</Text>
              <Text style={styles.contactText} numberOfLines={1}>
                {normalizeString(website)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>Site não informado</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redes Sociais</Text>

          {instagram ? (
            <TouchableOpacity style={styles.socialButton} onPress={handleInstagram} activeOpacity={0.86}>
              <Ionicons name="logo-instagram" size={20} color="#E4405F" style={styles.socialIconIonicons} />
              <Text style={styles.socialText} numberOfLines={1}>
                Instagram: {normalizeString(instagram)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>Instagram não informado</Text>
          )}

          {facebook ? (
            <TouchableOpacity style={styles.socialButton} onPress={handleFacebook} activeOpacity={0.86}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.socialIconIonicons} />
              <Text style={styles.socialText} numberOfLines={1}>
                Facebook: {normalizeString(facebook)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>Facebook não informado</Text>
          )}

          {otherSocialMedia ? (
            <TouchableOpacity style={styles.socialButton} onPress={handleOtherSocial} activeOpacity={0.86}>
              <Text style={styles.socialIcon}>🔗</Text>
              <Text style={styles.socialText} numberOfLines={1}>
                {normalizeString(otherSocialMedia)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyStateText}>Outro link não informado</Text>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 0,
  },
  metaBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(31, 41, 55, 0.65)',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  photoContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  profilePhoto: {
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#ffffff',
    resizeMode: 'cover',
  },
  placeholderPhoto: {
    borderRadius: 15,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  placeholderPhotoText: {
    fontSize: 50,
    color: '#6c757d',
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subcategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
    textAlign: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  formality: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  badgesRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  badgeOpen: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  badgeClosed: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2c3e50',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  locationItem: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  mapButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryBadge: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  deliveryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactIconIonicons: {
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  socialIconIonicons: {
    marginRight: 12,
  },
  socialText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  rateButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  rateButtonDisabled: {
    opacity: 0.55,
  },
  rateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  helperText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  emptyStateText: {
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  bottomSpacing: {
    height: 20,
  },
  thumbsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  thumbImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#e9ecef',
  },
  moreThumbs: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreThumbsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  serviceBadgesRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2c3e50',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  galleryCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  galleryTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  galleryHeaderSpacer: {
    width: 44,
  },
  gallerySlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default BusinessProfileScreen;
