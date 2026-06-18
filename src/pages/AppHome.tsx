import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Search, Sparkles, Star } from "lucide-react";
import api from "../services/api";
import type { ApiResponse, Business, Category, Subcategory } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import heroBg from "../assets/hero-bg.jpg";
import logo from "../assets/logo-transparent.png";

const categoryColorClasses = [
  "from-action-primary/15 to-action-primary/5",
  "from-status-success/15 to-status-success/5",
  "from-status-warning/15 to-status-warning/5",
  "from-action-strong/15 to-action-strong/5",
  "from-indigo-500/15 to-indigo-500/5",
];

const allowedCategoryNames = [
  "Comércio",
  "Serviços",
  "Escolar",
  "Instituições Públicas",
  "Instituições Comunitárias",
  "Instituições Religiosas",
];

export function AppHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<Business[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [categoriesResponse, businessesResponse] = await Promise.all([
          api.get<ApiResponse<Category[]>>("/categories"),
          api.get<ApiResponse<Business[]>>("/businesses", { params: { limit: 6 } }),
        ]);

        const categoriesData = Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [];
        const orderedCategories = (() => {
          const byName = new Map(categoriesData.map((category) => [category.name, category]));
          const preferred = allowedCategoryNames.map((name) => byName.get(name)).filter((item): item is Category => Boolean(item));
          return preferred.length ? preferred : categoriesData;
        })();
        const businessesData = Array.isArray(businessesResponse.data?.data) ? businessesResponse.data.data : [];

        if (!cancelled) {
          setCategories(orderedCategories);
          setTopBusinesses(businessesData.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setTopBusinesses([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategory?.id) {
      setSubcategories([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingSubcategories(true);
      try {
        const response = await api.get<ApiResponse<Subcategory[]>>(`/subcategories?category=${encodeURIComponent(selectedCategory.id)}`);
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        if (!cancelled) setSubcategories(items);
      } catch {
        if (!cancelled) setSubcategories([]);
      } finally {
        if (!cancelled) setLoadingSubcategories(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory?.id]);

  const displayedCategories = useMemo(() => categories.slice(0, 5), [categories]);

  const searchExamples = useMemo(() => {
    const values = topBusinesses
      .flatMap((business) => [business.main_product, business.name, business.category?.name])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    return Array.from(new Set(values)).slice(0, 3);
  }, [topBusinesses]);

  const searchHelperText = searchExamples.length ? `Ex.: ${searchExamples.join(", ").toLowerCase()}` : "Ex.: farmácia, salão, eletricista";
  const canShowHighlights = false;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    navigate(`/app/lista${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      <section className="relative min-h-[78vh] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-surface-page" />

        <div className="relative container mx-auto flex min-h-[78vh] flex-col justify-end px-space-4 pb-space-8 pt-24">
          <div className="max-w-xl">
            <img src={logo} alt="Tem Aki no Bairro" className="mb-space-5 h-20 w-auto max-w-[320px] object-contain" />
            <div className="mb-space-4 inline-flex items-center rounded-radius-full border border-white/15 bg-white/10 px-space-3 py-2 text-text-xs font-semibold uppercase tracking-widest text-white/85 backdrop-blur">
              Nova Terra
            </div>
            <h1 className="text-text-4xl font-bold leading-tight text-white md:text-text-5xl">
              Tudo o que você procura está aqui
            </h1>
            <p className="mt-space-4 max-w-lg text-text-base leading-relaxed text-white/85 md:text-text-lg">
              Comércios, serviços, profissionais e instituições do Nova Terra em um só lugar.
            </p>
          </div>

          <Card className="mt-space-8 border-white/10 bg-surface-card/95 p-space-5 shadow-card backdrop-blur">
            <div className="space-y-space-4">
              <div>
                <label htmlFor="app-home-search" className="mb-space-2 block text-text-sm font-semibold text-text-primary">
                  O que você procura?
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="app-home-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                    placeholder="O que você procura?"
                    className="h-12 rounded-radius-xl border-border-subtle bg-surface-subtle pl-12"
                  />
                </div>
                <div className="mt-space-2 text-text-xs text-text-muted">{searchHelperText}</div>
              </div>

              <Button onClick={handleSearch} className="h-12 w-full rounded-radius-xl text-text-sm font-bold uppercase tracking-wide">
                Localizar Agora
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <section id="categorias" className="container mx-auto px-space-4 pt-space-6">
        <div className="mb-space-4 flex items-center justify-between gap-space-3">
          <div>
            <h2 className="text-text-xl font-bold text-text-primary">Navegar por Categorias</h2>
            <p className="mt-1 text-text-sm text-text-secondary">Use apenas dados reais do catálogo atual.</p>
          </div>
          <Link to="/app/lista" className="text-text-sm font-semibold text-action-primary">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-space-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-radius-2xl bg-surface-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-3 sm:grid-cols-3">
            {displayedCategories.map((category, index) => (
              <Link
                key={category.id}
                to={`/app/lista?category=${category.id}`}
                className={`rounded-radius-2xl border border-border-subtle bg-gradient-to-br p-space-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 ${categoryColorClasses[index % categoryColorClasses.length]}`}
              >
                <div className="text-text-2xl">{category.icon || category.name.slice(0, 1)}</div>
                <div className="mt-space-3 text-text-sm font-semibold text-text-primary">{category.name}</div>
              </Link>
            ))}

            <Link
              to="/app/lista"
              className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="text-text-2xl text-action-primary">+</div>
              <div className="mt-space-3 flex items-center justify-between gap-space-2 text-text-sm font-semibold text-text-primary">
                <span>Ver Todas</span>
                <ChevronRight className="h-4 w-4 text-action-primary" />
              </div>
            </Link>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="mt-space-4">
            <div className="mb-space-2 text-text-sm font-semibold text-text-primary">Explorar subcategorias por categoria</div>
            <div className="flex gap-space-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-radius-full border px-space-4 py-space-2 text-text-sm font-medium transition-colors ${
                    selectedCategory?.id === category.id
                      ? "border-action-primary bg-action-primary text-text-on-brand"
                      : "border-border-subtle bg-surface-card text-text-primary"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedCategory && (
        <section className="container mx-auto px-space-4 pt-space-6">
          <div className="mb-space-4 flex items-center justify-between gap-space-3">
            <div>
              <h2 className="text-text-xl font-bold text-text-primary">Subcategorias</h2>
              <p className="mt-1 text-text-sm text-text-secondary">{selectedCategory.name}</p>
            </div>
            <Link to={`/app/lista?category=${selectedCategory.id}`} className="text-text-sm font-semibold text-action-primary">
              Ver resultados
            </Link>
          </div>

          {loadingSubcategories ? (
            <div className="grid grid-cols-2 gap-space-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-radius-2xl bg-surface-card" />
              ))}
            </div>
          ) : subcategories.length ? (
            <div className="grid grid-cols-2 gap-space-3 sm:grid-cols-3">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  to={`/app/lista?category=${selectedCategory.id}&subcategory=${subcategory.id}`}
                  className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-4 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <div className="text-text-sm font-semibold text-text-primary">{subcategory.name}</div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-border-subtle">
              <div className="text-text-sm text-text-secondary">Nenhuma subcategoria cadastrada para esta categoria.</div>
            </Card>
          )}
        </section>
      )}

      <section className="container mx-auto px-space-4 pt-space-8">
        <div className="mb-space-4 flex items-center justify-between gap-space-3">
          <div>
            <h2 className="text-text-xl font-bold text-text-primary">Mais Bem Avaliados</h2>
            <p className="mt-1 text-text-sm text-text-secondary">Ordenação real da API com média, quantidade e score ponderado.</p>
          </div>
          <Link to="/app/lista" className="text-text-sm font-semibold text-action-primary">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="space-y-space-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-radius-2xl bg-surface-card" />
            ))}
          </div>
        ) : topBusinesses.length ? (
          <div className="space-y-space-3">
            {topBusinesses.map((business, index) => {
              const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
              const reviewsLabel = reviewCount === 1 ? "avaliação" : "avaliações";
              return (
                <Link
                  key={business.id}
                  to={`/app/business/${business.id}`}
                  className="flex items-center gap-space-4 rounded-radius-2xl border border-border-subtle bg-surface-card p-space-3 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <div className="w-20 shrink-0 overflow-hidden rounded-radius-xl bg-surface-subtle">
                    <img
                      src={business.image_url || business.logo_url || "https://placehold.co/160x160/e2e8f0/94a3b8?text=Tem+Aki"}
                      alt={business.name}
                      className="h-20 w-20 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-text-xs font-semibold text-text-muted">{index + 1}. Mais bem avaliado</div>
                    <div className="mt-1 line-clamp-1 text-text-base font-bold text-text-primary">{business.name}</div>
                    <div className="mt-1 flex items-center gap-space-1 text-status-warning">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className={`h-4 w-4 ${starIndex < Math.round(business.rating || 0) ? "fill-current" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 text-text-sm text-text-secondary">
                      ★ {typeof business.rating === "number" ? business.rating.toFixed(1).replace(".", ",") : "0,0"}
                      {reviewCount > 0 ? ` (${reviewCount} ${reviewsLabel})` : ""}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-action-primary" />
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-border-subtle">
            <div className="text-text-sm text-text-secondary">Ainda não há negócios avaliados o suficiente para exibir aqui.</div>
          </Card>
        )}
      </section>

      {canShowHighlights && (
        <section className="container mx-auto px-space-4 pt-space-8">
          <div className="rounded-radius-2xl border border-dashed border-border-default bg-surface-card p-space-5">
            <div className="flex items-start gap-space-3">
              <div className="rounded-radius-full bg-action-primary/10 p-space-2 text-action-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-text-lg font-bold text-text-primary">Destaques</h2>
                <p className="mt-1 text-text-sm text-text-secondary">
                  Esta área fica preparada para futuros destaques reais quando houver estrutura própria no sistema.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
