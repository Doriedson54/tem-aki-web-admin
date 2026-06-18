import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Globe, Heart, Instagram, MapPin, MessageCircle, Phone, Share2, Star, X } from "lucide-react";
import api from "../services/api";
import type { Business, BusinessImage, Review } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { trackBusinessEvent } from "../services/businessEvents";
import { appMeta } from "../config/appMeta";

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

function safeDateLabel(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function BusinessDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-28 md:pb-space-16">
      <section className="container mx-auto px-space-4 py-space-4">
        <div className="flex items-center justify-between gap-space-3">
          <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="flex gap-space-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      </section>
      <section className="container mx-auto px-space-4">
        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
          <div className="h-64 animate-pulse bg-slate-200 md:h-80" />
          <div className="grid gap-space-6 p-space-6 lg:grid-cols-3">
            <div className="space-y-space-5 lg:col-span-2">
              <div className="space-y-space-3">
                <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="h-8 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="h-5 w-1/2 animate-pulse rounded-full bg-slate-200" />
              </div>
              <div className="h-48 animate-pulse rounded-[24px] bg-slate-100" />
              <div className="h-64 animate-pulse rounded-[24px] bg-slate-100" />
            </div>
            <div className="space-y-space-4">
              <div className="h-44 animate-pulse rounded-[24px] bg-slate-100" />
              <div className="h-36 animate-pulse rounded-[24px] bg-slate-100" />
              <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AppBusinessDetails() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewError, setReviewError] = useState("");
  const galleryTrackRef = useRef<HTMLDivElement | null>(null);
  const viewerTrackRef = useRef<HTMLDivElement | null>(null);
  const trackedViewRef = useRef<string | null>(null);
  const eventSource = "app";

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [businessResponse, imagesResponse, reviewsResponse] = await Promise.all([
          api.get(`/businesses/${id}`),
          api.get(`/business-images/${id}`),
          api.get(`/reviews/${id}`),
        ]);

        const businessData = businessResponse.data?.data ?? businessResponse.data;
        const imagesData = Array.isArray(imagesResponse.data?.data)
          ? imagesResponse.data.data
          : Array.isArray(imagesResponse.data)
            ? imagesResponse.data
            : [];
        const reviewsData = Array.isArray(reviewsResponse.data?.data)
          ? reviewsResponse.data.data
          : Array.isArray(reviewsResponse.data)
            ? reviewsResponse.data
            : [];

        if (!cancelled) {
          setBusiness(businessData as Business);
          setImages(imagesData as BusinessImage[]);
          setReviews(reviewsData as Review[]);
        }
      } catch {
        if (!cancelled) {
          setBusiness(null);
          setImages([]);
          setReviews([]);
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
      const raw = localStorage.getItem(appMeta.favoritesStorageKey);
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
    setIsViewerOpen(false);
  }, [id, imageUrls.length]);

  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsViewerOpen(false);
      if (event.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev - 1 + imageUrls.length) % Math.max(imageUrls.length, 1));
      }
      if (event.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev + 1) % Math.max(imageUrls.length, 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageUrls.length, isViewerOpen]);

  const openViewerAt = useCallback((index: number) => {
    setActiveImageIndex(index);
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  const scrollToIndex = useCallback((container: HTMLDivElement | null, index: number) => {
    if (!container) return;
    const nextIndex = Math.max(0, Math.min(index, imageUrls.length - 1));
    container.scrollTo({
      left: container.clientWidth * nextIndex,
      behavior: "smooth",
    });
  }, [imageUrls.length]);

  const showPrevImage = useCallback(() => {
    const next = (activeImageIndex - 1 + imageUrls.length) % Math.max(imageUrls.length, 1);
    setActiveImageIndex(next);
    scrollToIndex(isViewerOpen ? viewerTrackRef.current : galleryTrackRef.current, next);
  }, [activeImageIndex, imageUrls.length, isViewerOpen, scrollToIndex]);

  const showNextImage = useCallback(() => {
    const next = (activeImageIndex + 1) % Math.max(imageUrls.length, 1);
    setActiveImageIndex(next);
    scrollToIndex(isViewerOpen ? viewerTrackRef.current : galleryTrackRef.current, next);
  }, [activeImageIndex, imageUrls.length, isViewerOpen, scrollToIndex]);

  const registerEvent = useCallback(
    (eventType: "profile_view" | "phone_click" | "whatsapp_click" | "map_click" | "share" | "favorite", metadata?: Record<string, unknown>) => {
      if (!id) return;
      void trackBusinessEvent({
        business_id: id,
        event_type: eventType,
        source: eventSource,
        metadata: metadata || {},
      });
    },
    [eventSource, id]
  );

  const handleToggleFavorite = useCallback(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(appMeta.favoritesStorageKey);
      const favoriteIds = raw ? (JSON.parse(raw) as string[]) : [];
      const nextIds = Array.isArray(favoriteIds)
        ? favoriteIds.includes(id)
          ? favoriteIds.filter((item) => item !== id)
          : [...favoriteIds, id]
        : [id];

      localStorage.setItem(appMeta.favoritesStorageKey, JSON.stringify(nextIds));
      setIsFavorite(nextIds.includes(id));
      if (nextIds.includes(id)) {
        registerEvent("favorite", { location: "app_business_details" });
      }
    } catch {
    }
  }, [id, registerEvent]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = business?.name || "Tem Aki no Bairro";
    try {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav?.share) {
        await nav.share({ title, url });
        registerEvent("share", { method: "web_share" });
        return;
      }

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        registerEvent("share", { method: "clipboard" });
        alert("Link copiado!");
        return;
      }

      registerEvent("share", { method: "fallback_alert" });
      alert(url);
    } catch {
    }
  }, [business?.name, registerEvent]);

  const handleGalleryScroll = useCallback((container: HTMLDivElement | null) => {
    if (!container) return;
    const nextIndex = Math.round(container.scrollLeft / Math.max(container.clientWidth, 1));
    if (nextIndex !== activeImageIndex) {
      setActiveImageIndex(Math.max(0, Math.min(nextIndex, imageUrls.length - 1)));
    }
  }, [activeImageIndex, imageUrls.length]);

  useEffect(() => {
    if (!isViewerOpen) return;
    scrollToIndex(viewerTrackRef.current, activeImageIndex);
  }, [activeImageIndex, isViewerOpen, scrollToIndex]);

  useEffect(() => {
    if (!business?.id || trackedViewRef.current === business.id) return;
    trackedViewRef.current = business.id;
    registerEvent("profile_view", { path: typeof window !== "undefined" ? window.location.pathname : "" });
  }, [business?.id, registerEvent]);

  const handleSubmitReview = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;

    setReviewError("");
    setReviewFeedback("");

    const trimmedAuthorName = authorName.trim();
    const trimmedComment = comment.trim();

    if (!trimmedAuthorName) {
      setReviewError("Informe seu nome ou apelido.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setReviewError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await api.post("/reviews", {
        business_id: id,
        rating,
        author_name: trimmedAuthorName,
        content: trimmedComment,
      });

      if (response.data?.success) {
        setAuthorName("");
        setRating(0);
        setComment("");
        setReviewFeedback("Obrigado! Sua avaliação foi enviada e será analisada antes da publicação.");
      } else {
        setReviewError(response.data?.message || "Erro ao enviar avaliação. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação no app", error);
      setReviewError("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmittingReview(false);
    }
  }, [authorName, comment, id, rating]);

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

  const avgRating = useMemo(() => {
    if (typeof business?.rating === "number" && Number.isFinite(business.rating)) return business.rating;
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + (typeof review.rating === "number" ? review.rating : 0), 0);
    return total / Math.max(reviews.length, 1);
  }, [business?.rating, reviews]);

  if (loading) {
    return <BusinessDetailsSkeleton />;
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center px-space-4">
        <div className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-8 text-center shadow-card">
          <h1 className="text-text-2xl font-bold text-text-primary">Negócio não encontrado</h1>
          <p className="mt-space-2 text-text-secondary">Não foi possível localizar esse cadastro.</p>
          <Link to="/app/lista">
            <Button className="mt-space-5">Voltar para busca</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-28 md:pb-space-16">
      <section className="container mx-auto px-space-4 py-space-4">
        <div className="flex items-center justify-between gap-space-3">
          <Link to="/app/lista" className="inline-flex items-center gap-space-2 rounded-full bg-white px-space-4 py-space-3 text-text-secondary shadow-sm transition-colors hover:text-action-primary font-medium">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-space-2">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`h-10 w-10 rounded-full border inline-flex items-center justify-center transition-colors ${isFavorite ? "border-status-error bg-status-error/10 text-status-error" : "border-border-subtle bg-white text-text-secondary shadow-sm"
                }`}
              aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="h-10 w-10 rounded-full border border-border-subtle bg-white text-text-secondary inline-flex items-center justify-center shadow-sm"
              aria-label="Compartilhar"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-space-4">
        <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
          <div className="relative aspect-[16/8] bg-surface-subtle">
            <img
              src={business.image_url || business.logo_url || "https://placehold.co/1200x700/e2e8f0/94a3b8?text=Tem+Aki"}
              alt={business.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute left-space-5 top-space-5 rounded-full bg-white/92 px-space-4 py-space-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B86A1A] shadow-sm">
              {business.category?.name || "Geral"}
            </div>
          </div>

          <div className="p-space-6 md:p-space-8">
            <div className="flex flex-col gap-space-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full bg-[#FFF4E7] px-space-3 py-space-2 text-text-xs font-bold uppercase tracking-wider text-[#B86A1A]">
                  {(business.subcategory?.name ? `${business.category?.name || "Geral"} • ${business.subcategory.name}` : business.category?.name || "Geral")}
                </div>
                <h1 className="mt-space-2 text-text-3xl md:text-text-4xl font-bold text-text-primary">{business.name}</h1>
                {business.main_product && (
                  <p className="mt-space-2 text-text-lg text-text-secondary">{business.main_product}</p>
                )}
                <div className="mt-space-4 flex flex-wrap items-center gap-space-3 text-text-sm text-text-secondary">
                  <div className="flex items-center gap-1 rounded-full bg-[#FFF6ED] px-space-3 py-space-2">
                    <Star className="h-4 w-4 fill-status-warning text-status-warning" />
                    <span className="font-semibold text-text-primary">{typeof avgRating === "number" ? avgRating.toFixed(1) : "Novo"}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-space-3 py-space-2">({reviews.length} avaliações)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-space-2">
                {normalizeInstagramUrl(business.instagram) && (
                  <a
                    href={normalizeInstagramUrl(business.instagram) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border-subtle bg-white px-space-4 text-text-sm font-medium text-text-secondary shadow-sm"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border-subtle bg-white px-space-4 text-text-sm font-medium text-text-secondary shadow-sm"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Site
                  </a>
                )}
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border-subtle bg-white px-space-4 text-text-sm font-medium text-text-secondary shadow-sm"
                  onClick={() => registerEvent("map_click", { location: "top_actions" })}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Localização
                </a>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border-subtle bg-white px-space-4 text-text-sm font-medium text-text-secondary shadow-sm"
                    onClick={() => registerEvent("whatsapp_click", { location: "top_actions" })}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="mt-space-8 grid grid-cols-1 lg:grid-cols-3 gap-space-6">
              <div className="lg:col-span-2 space-y-space-6">
                <section className="rounded-[26px] border border-black/5 bg-gradient-to-br from-white to-[#FFF8F1] p-space-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
                  <h2 className="text-text-xl font-bold text-text-primary">Sobre</h2>
                  <p className="mt-space-3 text-text-secondary whitespace-pre-line leading-7">
                    {business.description || "Nenhuma descrição disponível."}
                  </p>
                </section>

                {imageUrls.length > 0 && (
                  <section className="rounded-[26px] border border-black/5 bg-white p-space-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
                    <div className="flex items-end justify-between gap-space-4">
                      <div>
                        <h2 className="text-text-xl font-bold text-text-primary">Galeria de Fotos</h2>
                        <p className="mt-1 text-text-sm text-text-muted">
                          Deslize para o lado para ver mais fotos.
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full bg-surface-subtle px-space-3 py-1 text-text-xs font-semibold text-text-muted">
                        {activeImageIndex + 1} / {imageUrls.length}
                      </div>
                    </div>

                    <div
                      ref={galleryTrackRef}
                      className="mt-space-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory [scrollbar-width:none]"
                      onScroll={(e) => handleGalleryScroll(e.currentTarget)}
                    >
                      <div className="flex">
                        {imageUrls.map((url, index) => (
                          <button
                            key={url}
                            type="button"
                            className="relative shrink-0 w-full snap-start"
                            onClick={() => openViewerAt(index)}
                          >
                            <div className="overflow-hidden rounded-[24px] bg-surface-subtle shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                              <div className="aspect-[4/3] md:aspect-[16/10]">
                                <img src={url} alt={`${business.name} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {imageUrls.length > 1 && (
                      <div className="mt-space-4 flex items-center justify-center gap-space-2">
                        {imageUrls.map((url, index) => (
                          <button
                            key={`${url}-dot`}
                            type="button"
                            onClick={() => {
                              setActiveImageIndex(index);
                              scrollToIndex(galleryTrackRef.current, index);
                            }}
                            className={`h-2.5 rounded-full transition-all ${index === activeImageIndex ? "w-6 bg-action-primary" : "w-2.5 bg-border-default"
                              }`}
                            aria-label={`Ir para foto ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                <section className="rounded-[26px] border border-black/5 bg-white p-space-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
                  <h2 className="text-text-xl font-bold text-text-primary">Avaliações</h2>
                  <p className="mt-space-2 text-text-sm text-text-secondary">
                    Envie sua opinião. Ela fica pendente até a análise do administrador.
                  </p>

                  <form onSubmit={handleSubmitReview} className="mt-space-5 space-y-space-4">
                    <div>
                      <label htmlFor="app-review-author" className="block text-text-sm font-semibold text-text-primary mb-space-2">
                        Nome ou apelido
                      </label>
                      <Input
                        id="app-review-author"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        maxLength={80}
                        placeholder="Ex.: Maria, Joao do Bairro"
                        disabled={submittingReview}
                      />
                    </div>

                    <div>
                      <div className="text-text-sm font-semibold text-text-primary mb-space-3">Sua nota</div>
                      <div className="flex items-center justify-between gap-space-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            disabled={submittingReview}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-surface-subtle transition-transform hover:scale-105 disabled:opacity-60"
                            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                          >
                            <Star className={`h-7 w-7 ${star <= rating ? "fill-status-warning text-status-warning" : "text-text-muted"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="app-review-comment" className="block text-text-sm font-semibold text-text-primary mb-space-2">
                        Comentário opcional
                      </label>
                      <textarea
                        id="app-review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                        disabled={submittingReview}
                        placeholder="Conte como foi sua experiência."
                        className="min-h-[120px] w-full resize-none rounded-radius-xl border border-border-default bg-surface-subtle p-space-4 text-text-primary outline-none transition-all focus:border-border-focus focus:bg-surface-card focus:ring-4 focus:ring-border-focus/10"
                      />
                      <div className="mt-space-2 text-text-xs text-text-muted">{comment.length}/500 caracteres</div>
                    </div>

                    {reviewError && (
                      <div className="rounded-radius-xl border border-status-error/20 bg-status-error/10 px-space-4 py-space-3 text-text-sm text-status-error">
                        {reviewError}
                      </div>
                    )}

                    {reviewFeedback && (
                      <div className="rounded-radius-xl border border-status-success/20 bg-status-success/10 px-space-4 py-space-3 text-text-sm text-status-success">
                        {reviewFeedback}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12" disabled={submittingReview || rating < 1 || !authorName.trim()}>
                      {submittingReview ? "Enviando..." : "Enviar Avaliação"}
                    </Button>
                  </form>

                  <div className="mt-space-6 space-y-space-4">
                    {reviews.length ? (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-[22px] border border-black/5 bg-[#FAFAF8] p-space-4">
                          <div className="flex items-start justify-between gap-space-3">
                            <div>
                              <div className="font-semibold text-text-primary">
                                {review.author_name || review.user?.username || review.user?.name || "Cliente"}
                              </div>
                              <div className="mt-1 flex items-center gap-space-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-status-warning text-status-warning" : "text-text-muted"}`} />
                                  ))}
                                </div>
                                {safeDateLabel(review.created_at) && (
                                  <span className="text-text-xs text-text-muted">{safeDateLabel(review.created_at)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {review.content ? (
                            <p className="mt-space-3 whitespace-pre-line text-text-secondary">{review.content}</p>
                          ) : (
                            <p className="mt-space-3 text-text-sm text-text-muted">Sem comentário adicional.</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-black/5 bg-[#FAFAF8] p-space-4 text-text-secondary">
                        Nenhuma avaliação aprovada ainda.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-space-4">
                <section className="rounded-[26px] border border-black/5 bg-white p-space-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
                  <h2 className="text-text-xl font-bold text-text-primary">Contato</h2>
                  <div className="mt-space-4 space-y-space-4 text-text-secondary">
                    <div>
                      <div className="text-text-xs font-bold uppercase tracking-wider text-text-muted">Telefone</div>
                      {business.phone ? (
                        <a
                          href={`tel:${business.phone}`}
                          onClick={() => registerEvent("phone_click", { location: "contact_card" })}
                          className="mt-space-1 inline-flex items-center gap-2 text-action-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {formatPhone(business.phone)}
                        </a>
                      ) : (
                        <div className="mt-space-1">Não informado</div>
                      )}
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

                <section className="rounded-[26px] border border-black/5 bg-white p-space-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
                  <h2 className="text-text-xl font-bold text-text-primary">Endereço</h2>
                  <div className="mt-space-4 text-text-secondary space-y-space-4">
                    <div>
                      {[business.address, business.neighborhood, business.city, business.state].filter(Boolean).join(", ") || "Endereço não informado"}
                    </div>
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-action-primary font-semibold hover:underline"
                      onClick={() => registerEvent("map_click", { location: "address_card" })}
                    >
                      <MapPin className="h-4 w-4" />
                      Abrir no mapa
                    </a>
                  </div>
                </section>

                {openingHoursText && (
                  <section className="rounded-[26px] border border-black/5 bg-white p-space-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
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
              {activeImageIndex + 1} / {imageUrls.length}
            </div>
            <div className="flex items-center gap-space-2">
              <button
                type="button"
                onClick={handleShare}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
                aria-label="Compartilhar imagem"
              >
                <Share2 className="h-5 w-5" />
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

          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
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

            <div
              ref={viewerTrackRef}
              className="h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none]"
              onScroll={(e) => handleGalleryScroll(e.currentTarget)}
            >
              <div className="flex h-full">
                {imageUrls.map((url, index) => (
                  <div key={`${url}-viewer`} className="shrink-0 w-full h-full snap-start flex items-center justify-center p-space-4">
                    <img
                      src={url}
                      alt={`${business.name} ${index + 1}`}
                      className="max-w-full max-h-[74vh] object-contain"
                    />
                  </div>
                ))}
              </div>
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
            <div className="px-space-4 py-space-4 border-t border-white/10">
              <div className="mb-space-4 text-center text-white/70 text-text-sm">
                Deslize para o lado para ver mais fotos
              </div>
              <div className="flex items-center justify-center gap-space-2">
                {imageUrls.map((url, index) => (
                  <button
                    key={`${url}-viewer-dot`}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(index);
                      scrollToIndex(viewerTrackRef.current, index);
                    }}
                    className={`h-2.5 rounded-full transition-all ${index === activeImageIndex ? "w-6 bg-white" : "w-2.5 bg-white/30"}`}
                    aria-label={`Ir para foto ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border-subtle bg-surface-card/95 backdrop-blur md:hidden">
        <div className="container mx-auto px-space-4 py-space-3 grid grid-cols-2 gap-space-3">
          {business.phone ? (
            <a
              href={`tel:${business.phone}`}
              className="block"
              onClick={() => registerEvent("phone_click", { location: "bottom_cta" })}
            >
              <Button className="w-full h-12 bg-[#B56422] hover:bg-[#9d561e] border-none">
                <Phone className="h-5 w-5 mr-space-2" />
                Ligar
              </Button>
            </a>
          ) : (
            <Button disabled className="w-full h-12 bg-[#B56422] border-none">
              <Phone className="h-5 w-5 mr-space-2" />
              Ligar
            </Button>
          )}

          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              onClick={() => registerEvent("whatsapp_click", { location: "bottom_cta" })}
            >
              <Button className="w-full h-12 bg-status-success border-none">
                <MessageCircle className="h-5 w-5 mr-space-2" />
                WhatsApp
              </Button>
            </a>
          ) : (
            <Button disabled className="w-full h-12 bg-status-success border-none">
              <MessageCircle className="h-5 w-5 mr-space-2" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
