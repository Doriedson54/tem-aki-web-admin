import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Globe, Heart, Instagram, MapPin, MessageCircle, Phone, Share2, X, ZoomIn, ZoomOut } from "lucide-react";
import api from "../services/api";
import type { Business, BusinessImage } from "../types";
import { Button } from "../components/ui/Button";

const APP_FAVORITES_STORAGE_KEY = "temaki-app-favorites";

function buildWhatsAppLink(rawPhone: string, message: string): string | null {
  const digitsOnly = String(rawPhone || "").replace(/\D/g, "");
  if (!digitsOnly) return null;
  const normalizedDigits = digitsOnly.replace(/^0+/, "");
  const withCountry = normalizedDigits.startsWith("55") ? normalizedDigits : `55${normalizedDigits}`;
  if (withCountry.length < 12) return null;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function formatPhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits.slice(2) : digits;
  if (normalized.length === 11) return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`;
  if (normalized.length === 10) return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`;
  return raw;
}

function normalizeInstagramUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  const withoutAt = v.startsWith("@") ? v.slice(1).trim() : v;
  if (!withoutAt) return null;
  if (/^https?:\/\//i.test(withoutAt)) return withoutAt;
  return `https://instagram.com/${encodeURIComponent(withoutAt)}`;
}

export function AppBusinessDetails() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [businessResponse, imagesResponse] = await Promise.all([
          api.get(`/businesses/${id}`),
          api.get(`/business-images/${id}`),
        ]);

        const businessData = businessResponse.data?.data ?? businessResponse.data;
        const imagesData = Array.isArray(imagesResponse.data?.data)
          ? imagesResponse.data.data
          : Array.isArray(imagesResponse.data)
            ? imagesResponse.data
            : [];

        if (!cancelled) {
          setBusiness(businessData as Business);
          setImages(imagesData as BusinessImage[]);
        }
      } catch {
        if (!cancelled) {
          setBusiness(null);
          setImages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(APP_FAVORITES_STORAGE_KEY);
      const favoriteIds = raw ? (JSON.parse(raw) as string[]) : [];
      setIsFavorite(Array.isArray(favoriteIds) && favoriteIds.includes(id));
    } catch {
      setIsFavorite(false);
    }
  }, [id]);

  const imageUrls = useMemo(() => {
    const urls = [business?.image_url, business?.logo_url, ...images.map((img) => img.image_url)].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );
    return [...new Set(urls)];
  }, [business?.image_url, business?.logo_url, images]);

  useEffect(() => {
    setActiveImageIndex(0);
    setViewerScale(1);
    setIsViewerOpen(false);
  }, [id, imageUrls.length]);

  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsViewerOpen(false);
      if (event.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev - 1 + imageUrls.length) % Math.max(imageUrls.length, 1));
        setViewerScale(1);
      }
      if (event.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev + 1) % Math.max(imageUrls.length, 1));
        setViewerScale(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageUrls.length, isViewerOpen]);

  const openViewerAt = useCallback((index: number) => {
    setActiveImageIndex(index);
    setViewerScale(1);
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setViewerScale(1);
  }, []);

  const showPrevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + imageUrls.length) % Math.max(imageUrls.length, 1));
    setViewerScale(1);
  }, [imageUrls.length]);

  const showNextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % Math.max(imageUrls.length, 1));
    setViewerScale(1);
  }, [imageUrls.length]);

  const zoomIn = useCallback(() => {
    setViewerScale((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setViewerScale((prev) => Math.max(prev - 0.5, 1));
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(APP_FAVORITES_STORAGE_KEY);
      const favoriteIds = raw ? (JSON.parse(raw) as string[]) : [];
      const nextIds = Array.isArray(favoriteIds)
        ? favoriteIds.includes(id)
          ? favoriteIds.filter((item) => item !== id)
          : [...favoriteIds, id]
        : [id];

      localStorage.setItem(APP_FAVORITES_STORAGE_KEY, JSON.stringify(nextIds));
      setIsFavorite(nextIds.includes(id));
    } catch {
    }
  }, [id]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = business?.name || "Tem Aki no Bairro";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("Link copiado!");
        return;
      }

      alert(url);
    } catch {
    }
  }, [business?.name]);

  const whatsappLink = buildWhatsAppLink(business?.whatsapp || business?.phone || "", "Olá, vi seu perfil no Tem Aki no Bairro!");
  const openingHoursText =
    typeof business?.opening_hours === "string"
      ? business.opening_hours
      : business?.opening_hours && typeof business.opening_hours === "object"
        ? business.opening_hours.description || ""
        : "";

  const mapLink =
    business?.latitude && business?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : business?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
        : "https://www.google.com/maps";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-action-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center px-space-4">
        <div className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-8 text-center shadow-card">
          <h1 className="text-text-2xl font-bold text-text-primary">Negócio não encontrado</h1>
          <p className="mt-space-2 text-text-secondary">Não foi possível localizar esse cadastro.</p>
          <Link to="/app">
            <Button className="mt-space-5">Voltar para busca</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page pb-space-16">
      <section className="container mx-auto px-space-4 py-space-6">
        <Link to="/app" className="inline-flex items-center gap-space-2 text-text-secondary hover:text-action-primary font-medium">
          <ArrowLeft className="h-4 w-4" />
          Voltar para busca
        </Link>
      </section>

      <section className="container mx-auto px-space-4">
        <div className="rounded-radius-2xl overflow-hidden border border-border-subtle bg-surface-card shadow-card">
          <div className="aspect-[16/8] bg-surface-subtle">
            <img
              src={business.image_url || business.logo_url || "https://placehold.co/1200x700/e2e8f0/94a3b8?text=Tem+Aki"}
              alt={business.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-space-6 md:p-space-8">
            <div className="flex flex-col gap-space-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-text-xs font-bold uppercase tracking-wider text-text-muted">
                  {business.category?.name || "Geral"}
                  {business.subcategory?.name ? ` • ${business.subcategory.name}` : ""}
                </div>
                <h1 className="mt-space-2 text-text-3xl md:text-text-4xl font-bold text-text-primary">{business.name}</h1>
                {business.main_product && (
                  <p className="mt-space-2 text-text-lg text-text-secondary">{business.main_product}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-space-3">
                <Button
                  variant="secondary"
                  onClick={handleToggleFavorite}
                  className={`gap-space-2 ${isFavorite ? "border-status-error text-status-error bg-status-error/5" : ""}`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "Favoritado" : "Favoritar"}
                </Button>
                <Button variant="secondary" onClick={handleShare} className="gap-space-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
                {business.phone && (
                  <a href={`tel:${business.phone}`}>
                    <Button variant="secondary" className="gap-space-2">
                      <Phone className="h-4 w-4" />
                      Ligar
                    </Button>
                  </a>
                )}
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-space-2 bg-status-success border-none">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                <a href={mapLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="gap-space-2">
                    <MapPin className="h-4 w-4" />
                    Ver localização
                  </Button>
                </a>
              </div>
            </div>

            <div className="mt-space-8 grid grid-cols-1 lg:grid-cols-3 gap-space-6">
              <div className="lg:col-span-2 space-y-space-6">
                <section className="rounded-radius-2xl border border-border-subtle bg-surface-subtle/30 p-space-6">
                  <h2 className="text-text-xl font-bold text-text-primary">Sobre</h2>
                  <p className="mt-space-3 text-text-secondary whitespace-pre-line leading-7">
                    {business.description || "Nenhuma descrição disponível."}
                  </p>
                </section>

                {imageUrls.length > 0 && (
                  <section className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6">
                    <div className="flex items-end justify-between gap-space-4">
                      <div>
                        <h2 className="text-text-xl font-bold text-text-primary">Galeria de Fotos</h2>
                        <p className="mt-1 text-text-sm text-text-muted">
                          Deslize para o lado para ver mais fotos.
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full bg-surface-subtle px-space-3 py-1 text-text-xs font-semibold text-text-muted">
                        {activeImageIndex + 1}/{imageUrls.length}
                      </div>
                    </div>

                    <div className="mt-space-4 -mx-space-2 px-space-2 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none]">
                      <div className="flex gap-space-3 snap-x snap-mandatory">
                        {imageUrls.map((url, index) => (
                          <button
                            key={url}
                            type="button"
                            className={`relative shrink-0 w-[78%] sm:w-[58%] md:w-[42%] lg:w-[36%] rounded-radius-2xl overflow-hidden border transition-all snap-start ${index === activeImageIndex ? "border-action-primary shadow-card-hover" : "border-border-subtle shadow-card"
                              }`}
                            onClick={() => openViewerAt(index)}
                          >
                            <div className="aspect-[4/3] bg-surface-subtle">
                              <img src={url} alt={`${business.name} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-space-4 py-space-3 text-left">
                              <div className="text-white text-text-sm font-semibold">Foto {index + 1}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-space-4 flex gap-space-3 overflow-x-auto pb-1 [scrollbar-width:none]">
                      {imageUrls.map((url, index) => (
                        <button
                          key={`${url}-thumb`}
                          type="button"
                          onClick={() => {
                            setActiveImageIndex(index);
                            openViewerAt(index);
                          }}
                          className={`relative shrink-0 h-16 w-16 rounded-radius-lg overflow-hidden border-2 transition-all ${index === activeImageIndex ? "border-action-primary" : "border-transparent opacity-80"
                            }`}
                        >
                          <img src={url} alt={`Miniatura ${index + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                        </button>
                      ))}
                    </div>

                    {imageUrls.length > 1 && (
                      <div className="mt-space-4 flex items-center gap-space-2">
                        {imageUrls.map((url, index) => (
                          <button
                            key={`${url}-dot`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-2.5 rounded-full transition-all ${index === activeImageIndex ? "w-6 bg-action-primary" : "w-2.5 bg-border-default"
                              }`}
                            aria-label={`Ir para foto ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>

              <div className="space-y-space-4">
                <section className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6">
                  <h2 className="text-text-xl font-bold text-text-primary">Contato</h2>
                  <div className="mt-space-4 space-y-space-4 text-text-secondary">
                    <div>
                      <div className="text-text-xs font-bold uppercase tracking-wider text-text-muted">Telefone</div>
                      <div className="mt-space-1">{business.phone ? formatPhone(business.phone) : "Não informado"}</div>
                    </div>
                    <div>
                      <div className="text-text-xs font-bold uppercase tracking-wider text-text-muted">WhatsApp</div>
                      <div className="mt-space-1">{business.whatsapp ? formatPhone(business.whatsapp) : business.phone ? formatPhone(business.phone) : "Não informado"}</div>
                    </div>
                    {business.website && (
                      <div>
                        <div className="text-text-xs font-bold uppercase tracking-wider text-text-muted">Site</div>
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="mt-space-1 inline-flex items-center gap-2 text-action-primary hover:underline">
                          <Globe className="h-4 w-4" />
                          Abrir site
                        </a>
                      </div>
                    )}
                    {normalizeInstagramUrl(business.instagram) && (
                      <div>
                        <div className="text-text-xs font-bold uppercase tracking-wider text-text-muted">Instagram</div>
                        <a
                          href={normalizeInstagramUrl(business.instagram) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-space-1 inline-flex items-center gap-2 text-action-primary hover:underline"
                        >
                          <Instagram className="h-4 w-4" />
                          Abrir perfil
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6">
                  <h2 className="text-text-xl font-bold text-text-primary">Endereço</h2>
                  <div className="mt-space-4 text-text-secondary space-y-space-4">
                    <div>
                      {[business.address, business.neighborhood, business.city, business.state].filter(Boolean).join(", ") || "Endereço não informado"}
                    </div>
                    <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-action-primary font-semibold hover:underline">
                      <MapPin className="h-4 w-4" />
                      Abrir no mapa
                    </a>
                  </div>
                </section>

                {openingHoursText && (
                  <section className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6">
                    <h2 className="text-text-xl font-bold text-text-primary inline-flex items-center gap-2">
                      <Clock className="h-5 w-5 text-action-primary" />
                      Horário
                    </h2>
                    <p className="mt-space-4 text-text-secondary whitespace-pre-line">{openingHoursText}</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isViewerOpen && imageUrls.length > 0 && (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between gap-space-3 px-space-4 py-space-3 border-b border-white/10 text-white">
            <div className="text-text-sm font-semibold">
              {activeImageIndex + 1} de {imageUrls.length}
            </div>
            <div className="flex items-center gap-space-2">
              <button
                type="button"
                onClick={zoomOut}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={closeViewer}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
                aria-label="Fechar galeria"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-auto p-space-4">
            {imageUrls.length > 1 && (
              <button
                type="button"
                onClick={showPrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="flex items-center justify-center min-h-full min-w-full">
              <img
                src={imageUrls[activeImageIndex]}
                alt={`${business.name} ${activeImageIndex + 1}`}
                className="max-w-full max-h-[78vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${viewerScale})` }}
              />
            </div>

            {imageUrls.length > 1 && (
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {imageUrls.length > 1 && (
            <div className="px-space-4 py-space-3 border-t border-white/10 overflow-x-auto [scrollbar-width:none]">
              <div className="flex gap-space-3">
                {imageUrls.map((url, index) => (
                  <button
                    key={`${url}-viewer-thumb`}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(index);
                      setViewerScale(1);
                    }}
                    className={`shrink-0 h-16 w-16 rounded-radius-lg overflow-hidden border-2 ${index === activeImageIndex ? "border-white" : "border-transparent opacity-70"}`}
                  >
                    <img src={url} alt={`Thumb ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
