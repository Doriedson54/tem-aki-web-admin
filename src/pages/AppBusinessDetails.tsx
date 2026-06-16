import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Globe, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import api from "../services/api";
import type { Business, BusinessImage } from "../types";
import { Button } from "../components/ui/Button";

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

  const imageUrls = useMemo(() => {
    const urls = [business?.image_url, business?.logo_url, ...images.map((img) => img.image_url)].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );
    return [...new Set(urls)];
  }, [business?.image_url, business?.logo_url, images]);

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

                {imageUrls.length > 1 && (
                  <section className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6">
                    <h2 className="text-text-xl font-bold text-text-primary">Fotos</h2>
                    <div className="mt-space-4 grid grid-cols-2 md:grid-cols-3 gap-space-4">
                      {imageUrls.map((url) => (
                        <div key={url} className="overflow-hidden rounded-radius-xl bg-surface-subtle aspect-[4/3]">
                          <img src={url} alt={business.name} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
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
    </div>
  );
}
