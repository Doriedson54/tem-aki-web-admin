import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, GraduationCap, Landmark, LibraryBig, MapPin, Search, Star, Store, Wrench } from "lucide-react";
import api from "../services/api";
import type { ApiResponse, Business, Category, Subcategory } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import heroBg from "../assets/hero-bg.jpg";
import handPhoneImage from "../assets/logosemfundo.png";

const FEATURED_CATEGORY_ORDER = [
  "Comércio",
  "Serviços",
  "Profissionais",
  "Escolar",
  "Instituições",
  "Instituições Públicas",
  "Instituições Comunitárias",
  "Instituições Religiosas",
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
      accentClassName: "text-[#B86A1A]",
      iconBackgroundClassName: "bg-[#FFF4E7]",
    };
  }

  if (normalizedName.includes("serv")) {
    return {
      icon: Wrench,
      description: subcategoryCount > 0 ? `${subcategoryCount} opcoes com atendimentos e servicos.` : "Beleza, saude, casa e mais.",
      accentClassName: "text-emerald-600",
      iconBackgroundClassName: "bg-emerald-50",
    };
  }

  if (normalizedName.includes("profission") || normalizedName.includes("escolar") || normalizedName.includes("educ")) {
    return {
      icon: GraduationCap,
      description: subcategoryCount > 0 ? `${subcategoryCount} especialidades e atendimentos reais.` : "Autonomos, liberais e apoio escolar.",
      accentClassName: "text-sky-600",
      iconBackgroundClassName: "bg-sky-50",
    };
  }

  if (normalizedName.includes("institu")) {
    return {
      icon: Landmark,
      description: subcategoryCount > 0 ? `${subcategoryCount} frentes com servicos essenciais.` : "Escolas, igrejas, orgaos e apoio local.",
      accentClassName: "text-violet-600",
      iconBackgroundClassName: "bg-violet-50",
    };
  }

  return {
    icon: LibraryBig,
    description: subcategoryCount > 0 ? `${subcategoryCount} itens reais no catalogo.` : "Dados reais carregados do sistema.",
    accentClassName: "text-text-primary",
    iconBackgroundClassName: "bg-slate-100",
  };
}

