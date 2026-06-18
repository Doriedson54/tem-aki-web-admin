import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Filter, MapPin, MessageCircle, Phone, Search } from "lucide-react";
import api from "../services/api";
import type { ApiResponse, Business, Category, Subcategory } from "../types";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { appMeta } from "../config/appMeta";

function DirectorySkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.06)]">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-space-3 p-space-4 md:p-space-5">
        <div className="flex items-center justify-between gap-space-3">
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="space-y-space-2">
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="space-y-space-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

const BusinessListItem = memo(function BusinessListItem({ business }: { business: Business }) {
  const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
  const reviewsLabel = reviewCount === 1 ? "avaliação" : "avaliações";
  const ratingText = business.rating ? Number(business.rating).toFixed(1) : null;

  return (
    <Link
      to={`/app/business/${business.id}`}
      className="group overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(15,23,42,0.10)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-subtle">
        <img
          src={business.image_url || business.logo_url || "https://placehold.co/640x480/e2e8f0/94a3b8?text=Tem+Aki"}
          alt={business.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-space-4 top-space-4 rounded-full bg-white/90 px-space-3 py-space-2 text-[11px] font-semibold uppercase tracking-wide text-[#B86A1A] shadow-sm">
          {business.category?.name || "Geral"}
        </div>
      </div>
      <div className="p-space-4 md:p-space-5 space-y-space-3">
        <div className="flex items-center justify-between gap-space-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {business.subcategory?.name || "Catálogo local"}
          </span>
          <span className="rounded-full bg-[#FFF6ED] px-space-3 py-1 text-text-xs font-semibold text-[#8E5316]">
            {ratingText ? `★ ${ratingText}${reviewCount > 0 ? ` (${reviewCount} ${reviewsLabel})` : ""}` : "Sem avaliação"}
          </span>
        </div>

        <div>
          <h2 className="text-[18px] md:text-text-xl font-bold text-text-primary leading-tight line-clamp-2">{business.name}</h2>
          {business.main_product && (
            <p className="mt-1 text-text-sm text-text-secondary line-clamp-1">{business.main_product}</p>
          )}
        </div>

        <div className="space-y-space-2 text-text-sm text-text-secondary">
          <div className="flex items-start gap-space-2">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-text-muted" />
            <span className="line-clamp-2">
              {[business.address, business.neighborhood, business.city].filter(Boolean).join(", ") || "Endereço não informado"}
            </span>
          </div>
          <div className="flex items-center gap-space-4">
            {business.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-4 w-4 text-text-muted" />
                Telefone
              </span>
            )}
            {(business.whatsapp || business.phone) && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-text-muted" />
                WhatsApp
              </span>
            )}
          </div>
        </div>

        <div className="pt-space-3 border-t border-border-default text-[#B86A1A] text-text-sm font-semibold inline-flex items-center gap-1">
          Ver detalhes
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
});

export function AppDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get("subcategory") || "");
  const [isFilterFocused, setIsFilterFocused] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const filterCardRef = useRef<HTMLDivElement | null>(null);
  const blurTimeoutRef = useRef<number | null>(null);
  const favoritesOnly = searchParams.get("favorites") === "1";

  const getLocalFavoriteIds = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(appMeta.favoritesStorageKey);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  };

  const allowedCategoryNames = useMemo(
    () => [
      "Comércio",
      "Serviços",
      "Escolar",
      "Instituições Públicas",
      "Instituições Comunitárias",
      "Instituições Religiosas",
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get<ApiResponse<Category[]>>("/categories");
        if (!response.data.success) return;
        const byName = new Map(response.data.data.map((c) => [c.name, c]));
        const ordered = allowedCategoryNames.map((n) => byName.get(n)).filter((c): c is Category => Boolean(c));
        setCategories(ordered.length ? ordered : response.data.data);
      } catch {
      }
    })();
  }, [allowedCategoryNames]);

  useEffect(() => {
    const categoryId = String(selectedCategory || "").trim();
    if (!categoryId) {
      setSubcategories([]);
      setSelectedSubcategory("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const resp = await api.get<ApiResponse<Subcategory[]>>(`/subcategories?category=${encodeURIComponent(categoryId)}`);
        if (cancelled) return;
        if (resp.data.success && Array.isArray(resp.data.data)) {
          setSubcategories(resp.data.data);
          setSelectedSubcategory((prev) => {
            if (!prev) return "";
            return resp.data.data.some((s) => s.id === prev) ? prev : "";
          });
        } else {
          setSubcategories([]);
          setSelectedSubcategory("");
        }
      } catch {
        if (!cancelled) {
          setSubcategories([]);
          setSelectedSubcategory("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  useEffect(() => {
    setName(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedSubcategory(searchParams.get("subcategory") || "");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const subcategory = searchParams.get("subcategory");

        if (search) params.search = search;
        if (category) params.category = category;
        if (subcategory) params.subcategory = subcategory;

        const response = await api.get<ApiResponse<Business[]>>("/businesses", { params });
        let items = Array.isArray(response.data?.data) ? response.data.data : [];
        if (favoritesOnly) {
          const favoriteIds = new Set(getLocalFavoriteIds());
          items = items.filter((item) => favoriteIds.has(item.id));
        }
        if (!cancelled) setBusinesses(items);
      } catch {
        if (!cancelled) setBusinesses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [favoritesOnly, searchParams]);

  useEffect(() => {
    if (!isFilterFocused) {
      setKeyboardInset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset > 0 ? inset : 0);
    };

    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, [isFilterFocused]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const scrollFiltersIntoView = () => {
    const target = filterCardRef.current;
    if (!target) return;
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, 150);
  };

  const handleFieldFocus = () => {
    if (blurTimeoutRef.current !== null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFilterFocused(true);
    scrollFiltersIntoView();
  };

  const handleFieldBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsFilterFocused(false);
      setKeyboardInset(0);
    }, 180);
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (name.trim()) params.search = name.trim();
    if (selectedCategory) params.category = selectedCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setName("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSearchParams({});
  };

  const activeFilterCount = [name.trim(), selectedCategory, selectedSubcategory].filter(Boolean).length;

  return (
    <div
      className="min-h-screen bg-[#F7F7F5] pb-space-12"
      style={{ paddingBottom: keyboardInset > 0 ? `${keyboardInset + 20}px` : undefined }}
    >
      <section className="container mx-auto px-space-4 pt-space-4 pb-space-5 md:py-space-10">
        <div
          ref={filterCardRef}
          className="overflow-hidden rounded-[30px] border border-black/5 bg-white p-space-4 shadow-[0_24px_50px_rgba(15,23,42,0.08)] md:p-space-8"
        >
          <div className="mb-space-6 flex flex-wrap items-center gap-space-3">
            <div className="rounded-full bg-[#FFF4E7] px-space-4 py-space-2 text-text-xs font-semibold uppercase tracking-[0.18em] text-[#B86A1A]">
              {favoritesOnly ? "Favoritos" : "Busca Inteligente"}
            </div>
            <div className="rounded-full bg-slate-100 px-space-4 py-space-2 text-text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              {activeFilterCount > 0 ? `${activeFilterCount} filtro(s)` : "Sem filtros"}
            </div>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-text-2xl md:text-[3rem] font-bold text-text-primary leading-tight">
              {favoritesOnly ? "Seus Favoritos" : "Encontre no Tem Aki"}
            </h1>
            <p className="mt-1 md:mt-space-2 text-text-secondary text-text-sm md:text-text-lg">
              {favoritesOnly
                ? "Veja os negocios que voce marcou como favoritos no aplicativo."
                : "Consulte com rapidez comercios, servicos e instituicoes do bairro."}
            </p>
          </div>

          <div className="mt-space-4 md:mt-space-6 grid grid-cols-1 md:grid-cols-12 gap-space-3 md:gap-space-4 items-end">
            <div className="md:col-span-4">
              <label className="text-text-xs font-bold text-text-primary/70 uppercase tracking-widest mb-space-3 block ml-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5" />
                <Input
                  className="pl-12 h-12 md:h-14 bg-surface-subtle border-border-subtle rounded-[18px]"
                  placeholder="Ex: farmácia, oficina, escola"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="text-text-xs font-bold text-text-primary/70 uppercase tracking-widest mb-space-3 block ml-1">Categoria</label>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 pointer-events-none" />
                <select
                  className="w-full h-12 md:h-14 pl-12 pr-space-10 bg-surface-subtle border border-border-subtle rounded-[18px] focus:outline-none focus:border-action-primary appearance-none text-text-primary"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("");
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="text-text-xs font-bold text-text-primary/70 uppercase tracking-widest mb-space-3 block ml-1">Subcategoria</label>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 pointer-events-none" />
                <select
                  className="w-full h-12 md:h-14 pl-12 pr-space-10 bg-surface-subtle border border-border-subtle rounded-[18px] focus:outline-none focus:border-action-primary appearance-none text-text-primary disabled:opacity-60"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={!selectedCategory || subcategories.length === 0}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                >
                  <option value="">Todas as subcategorias</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-4 md:mt-space-6 flex flex-col sm:flex-row gap-space-3 sm:items-center sm:justify-between">
            <div className="flex gap-space-3">
              <Button onClick={handleSearch} size="sm" className="h-11 rounded-[16px] px-6">Buscar</Button>
              <Button variant="secondary" onClick={clearFilters} size="sm" className="h-11 rounded-[16px] px-5">Limpar</Button>
            </div>
            <div className="rounded-full bg-slate-100 px-space-4 py-space-2 text-text-sm font-medium text-text-muted">
              {loading ? "Carregando..." : favoritesOnly ? `${businesses.length} favorito(s)` : `${businesses.length} resultado(s)`}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-space-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-space-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-space-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <DirectorySkeletonCard key={index} />
            ))}
          </div>
        ) : businesses.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-4 md:gap-space-5">
            {businesses.map((business) => (
              <BusinessListItem key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-black/5 bg-white p-space-8 text-center shadow-[0_18px_34px_rgba(15,23,42,0.06)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#FFF4E7] text-[#B86A1A]">
              <Search className="h-5 w-5" />
            </div>
            <div className="mt-space-4 text-text-lg font-bold text-text-primary">Nenhum negócio encontrado</div>
            <div className="mt-space-2 text-text-secondary">Tente ajustar os filtros ou buscar por outro termo.</div>
          </div>
        )}
      </section>
    </div>
  );
}
