import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Facebook, Globe, Instagram, MapPin, MessageCircle, Phone, Share2, Star } from "lucide-react";
import { Heart } from "lucide-react";
import api from "../services/api";
import type { Business, BusinessImage, Review } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { MapComponent, type MapMarker } from "../components/MapComponent";
import { favoritesService } from "../services/favorites";
import { trackBusinessEvent } from "../services/businessEvents";
import { useAuth } from "../contexts/AuthContext";

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

function safeDateLabel(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
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

type BusinessDetailsMode = "site" | "app";

type BusinessDetailsProps = {
  mode?: BusinessDetailsMode;
  backTo?: string;
};

export function BusinessDetails({ mode = "site", backTo }: BusinessDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewError, setReviewError] = useState("");
  const trackedViewRef = useRef<string | null>(null);

  const { user } = useAuth();
  const allowAccountFeatures = mode === "site";
  const resolvedBackTo = backTo || (mode === "app" ? "/app" : "/directory");

  const imageUrls = useMemo(() => {
    const urls = [business?.image_url, business?.logo_url, ...(images || []).map((img) => img?.image_url)].filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0
    );
    const unique = new Set<string>();
    const result: string[] = [];
    for (const u of urls) {
      if (unique.has(u)) continue;
      unique.add(u);
      result.push(u);
    }
    return result;
  }, [business?.image_url, business?.logo_url, images]);

  const openImageViewer = useCallback(
    (url: string) => {
      const index = imageUrls.indexOf(url);
      setImageViewerIndex(index >= 0 ? index : 0);
      setImageViewerOpen(true);
    },
    [imageUrls]
  );

  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
  }, []);

  const showPrevImage = useCallback(() => {
    setImageViewerIndex((prev) => (prev - 1 + imageUrls.length) % Math.max(imageUrls.length, 1));
  }, [imageUrls.length]);

  const showNextImage = useCallback(() => {
    setImageViewerIndex((prev) => (prev + 1) % Math.max(imageUrls.length, 1));
  }, [imageUrls.length]);

  useEffect(() => {
    let cancelled = false;

    const fetchBusiness = async () => {
      try {
        const response = await api.get(`/businesses/${id}`);
        const data = response.data?.data ?? response.data;
        if (!cancelled && data) setBusiness(data as Business);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchImages = async () => {
      try {
        const response = await api.get(`/business-images/${id}`);
        const data = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
        if (!cancelled) setImages(data as BusinessImage[]);
      } catch {
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await api.get(`/reviews/${id}`);
        const data = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
        if (!cancelled) setReviews(data as Review[]);
      } catch {
      }
    };

    if (id) {
      setLoading(true);
      fetchBusiness();
      fetchImages();
      fetchReviews();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!allowAccountFeatures || !id || !user) return;
    (async () => {
      try {
        const response = await favoritesService.check(id);
        setIsFavorite(Boolean(response.success && response.is_favorite));
      } catch {
      }
    })();
  }, [allowAccountFeatures, id, user]);

  const toggleFavorite = async () => {
    if (!allowAccountFeatures) return;
    if (!user) return navigate("/login", { state: { from: location } });
    if (!id) return;
    try {
      const next = !isFavorite;
      setIsFavorite(next);
      if (next) {
        await favoritesService.add(id);
        registerEvent("favorite", { location: "business_details" });
      } else {
        await favoritesService.remove(id);
      }
    } catch (e: unknown) {
      setIsFavorite((prev) => !prev);
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const msg = (e.response?.data as { message?: string } | undefined)?.message;
        console.error("Falha ao atualizar favorito", { status, message: msg, data: e.response?.data });
      } else {
        console.error("Falha ao atualizar favorito", e);
      }
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        navigate("/login", { state: { from: location } });
        return;
      }
      alert("Não foi possível atualizar o favorito. Tente novamente.");
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = business?.name || "Tem Aki no Bairro";
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
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
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setReviewError("");
    setReviewFeedback("");

    const trimmedAuthorName = authorName.trim();
    const trimmedComment = comment.trim();

    if (!trimmedAuthorName) {
      setReviewError('Informe seu nome ou apelido.');
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
        setComment("");
        setRating(0);
        setReviewFeedback("Obrigado! Sua avaliação foi enviada e será analisada antes da publicação.");
      } else {
        console.error("Erro ao enviar avaliação", response.data);
        setReviewError(response.data?.message || "Erro ao enviar avaliação. Tente novamente.");
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const msg = (e.response?.data as { message?: string } | undefined)?.message;
        console.error("Erro ao enviar avaliação", { status, message: msg, data: e.response?.data });
        setReviewError(msg || "Erro ao enviar avaliação. Tente novamente.");
      } else {
        console.error("Erro ao enviar avaliação", e);
        setReviewError("Erro ao enviar avaliação. Tente novamente.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const markers = useMemo<MapMarker[]>(() => {
    if (!business?.latitude || !business?.longitude) return [];
    return [
      {
        id: business.id,
        position: [Number(business.latitude), Number(business.longitude)],
        title: business.name,
      },
    ];
  }, [business?.id, business?.latitude, business?.longitude, business?.name]);

  const whatsappMessage = "Olá, vi seu perfil no Tem Aki no Bairro!";
  const whatsappValue = business?.whatsapp || business?.phone || "";
  const whatsappLink = buildWhatsAppLink(whatsappValue, whatsappMessage);
  const eventSource = mode === "app" ? "app" : "site";

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
    const sum = reviews.reduce((acc, r) => acc + (typeof r.rating === "number" ? r.rating : 0), 0);
    return sum / Math.max(reviews.length, 1);
  }, [business?.rating, reviews]);

  useEffect(() => {
    if (!business?.id || trackedViewRef.current === business.id) return;
    trackedViewRef.current = business.id;
    registerEvent("profile_view", { path: typeof window !== "undefined" ? window.location.pathname : "" });
  }, [business?.id, registerEvent]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-primary"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-page">
        <div className="text-center space-y-space-4">
          <h2 className="text-text-3xl font-bold text-text-primary">Negócio não encontrado</h2>
          <p className="text-text-secondary">O estabelecimento que você procura não está disponível.</p>
          <Link to={resolvedBackTo}>
            <Button variant="primary" className="mt-space-4 shadow-lg hover:shadow-xl transition-all">
              Voltar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-page min-h-screen pb-space-20 animate-fade-in">
      <div className="relative h-[400px] lg:h-[500px] w-full bg-black overflow-hidden group">
        <img
          src={business.image_url || "https://placehold.co/1200x500/1e293b/cbd5e1?text=Imagem+de+Capa"}
          alt={business.name}
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000 cursor-zoom-in"
          onClick={() => {
            if (!business.image_url) return;
            openImageViewer(business.image_url);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        <div className="absolute top-space-4 left-space-4 z-10">
          <Link to={resolvedBackTo}>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
              <ArrowLeft className="h-space-4 w-space-4 mr-space-2" /> Voltar
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-space-4 pb-space-12 lg:pb-space-16">
          <div className="flex flex-col md:flex-row items-end gap-space-8">
            <div className="bg-surface-card p-space-2 rounded-radius-2xl shadow-2xl -mb-16 md:-mb-20 shrink-0 transform rotate-1 hover:rotate-0 transition-transform duration-300 hidden md:block">
              <img
                src={business.logo_url || "https://placehold.co/150x150/f1f5f9/475569?text=Logo"}
                alt={`${business.name} Logo`}
                className="w-32 h-32 md:w-40 md:h-40 rounded-radius-xl object-cover border border-border-subtle cursor-zoom-in"
                onClick={() => {
                  if (!business.logo_url) return;
                  openImageViewer(business.logo_url);
                }}
              />
            </div>
            <div className="flex-1 text-text-on-dark relative z-10">
              <div className="flex items-center gap-space-3 mb-space-3">
                <span className="px-space-3 py-space-1 bg-action-primary text-text-on-brand text-text-xs font-bold rounded-radius-full uppercase tracking-wider shadow-lg">
                  {business.category?.name || "Geral"}
                </span>
                {business.status === "active" && (
                  <span className="flex items-center gap-space-1 text-status-success text-text-sm font-medium">
                    <CheckCircle2 className="h-space-4 w-space-4" /> Verificado
                  </span>
                )}
              </div>
              <h1 className="text-text-4xl md:text-text-6xl font-extrabold mb-space-3 tracking-tight leading-tight text-white">{business.name}</h1>
              <div className="flex flex-wrap items-center gap-space-6 text-gray-300 text-text-sm md:text-text-base font-medium">
                <div className="flex items-center gap-space-2">
                  <MapPin className="h-space-5 w-space-5 text-action-primary" />
                  <span>
                    {business.neighborhood} • {business.city}
                  </span>
                </div>
                <div className="flex items-center gap-space-1">
                  <Star className="h-space-5 w-space-5 text-status-warning fill-status-warning" />
                  <span className="text-white">{typeof avgRating === "number" ? avgRating.toFixed(1) : "Novo"}</span>
                  <span className="text-gray-400">({reviews.length} avaliações)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-space-3 w-full md:w-auto">
              {allowAccountFeatures && (
                <Button
                  variant="secondary"
                  onClick={toggleFavorite}
                  className={`flex-1 md:flex-none border-white/20 backdrop-blur-md transition-colors ${isFavorite ? "bg-white text-status-error hover:bg-white" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                >
                  <Heart className={`h-space-4 w-space-4 md:mr-space-2 ${isFavorite ? "fill-current" : ""}`} />
                  <span className="hidden md:inline">{isFavorite ? "Salvo" : "Salvar"}</span>
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleShare}
                className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
              >
                <Share2 className="h-space-4 w-space-4 md:mr-space-2" />
                <span className="hidden md:inline">Compartilhar</span>
              </Button>
              <a
                href={whatsappLink || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none"
                onClick={() => {
                  if (whatsappLink) registerEvent("whatsapp_click", { location: "hero" });
                }}
              >
                <Button disabled={!whatsappLink} className="w-full bg-status-success hover:shadow-lg transition-all border-none">
                  <MessageCircle className="h-space-4 w-space-4 mr-space-2" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-space-4 pt-space-24 md:pt-space-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-10">
          <div className="lg:col-span-8 space-y-space-12">
            <section className="bg-surface-card p-space-8 rounded-radius-2xl shadow-sm border border-border-subtle">
              <h2 className="text-text-2xl font-bold text-text-primary mb-space-6 flex items-center gap-space-2">
                <span className="w-1.5 h-space-8 bg-action-primary rounded-radius-full"></span>
                Sobre o Negócio
              </h2>
              <p className="text-text-secondary leading-8 whitespace-pre-line text-text-lg">{business.description || "Nenhuma descrição detalhada disponível."}</p>
              <div className="flex gap-space-4 mt-space-8 pt-space-8 border-t border-border-subtle">
                {normalizeInstagramUrl(business.instagram) && (
                  <a
                    href={normalizeInstagramUrl(business.instagram) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-space-3 bg-surface-subtle rounded-radius-full text-pink-600 hover:bg-pink-50 transition-colors"
                  >
                    <Instagram className="h-space-6 w-space-6" />
                  </a>
                )}
                {business.facebook && (
                  <a
                    href={business.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-space-3 bg-surface-subtle rounded-radius-full text-action-primary hover:bg-blue-50 transition-colors"
                  >
                    <Facebook className="h-space-6 w-space-6" />
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-space-3 bg-surface-subtle rounded-radius-full text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Globe className="h-space-6 w-space-6" />
                  </a>
                )}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-end mb-space-6">
                <h2 className="text-text-2xl font-bold text-text-primary flex items-center gap-space-2">
                  <span className="w-1.5 h-space-8 bg-action-primary rounded-radius-full"></span>
                  Imagens
                </h2>
                <span className="text-text-sm font-medium text-text-muted">{imageUrls.length} foto(s)</span>
              </div>
              {imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-space-4">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={url}
                      className={`relative group overflow-hidden rounded-radius-2xl cursor-zoom-in ${idx === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                      onClick={() => openImageViewer(url)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openImageViewer(url);
                      }}
                    >
                      <img
                        src={url}
                        alt={`Galeria ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-card p-space-12 rounded-radius-2xl border border-dashed border-border-default text-center">
                  <p className="text-text-secondary font-medium">Imagens em breve</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-text-2xl font-bold text-text-primary mb-space-8 flex items-center gap-space-2">
                <span className="w-1.5 h-space-8 bg-status-warning rounded-radius-full"></span>
                Avaliações
              </h2>

              <div className="bg-surface-card p-space-8 rounded-radius-2xl shadow-sm border border-border-subtle mb-space-8">
                <h3 className="font-bold text-text-lg mb-space-2 text-text-primary">Como foi sua experiência?</h3>
                <p className="text-text-sm text-text-secondary mb-space-6">
                  Sua avaliação fica pendente até a aprovação do administrador.
                </p>
                <form onSubmit={handleSubmitReview} className="space-y-space-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                    <div>
                      <label htmlFor="review-author-name" className="block text-text-sm font-semibold text-text-primary mb-space-2">
                        Nome ou apelido
                      </label>
                      <Input
                        id="review-author-name"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        maxLength={80}
                        placeholder="Ex.: Maria, Joao do Bairro"
                        disabled={submittingReview}
                      />
                    </div>
                    <div>
                      <div className="block text-text-sm font-semibold text-text-primary mb-space-2">
                        Sua nota
                      </div>
                      <div className="flex gap-space-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            disabled={submittingReview}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:opacity-60"
                            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`h-space-8 w-space-8 ${star <= rating ? "text-status-warning fill-status-warning drop-shadow-sm" : "text-text-muted"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="block text-text-sm font-semibold text-text-primary mb-space-2">
                      Comentário opcional
                    </label>
                    <textarea
                      id="review-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Conte detalhes sobre o atendimento, produtos ou serviço."
                      className="w-full p-space-4 rounded-radius-xl border border-border-default bg-surface-subtle focus:bg-surface-card focus:border-border-focus focus:ring-4 focus:ring-border-focus/10 outline-none transition-all min-h-[120px] resize-none text-text-primary"
                      maxLength={500}
                      disabled={submittingReview}
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

                  <Button
                    type="submit"
                    disabled={submittingReview || rating < 1 || !authorName.trim()}
                    className="rounded-radius-xl px-space-8 py-space-3 shadow-lg"
                  >
                    {submittingReview ? "Enviando..." : "Enviar Avaliação"}
                  </Button>
                </form>
              </div>

              <div className="space-y-space-4">
                {reviews.length ? (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-surface-card p-space-6 rounded-radius-2xl border border-border-subtle">
                      <div className="flex items-start justify-between gap-space-4">
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary">
                            {r.author_name || r.user?.username || r.user?.name || "Cliente"}
                          </div>
                          <div className="flex items-center gap-space-2 mt-space-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "text-status-warning fill-status-warning" : "text-text-muted"}`} />
                              ))}
                            </div>
                            {safeDateLabel(r.created_at) && <span className="text-text-xs text-text-muted">{safeDateLabel(r.created_at)}</span>}
                          </div>
                        </div>
                      </div>
                      {r.content ? (
                        <div className="mt-space-4 text-text-secondary whitespace-pre-line">{r.content}</div>
                      ) : (
                        <div className="mt-space-4 text-text-sm text-text-muted">Sem comentário adicional.</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-surface-card p-space-8 rounded-radius-2xl border border-border-subtle text-text-secondary">
                    Nenhuma avaliação aprovada ainda.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-space-8">
            <section className="bg-surface-card shadow-sm border border-border-subtle rounded-radius-2xl overflow-hidden">
              <div className="p-space-6">
                <h3 className="text-text-xl font-bold text-text-primary mb-space-6">Informações</h3>

                <div className="space-y-space-6">
                  <div className="flex gap-space-4">
                    <div className="shrink-0 mt-0.5">
                      <MapPin className="h-7 w-7 text-action-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-text-xs font-bold uppercase tracking-widest text-text-muted">Endereço</div>
                      <div className="text-text-secondary mt-space-2 break-words">{business.address}</div>
                      {business.neighborhood && <div className="text-text-sm text-text-muted mt-space-1">{business.neighborhood}</div>}
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-space-3 text-text-sm font-bold text-action-primary hover:underline"
                        onClick={() => registerEvent("map_click", { location: "sidebar" })}
                      >
                        Abrir no mapa
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-space-4">
                    <div className="shrink-0 mt-0.5">
                      <Phone className="h-7 w-7 text-action-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-text-xs font-bold uppercase tracking-widest text-text-muted">Contato</div>
                      {business.phone ? (
                        <a
                          className="block mt-space-2 text-text-lg font-bold text-text-primary hover:underline"
                          href={`tel:${business.phone}`}
                          onClick={() => registerEvent("phone_click", { location: "sidebar" })}
                        >
                          {formatPhone(business.phone)}
                        </a>
                      ) : (
                        <div className="mt-space-2 text-text-secondary">Não informado</div>
                      )}
                      <div className="mt-space-2 text-text-sm text-text-muted">
                        {whatsappLink ? "WhatsApp disponível" : "WhatsApp indisponível"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-space-4">
                    <div className="shrink-0 mt-0.5">
                      <Clock className="h-7 w-7 text-action-primary" />
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="text-text-xs font-bold uppercase tracking-widest text-text-muted">Horário</div>
                      <div className="mt-space-2 bg-surface-subtle border border-border-subtle rounded-radius-xl p-space-4">
                        <div className="text-text-secondary whitespace-pre-line">{openingHoursText || "Consulte detalhes"}</div>
                        <div className="text-text-xs text-text-muted mt-space-2">
                          {openingHoursText ? "Aberto hoje" : "Consulte detalhes"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-space-6">
                  <a
                    href={whatsappLink || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={() => {
                      if (whatsappLink) registerEvent("whatsapp_click", { location: "sidebar_cta" });
                    }}
                  >
                    <Button disabled={!whatsappLink} className="w-full h-12 bg-status-success border-none">
                      <MessageCircle className="h-5 w-5 mr-space-2" /> Mandar Mensagem
                    </Button>
                  </a>
                  <Button variant="secondary" onClick={handleShare} className="w-full mt-space-3 h-11">
                    <Share2 className="h-4 w-4 mr-space-2" /> Compartilhar
                  </Button>
                </div>
              </div>

              <div className="border-t border-border-subtle">
                {markers.length ? (
                  <MapComponent center={markers[0].position} zoom={15} markers={markers} className="h-[280px] w-full" />
                ) : (
                  <div className="p-space-6 text-text-sm text-text-muted">Coordenadas não informadas.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {imageViewerOpen && imageUrls.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-space-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={closeImageViewer}
              className="absolute -top-10 right-0 text-white/90 hover:text-white font-semibold"
            >
              Fechar
            </button>
            <div className="relative bg-black rounded-radius-2xl overflow-hidden">
              <img src={imageUrls[imageViewerIndex]} alt="Imagem" className="w-full max-h-[80vh] object-contain bg-black" />
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-radius-xl"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-radius-xl"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
