import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Compass,
  ChevronRight,
  GraduationCap,
  Grid2x2,
  Landmark,
  MapPin,
  MessageSquareText,
  Search,
  Star,
  Store,
  Wrench,
} from "lucide-react";
import api from "../services/api";
import type { ApiResponse, Business, Category, Subcategory } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import heroBg from "../assets/hero-bg.jpg";
import { appMeta } from "../config/appMeta";

type PublicStatsPayload = {
  totals: {
    businesses: number;
    categories: number;
    subcategories: number;
    approved_reviews: number;
  };
};

const FEATURED_CATEGORY_ORDER = [
  "Comércio",
  "Serviços",
  "Escolar",
  "Instituições Públicas",
  "Instituições Comunitárias",
  "Instituições Religiosas",
];

const POPULAR_SUBCATEGORY_NAMES = [
  "Farmácia",
  "Mercado",
  "Lanchonete",
  "Barbearia",
  "Oficina",
  "Igreja",
  "Escola",
  "Material de Construção",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getCategoryPresentation(category: Category, subcategoryCount: number) {
  const normalizedName = normalizeText(category.name);

  if (normalizedName.includes("comerc")) {
    return {
      icon: Store,
      description: subcategoryCount > 0 ? `${subcategoryCount} subcategorias reais para compras locais.` : "Lojas, mercados e vendas do bairro.",
      iconClassName: "text-[#B86A1A]",
      backgroundClassName: "from-[#FFF4E7] to-[#FFF9F3]",
    };
  }

  if (normalizedName.includes("serv")) {
    return {
      icon: Wrench,
      description: subcategoryCount > 0 ? `${subcategoryCount} subcategorias com atendimentos e serviços.` : "Reparos, manutenção e atendimento local.",
      iconClassName: "text-sky-600",
      backgroundClassName: "from-sky-50 to-white",
    };
  }

  if (normalizedName.includes("escolar") || normalizedName.includes("educ")) {
    return {
      icon: GraduationCap,
      description: subcategoryCount > 0 ? `${subcategoryCount} frentes ligadas à educação e apoio escolar.` : "Educação e apoio escolar do Nova Terra.",
      iconClassName: "text-violet-600",
      backgroundClassName: "from-violet-50 to-white",
    };
  }

  if (normalizedName.includes("institu")) {
    return {
      icon: Landmark,
      description: subcategoryCount > 0 ? `${subcategoryCount} subcategorias com instituições e serviços essenciais.` : "Instituições e pontos importantes da comunidade.",
      iconClassName: "text-emerald-600",
      backgroundClassName: "from-emerald-50 to-white",
    };
  }

  return {
    icon: BriefcaseBusiness,
    description: subcategoryCount > 0 ? `${subcategoryCount} subcategorias disponíveis no catálogo.` : "Dados reais carregados do sistema.",
    iconClassName: "text-text-primary",
    backgroundClassName: "from-surface-subtle to-white",
  };
}

export function AppHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<PublicStatsPayload["totals"] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [categoriesResponse, businessesResponse, subcategoriesResponse, statsResponse] = await Promise.all([
          api.get<ApiResponse<Category[]>>("/categories"),
          api.get<ApiResponse<Business[]>>("/businesses", { params: { limit: 8 } }),
          api.get<ApiResponse<Subcategory[]>>("/subcategories"),
          api.get<ApiResponse<PublicStatsPayload>>("/dashboard/public"),
        ]);

        const categoriesData = Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [];
        const orderedCategories = (() => {
          const byName = new Map(categoriesData.map((category) => [category.name, category]));
          const preferred = FEATURED_CATEGORY_ORDER.map((name) => byName.get(name)).filter((item): item is Category => Boolean(item));
          const remaining = categoriesData.filter((category) => !preferred.some((item) => item.id === category.id));
          return [...preferred, ...remaining];
        })();
        const businessesData = Array.isArray(businessesResponse.data?.data) ? businessesResponse.data.data : [];
        const subcategoriesData = Array.isArray(subcategoriesResponse.data?.data) ? subcategoriesResponse.data.data : [];

        if (!cancelled) {
          setCategories(orderedCategories);
          setTopBusinesses(businessesData.slice(0, 6));
          setAllSubcategories(subcategoriesData);
          setStats(statsResponse.data?.data?.totals ?? null);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setAllSubcategories([]);
          setTopBusinesses([]);
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayedCategories = useMemo(() => categories.slice(0, 4), [categories]);

  const searchExamples = useMemo(() => {
    const values = topBusinesses
      .flatMap((business) => [business.main_product, business.name, business.category?.name])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    return Array.from(new Set(values)).slice(0, 3);
  }, [topBusinesses]);

  const popularSubcategories = useMemo(() => {
    const normalizedTargets = new Set(POPULAR_SUBCATEGORY_NAMES.map((name) => normalizeText(name)));
    return allSubcategories.filter((subcategory) => normalizedTargets.has(normalizeText(subcategory.name)));
  }, [allSubcategories]);

  const subcategoryCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const subcategory of allSubcategories) {
      const key = subcategory.category_id;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [allSubcategories]);

  const searchHelperText =
    searchExamples.length
      ? `Ex.: ${searchExamples.join(", ").toLowerCase()}`
      : "Ex.: farmácia, escola, pedreiro, oficina, salão...";
  const heroMetrics = useMemo(
    () => [
      { label: "Negócios", value: stats?.businesses ?? topBusinesses.length },
      { label: "Avaliações", value: stats?.approved_reviews ?? 0 },
      { label: "Categorias", value: stats?.categories ?? categories.length },
    ],
    [categories.length, stats, topBusinesses.length]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    navigate(`/app/lista${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-24">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(184,106,26,0.22),_transparent_48%)]" />

        <div className="relative container mx-auto px-space-4 pb-space-12 pt-28">
          <div className="mx-auto flex min-h-[72vh] max-w-5xl flex-col items-center justify-center text-center">
            <div className="mb-space-5 inline-flex items-center gap-space-2 rounded-radius-full border border-white/20 bg-white/10 px-space-4 py-space-2 text-text-sm font-semibold text-white backdrop-blur">
              <MapPin className="h-4 w-4" />
              <span>Nova Terra</span>
              <span className="text-white/70">São José de Ribamar - MA</span>
            </div>
            <h1 className="max-w-4xl text-text-4xl font-bold leading-[1.05] text-white md:text-[3.65rem]">
              Os negócios do Bairro na sua mão
            </h1>
            <p className="mt-space-5 max-w-2xl text-text-base leading-relaxed text-white/90 md:text-[1.15rem]">
              Comércios, serviços, profissionais e instituições do Nova Terra ao seu alcance.
            </p>
            <div className="mt-space-6 flex flex-wrap items-center justify-center gap-space-3">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-full border border-white/15 bg-white/10 px-space-4 py-space-3 backdrop-blur"
                >
                  <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-white/65">{metric.label}</div>
                  <div className="mt-space-1 text-text-lg font-bold text-white">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative mx-auto -mt-16 max-w-4xl rounded-[30px] border-0 bg-white p-space-5 shadow-[0_28px_80px_rgba(15,23,42,0.16)] md:p-space-6">
            <div className="mb-space-5 flex items-center gap-space-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#FFF4E7] text-[#B86A1A]">
                <Compass className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-text-base font-bold text-text-primary">Busca Principal</div>
                <div className="text-text-sm text-text-secondary">Encontre rapidamente negócios, serviços e instituições com dados reais.</div>
              </div>
            </div>
            <div className="grid gap-space-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <div>
                <label htmlFor="app-home-search" className="mb-space-3 block text-text-sm font-semibold text-text-primary">
                  O que você procura?
                </label>
                <div className="relative rounded-[22px] border border-border-subtle bg-surface-subtle">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="app-home-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                    placeholder="Ex.: farmácia, escola, pedreiro, oficina, salão..."
                    className="h-14 rounded-[22px] border-0 bg-transparent pl-12 pr-4 text-text-base shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="mt-space-3 text-text-xs text-text-muted">{searchHelperText}</div>
              </div>

              <Button
                onClick={handleSearch}
                className="h-14 w-full rounded-[22px] text-text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_35px_rgba(184,106,26,0.32)]"
                style={{ backgroundColor: "#B86A1A" }}
              >
                Localizar Agora
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <section id="categorias" className="container mx-auto px-space-4 pt-space-10">
        <div className="mb-space-5 flex items-end justify-between gap-space-3">
          <div>
            <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-[#B86A1A]">Categorias</div>
            <h2 className="mt-space-2 text-text-2xl font-bold text-text-primary">Explore por tipo de negócio</h2>
            <p className="mt-space-1 text-text-sm text-text-secondary">Categorias reais do sistema, em destaque para busca rápida.</p>
          </div>
          <Link to="/app/lista" className="text-text-sm font-semibold text-[#B86A1A]">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-space-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[24px] bg-white shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-4">
            {displayedCategories.map((category) => {
              const presentation = getCategoryPresentation(category, subcategoryCountByCategory.get(category.id) || 0);
              const Icon = presentation.icon;
              const subcategoryCount = subcategoryCountByCategory.get(category.id) || 0;

              return (
                <Link
                  key={category.id}
                  to={`/app/lista?category=${category.id}`}
                  className={`group rounded-[26px] border border-black/5 bg-gradient-to-br ${presentation.backgroundClassName} p-space-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-space-3">
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/85 shadow-sm ${presentation.iconClassName}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="rounded-full bg-white/80 px-space-3 py-space-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted shadow-sm">
                        {subcategoryCount} itens
                      </div>
                    </div>
                    <div className="mt-space-6">
                      <div className="text-text-base font-bold text-text-primary">{category.name}</div>
                      <div className="mt-space-2 text-text-sm leading-relaxed text-text-secondary">{presentation.description}</div>
                      <div className="mt-space-4 flex items-center gap-space-2 text-text-sm font-semibold text-[#B86A1A]">
                        Explorar
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {popularSubcategories.length > 0 && (
        <section className="container mx-auto px-space-4 pt-space-8">
          <div className="mb-space-4 flex items-end justify-between gap-space-3">
            <div>
              <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-[#B86A1A]">Subcategorias Populares</div>
              <h2 className="mt-space-2 text-text-2xl font-bold text-text-primary">Atalhos mais procurados</h2>
            </div>
          </div>
          <div className="flex gap-space-3 overflow-x-auto pb-space-2">
            {popularSubcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                to={`/app/lista?subcategory=${subcategory.id}`}
                className="whitespace-nowrap rounded-full border border-[#E9D3BA] bg-[#FFF6ED] px-space-4 py-space-3 text-text-sm font-semibold text-[#8E5316] shadow-sm transition-colors hover:bg-[#FDEDDC]"
              >
                {subcategory.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-space-4 pt-space-8">
        <div className="mb-space-5 flex items-end justify-between gap-space-3">
          <div>
            <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-[#B86A1A]">Mais Bem Avaliados</div>
            <h2 className="mt-space-2 text-text-2xl font-bold text-text-primary">Destaques com base nas avaliações</h2>
            <p className="mt-space-1 text-text-sm text-text-secondary">Lista real ordenada pelo backend com nota média e quantidade de avaliações.</p>
          </div>
          <Link to="/app/lista" className="text-text-sm font-semibold text-[#B86A1A]">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="space-y-space-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-[24px] bg-white" />
            ))}
          </div>
        ) : topBusinesses.length ? (
          <div className="grid gap-space-4 md:grid-cols-2">
            {topBusinesses.map((business) => {
              const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
              const reviewsLabel = reviewCount === 1 ? "avaliação" : "avaliações";
              return (
                <Link
                  key={business.id}
                  to={`/app/business/${business.id}`}
                  className="group overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative h-40 bg-surface-subtle">
                    <img
                      src={business.image_url || business.logo_url || "https://placehold.co/160x160/e2e8f0/94a3b8?text=Tem+Aki"}
                      alt={business.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute left-space-4 top-space-4 rounded-full bg-white/90 px-space-3 py-space-2 text-[11px] font-semibold uppercase tracking-wide text-[#B86A1A]">
                      {business.category?.name || "Catálogo local"}
                    </div>
                  </div>
                  <div className="p-space-4">
                    <div className="line-clamp-1 text-text-lg font-bold text-text-primary">{business.name}</div>
                    <div className="mt-space-2 flex items-center gap-space-1 text-status-warning">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className={`h-4 w-4 ${starIndex < Math.round(business.rating || 0) ? "fill-current" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="mt-space-2 text-text-sm text-text-secondary">
                      ★★★★★ {typeof business.rating === "number" ? business.rating.toFixed(1).replace(".", ",") : "0,0"}
                      {reviewCount > 0 ? ` (${reviewCount} ${reviewsLabel})` : " (sem avaliações aprovadas)"}
                    </div>
                    <div className="mt-space-4 inline-flex items-center gap-space-2 text-text-sm font-semibold text-[#B86A1A]">
                      Ver detalhes
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-border-subtle rounded-[24px] bg-white">
            <div className="text-text-sm text-text-secondary">Ainda não há negócios avaliados o suficiente para exibir aqui.</div>
          </Card>
        )}
      </section>

      <section className="container mx-auto px-space-4 pt-space-8">
        <div className="mb-space-5 flex items-end justify-between gap-space-3">
          <div>
            <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-[#B86A1A]">Estatísticas</div>
            <h2 className="mt-space-2 text-text-2xl font-bold text-text-primary">O bairro em números</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-4">
          <Card className="rounded-[24px] border-0 bg-gradient-to-br from-white to-[#FFF8F1] p-space-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-space-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#FFF4E7] text-[#B86A1A]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Negócios cadastrados</div>
                <div className="mt-space-1 text-text-2xl font-bold text-text-primary">{stats?.businesses ?? 0}</div>
                <div className="mt-space-1 text-[11px] text-text-muted">Base pública real do Nova Terra</div>
              </div>
            </div>
          </Card>
          <Card className="rounded-[24px] border-0 bg-gradient-to-br from-white to-amber-50 p-space-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-space-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-amber-50 text-amber-600">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Avaliações aprovadas</div>
                <div className="mt-space-1 text-text-2xl font-bold text-text-primary">{stats?.approved_reviews ?? 0}</div>
                <div className="mt-space-1 text-[11px] text-text-muted">Somente reviews já aprovadas</div>
              </div>
            </div>
          </Card>
          <Card className="rounded-[24px] border-0 bg-gradient-to-br from-white to-sky-50 p-space-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-space-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-sky-50 text-sky-600">
                <Grid2x2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Categorias</div>
                <div className="mt-space-1 text-text-2xl font-bold text-text-primary">{stats?.categories ?? categories.length}</div>
                <div className="mt-space-1 text-[11px] text-text-muted">Organização principal do catálogo</div>
              </div>
            </div>
          </Card>
          <Card className="rounded-[24px] border-0 bg-gradient-to-br from-white to-emerald-50 p-space-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-space-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-600">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Subcategorias</div>
                <div className="mt-space-1 text-text-2xl font-bold text-text-primary">{stats?.subcategories ?? allSubcategories.length}</div>
                <div className="mt-space-1 text-[11px] text-text-muted">Níveis reais de especialização</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-space-4 pt-space-8">
        <div className="overflow-hidden rounded-[32px] bg-[#1D1D1B] px-space-6 py-space-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="grid gap-space-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="max-w-2xl">
              <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-[#E6B37F]">Exclusivo para o bairro Nova Terra</div>
              <h2 className="mt-space-3 text-text-2xl font-bold">Tudo pensado para a rotina local</h2>
              <p className="mt-space-3 text-text-sm leading-relaxed text-white/75">
                Use a busca, explore categorias reais do catálogo e encontre serviços, comércios e instituições do Nova Terra com visual mais limpo, rápido e direto.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/5 px-space-4 py-space-4 backdrop-blur">
              <div className="text-text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Acesso rápido</div>
              <div className="mt-space-2 text-text-lg font-bold text-white">Busca, mapa e avaliações em um só lugar</div>
            </div>
          </div>
          <div className="mt-space-6 flex flex-wrap gap-space-3 text-text-sm">
            <Link to="/politica-de-privacidade" className="inline-flex items-center gap-space-2 rounded-full bg-white/10 px-space-4 py-space-3 text-white/85">
              Política de Privacidade <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/terms-of-use" className="inline-flex items-center gap-space-2 rounded-full bg-white/10 px-space-4 py-space-3 text-white/85">
              Termos de Uso <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-space-2 rounded-full bg-white/10 px-space-4 py-space-3 text-white/85">
              Sobre <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-space-5 text-text-xs text-white/55">
            {appMeta.name} • Nova Terra, São José de Ribamar - MA
          </div>
        </div>
      </section>
    </div>
  );
}