export function AppHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [categoriesResponse, businessesResponse, subcategoriesResponse] = await Promise.all([
          api.get<ApiResponse<Category[]>>("/categories"),
          api.get<ApiResponse<Business[]>>("/businesses", { params: { limit: 8 } }),
          api.get<ApiResponse<Subcategory[]>>("/subcategories"),
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
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setAllSubcategories([]);
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

  const displayedCategories = useMemo(() => categories.slice(0, 4), [categories]);

  const subcategoryCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const subcategory of allSubcategories) {
      counts.set(subcategory.category_id, (counts.get(subcategory.category_id) || 0) + 1);
    }
    return counts;
  }, [allSubcategories]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    navigate(`/app/lista${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[#F6F1EB] pb-space-8">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 scale-105 blur-[3px]"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_28%,rgba(246,241,235,0.45)_100%)]" />

        <div className="relative container mx-auto px-space-4 pb-10 pt-10">
          <div className="grid min-h-[340px] grid-cols-[minmax(0,1fr)_145px] items-center gap-space-3">
            <div className="text-white">
              <h1 className="max-w-[260px] text-[2.35rem] font-bold leading-[1.02] text-white">
                Tudo o que voce procura esta aqui
              </h1>
              <p className="mt-space-4 max-w-[280px] text-text-base leading-relaxed text-white/92">
                Comercios, servicos, profissionais e instituicoes do Nova Terra ao seu alcance.
              </p>
              <div className="mt-space-5 inline-flex items-center gap-space-2 rounded-[20px] bg-white px-space-4 py-space-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.16)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1E2] text-[#B86A1A]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-text-sm font-bold text-text-primary">Nova Terra</div>
                  <div className="text-[13px] text-text-secondary">Sao Jose de Ribamar - MA</div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-end self-end">
              <img
                src={handPhoneImage}
                alt="Celular com Tem Aki no Bairro"
                className="w-full max-w-[150px] translate-y-5 object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto -mt-8 px-space-4">
        <Card className="rounded-[28px] border border-[#EFE4D6] bg-white p-space-5 shadow-[0_20px_45px_rgba(15,23,42,0.10)]">
          <div className="flex items-center gap-space-2 text-text-lg font-bold text-text-primary">
            <Search className="h-5 w-5 text-[#B86A1A]" />
            <span>Buscar negocios</span>
          </div>
          <div className="mt-space-4 grid grid-cols-[minmax(0,1fr)_132px] gap-space-3">
            <div className="relative rounded-[18px] border border-border-subtle bg-[#FAF7F3]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <Input
                id="app-home-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder="Nome, servico, categoria ou endereco..."
                className="h-14 rounded-[18px] border-0 bg-transparent pl-12 pr-4 text-text-base shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="h-14 w-full rounded-[18px] border-none text-text-sm font-bold text-white shadow-[0_12px_25px_rgba(184,106,26,0.30)]"
              style={{ backgroundColor: "#B86A1A" }}
            >
              Buscar
            </Button>
          </div>
        </Card>
      </section>

      <section id="categorias" className="container mx-auto px-space-4 pt-space-6">
        <div className="mb-space-4 flex items-center justify-between gap-space-3">
          <div className="flex items-center gap-space-2 text-text-xl font-bold text-text-primary">
            <LibraryBig className="h-5 w-5 text-[#B86A1A]" />
            <span>Navegar por Categorias</span>
          </div>
          <Link to="/app/lista" className="text-text-sm font-bold uppercase tracking-wide text-[#B86A1A]">
            Ver categorias
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-space-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[22px] bg-white shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-4">
            {displayedCategories.map((category) => {
              const presentation = getCategoryPresentation(category, subcategoryCountByCategory.get(category.id) || 0);
              const Icon = presentation.icon;

              return (
                <Link
                  key={category.id}
                  to={`/app/lista?category=${category.id}`}
                  className="rounded-[22px] border border-[#EFE4D6] bg-white p-space-4 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5"
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] ${presentation.iconBackgroundClassName} ${presentation.accentClassName}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="mt-space-4 text-text-lg font-bold text-text-primary">{category.name}</div>
                  <div className="mt-space-2 text-text-sm leading-relaxed text-text-secondary">{presentation.description}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="container mx-auto px-space-4 pt-space-8">
        <div className="mb-space-4 flex items-center justify-between gap-space-3">
          <div className="flex items-center gap-space-2 text-text-xl font-bold text-text-primary">
            <Star className="h-5 w-5 fill-[#F2B233] text-[#F2B233]" />
            <span>Mais bem avaliados</span>
          </div>
          <Link to="/app/lista" className="text-text-sm font-bold text-[#B86A1A]">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-space-4 overflow-x-auto pb-space-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[230px] w-[220px] shrink-0 animate-pulse rounded-[22px] bg-white" />
            ))}
          </div>
        ) : topBusinesses.length ? (
          <div className="flex gap-space-4 overflow-x-auto pb-space-2">
            {topBusinesses.map((business) => {
              const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
              const reviewsLabel = reviewCount === 1 ? "avaliacao" : "avaliacoes";

              return (
                <Link
                  key={business.id}
                  to={`/app/business/${business.id}`}
                  className="w-[220px] shrink-0 overflow-hidden rounded-[22px] border border-[#EFE4D6] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="h-[126px] bg-surface-subtle">
                    <img
                      src={business.image_url || business.logo_url || "https://placehold.co/320x220/e2e8f0/94a3b8?text=Tem+Aki"}
                      alt={business.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="space-y-space-2 p-space-4">
                    <div className="line-clamp-1 text-text-base font-bold text-text-primary">{business.name}</div>
                    <div className="text-text-sm text-text-secondary">{business.category?.name || "Categoria"}</div>
                    <div className="flex items-center gap-1 text-[#F2B233]">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className={`h-4 w-4 ${starIndex < Math.round(business.rating || 0) ? "fill-current" : ""}`} />
                      ))}
                    </div>
                    <div className="text-text-sm text-text-secondary">
                      ★★★★★ {typeof business.rating === "number" ? business.rating.toFixed(1).replace(".", ",") : "0,0"} ({reviewCount} {reviewsLabel})
                    </div>
                    <div className="inline-flex items-center gap-space-1 text-text-sm font-semibold text-[#B86A1A]">
                      Ver detalhes
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-[22px] border border-[#EFE4D6] bg-white">
            <div className="text-text-sm text-text-secondary">Ainda nao ha negocios com avaliacoes suficientes para exibir aqui.</div>
          </Card>
        )}
      </section>
    </div>
  );
}
