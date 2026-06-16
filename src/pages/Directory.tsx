import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Filter, Search } from "lucide-react";
import axios from "axios";
import api from "../services/api";
import type { ApiResponse, Business, Category, Subcategory } from "../types";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { BusinessCard } from "../components/BusinessCard";
import { MapComponent, type MapMarker } from "../components/MapComponent";
import { favoritesService } from "../services/favorites";
import { useAuth } from "../contexts/AuthContext";

type DirectoryMode = "site" | "app";

type DirectoryProps = {
  mode?: DirectoryMode;
  detailsPathPrefix?: string;
};

export function Directory({ mode = "site", detailsPathPrefix }: DirectoryProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [favorites, setFavorites] = useState<string[]>([]);
  const showFavorites = mode === "site";

  const [name, setName] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get("subcategory") || "");

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

        const current = searchParams.get("category") || "";
        if (current && !(ordered.length ? ordered : response.data.data).some((c) => c.id === current)) {
          setSelectedCategory("");
          setSelectedSubcategory("");
          const params = new URLSearchParams(searchParams);
          params.delete("category");
          params.delete("subcategory");
          setSearchParams(params);
        }
      } catch {
      }
    })();
  }, [allowedCategoryNames, searchParams, setSearchParams]);

  useEffect(() => {
    if (!showFavorites || !user) return;
    (async () => {
      try {
        const data = await favoritesService.getAll();
        if (data.success) setFavorites(data.data.map((f) => f.business_id));
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
      }
    })();
  }, [showFavorites, user]);

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
            const exists = resp.data.data.some((s) => s.id === prev);
            return exists ? prev : "";
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
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const subcategory = searchParams.get("subcategory");

        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (category) params.category = category;
        if (subcategory) params.subcategory = subcategory;

        const response = await api.get<ApiResponse<Business[]>>("/businesses", { params });
        const fetchedBusinesses = Array.isArray(response.data?.data) ? response.data.data : [];

        if (search && fetchedBusinesses.length === 0) {
          try {
            const fallback = await api.get<ApiResponse<Business[]>>("/businesses/search", { params: { q: search } });
            const fallbackItems = Array.isArray(fallback.data?.data) ? fallback.data.data : [];
            const filteredFallback = fallbackItems.filter((b) => {
              if (category && b.category_id !== category) return false;
              if (subcategory && b.subcategory_id !== subcategory) return false;
              return true;
            });
            fetchedBusinesses.splice(0, fetchedBusinesses.length, ...filteredFallback);
          } catch {
          }
        }

        fetchedBusinesses.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        if (!cancelled) setBusinesses(fetchedBusinesses);
      } catch {
        if (!cancelled) setBusinesses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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
    setViewMode("grid");
    setSearchParams({});
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, businessId: string) => {
    e.preventDefault();
    if (!showFavorites) return;
    if (!user) {
      alert("Faça login para adicionar aos favoritos!");
      return;
    }
    try {
      if (favorites.includes(businessId)) {
        await favoritesService.remove(businessId);
        setFavorites((prev) => prev.filter((x) => x !== businessId));
      } else {
        await favoritesService.add(businessId);
        setFavorites((prev) => [...prev, businessId]);
      }
    } catch {
    }
  };

  const mapMarkers = useMemo<MapMarker[]>(
    () =>
      businesses
        .filter((b) => b.latitude && b.longitude)
        .map((b) => ({
          id: b.id,
          position: [Number(b.latitude), Number(b.longitude)],
          title: b.name,
          popupContent: (
            <div>
              <p className="text-xs text-text-muted mb-1">
                {b.category?.name}
                {b.subcategory?.name ? ` • ${b.subcategory.name}` : ""}
              </p>
              <Link to={`${detailsPathPrefix || ""}/business/${b.id}`} className="text-action-primary hover:underline">
                Ver detalhes
              </Link>
            </div>
          ),
        })),
    [businesses, detailsPathPrefix]
  );

  return (
    <div className="min-h-screen bg-surface-page pb-space-20">
      <div className="bg-surface-section border-b border-border-default relative overflow-hidden">
        <div className="absolute inset-0 bg-action-primary/[0.02] -skew-y-3 origin-top-right transform scale-110"></div>
        <div className="container mx-auto px-space-4 py-space-12 md:py-space-16 relative">
          <div className="flex flex-col md:flex-row justify-between items-end gap-space-8">
            <div className="max-w-2xl">
              {mode === "app" ? (
                <>
                  <h1 className="text-text-3xl md:text-text-4xl font-bold text-text-primary tracking-tight mb-space-3">
                    Buscar no <span className="text-action-primary">Tem Aki</span>
                  </h1>
                  <p className="text-text-secondary text-text-base md:text-text-lg leading-relaxed">
                    Pesquise comércios, serviços e instituições do bairro.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-text-4xl md:text-text-5xl font-bold text-text-primary tracking-tight mb-space-4">
                    Encontre o que você precisa no <span className="text-action-primary">Bairro</span>
                  </h1>
                  <p className="text-text-secondary text-text-lg md:text-text-xl leading-relaxed">
                    Descubra estabelecimentos locais, serviços e ofertas exclusivas perto de você.
                  </p>
                </>
              )}
            </div>
            {mode !== "app" && (
              <div className="flex items-center gap-space-4 w-full md:w-auto">
                <div className="bg-surface-subtle p-1 rounded-radius-xl flex border border-border-default shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-space-6 py-space-2.5 rounded-radius-lg text-text-sm font-semibold transition-all ${viewMode === "grid" ? "bg-surface-card shadow-md text-action-primary" : "text-text-muted hover:text-text-primary"
                      }`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-space-6 py-space-2.5 rounded-radius-lg text-text-sm font-semibold transition-all ${viewMode === "map" ? "bg-surface-card shadow-md text-action-primary" : "text-text-muted hover:text-text-primary"
                      }`}
                  >
                    Mapa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-space-4 relative -mt-10 z-10">
        <div className="bg-surface-card p-space-6 md:p-space-8 rounded-radius-2xl shadow-lg border border-border-subtle mb-space-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-6 items-end">
            <div className="md:col-span-4">
              <label className="text-text-xs font-bold text-text-primary/70 uppercase tracking-widest mb-space-3 block ml-1">O que você procura?</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 group-focus-within:text-action-primary transition-colors" />
                <Input
                  className="pl-12 h-14 bg-surface-subtle border-border-subtle focus:bg-surface-card shadow-sm rounded-radius-xl"
                  placeholder="Ex: Pizzaria, Mecânica..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="text-text-xs font-bold text-text-primary/70 uppercase tracking-widest mb-space-3 block ml-1">Categoria</label>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 group-focus-within:text-action-primary transition-colors pointer-events-none" />
                <select
                  className="w-full h-14 pl-12 pr-space-10 bg-surface-subtle border border-border-subtle rounded-radius-xl focus:outline-none focus:border-action-primary focus:ring-4 focus:ring-action-primary/10 appearance-none text-text-primary font-medium cursor-pointer shadow-sm transition-all hover:border-border-default"
                  value={selectedCategory}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedCategory(next);
                    setSelectedSubcategory("");
                  }}
                >
                  <option value="">Todas as Categorias</option>
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
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 group-focus-within:text-action-primary transition-colors pointer-events-none" />
                <select
                  className="w-full h-14 pl-12 pr-space-10 bg-surface-subtle border border-border-subtle rounded-radius-xl focus:outline-none focus:border-action-primary focus:ring-4 focus:ring-action-primary/10 appearance-none text-text-primary font-medium cursor-pointer shadow-sm transition-all hover:border-border-default disabled:opacity-60 disabled:cursor-not-allowed"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={!selectedCategory || subcategories.length === 0}
                >
                  <option value="">Todas as Subcategorias</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-6 flex flex-col sm:flex-row gap-space-3 sm:items-center sm:justify-between">
            <div className="flex gap-space-3">
              <Button onClick={handleSearch} className="h-11 px-8">
                Buscar
              </Button>
              <Button variant="secondary" onClick={clearFilters} className="h-11 px-6">
                Limpar
              </Button>
            </div>
            <div className="text-text-sm text-text-muted">
              {loading ? "Carregando..." : `${businesses.length} resultado(s)`}
            </div>
          </div>
        </div>

        {mode !== "app" && viewMode === "map" ? (
          mapMarkers.length ? (
            <MapComponent center={mapMarkers[0]?.position} zoom={13} markers={mapMarkers} className="h-[520px] w-full" />
          ) : (
            <div className="bg-surface-card p-space-8 rounded-radius-2xl border border-border-subtle text-text-secondary">
              Nenhum negócio com localização disponível.
            </div>
          )
        ) : loading ? (
          <div className="flex justify-center items-center py-space-12 text-action-primary">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
          </div>
        ) : businesses.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-6">
            {businesses.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                detailsPathPrefix={detailsPathPrefix}
                showFavorite={showFavorites}
                isFavorite={favorites.includes(b.id)}
                onToggleFavorite={(e) => toggleFavorite(e, b.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface-card p-space-8 rounded-radius-2xl border border-border-subtle text-text-secondary">
            Nenhum negócio encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
