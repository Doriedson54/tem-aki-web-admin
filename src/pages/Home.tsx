import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Search, MapPin, ShoppingBag, Wrench, School, Landmark, Handshake, Church, ChevronRight, X, type LucideIcon } from "lucide-react";
import api from "../services/api";
import type { Category, Business, ApiResponse, Subcategory } from "../types";
import { useNavigate } from "react-router-dom";
import { BusinessCard } from "../components/BusinessCard";
import heroBg from "../assets/hero-bg.jpg";
import { LeadCaptureModal } from "../components/LeadCaptureModal";

export function Home() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [featured, setFeatured] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [keyboardInset, setKeyboardInset] = useState(0);
    const searchCardRef = useRef<HTMLDivElement | null>(null);
    const blurTimeoutRef = useRef<number | null>(null);

    const getSubcategoryEmoji = (subcategoryName: string) => {
        const name = String(subcategoryName || "").toLowerCase();
        if (name.includes("moto") || name.includes("biciclet") || name.includes("bike") || name.includes("ciclo")) return "🏍️";
        if (name.includes("aliment") || name.includes("bebid") || name.includes("padar") || name.includes("lanch")) return "🍽️";
        if (name.includes("vestu") || name.includes("roup") || name.includes("acess")) return "👕";
        if (name.includes("eletro") || name.includes("eletr")) return "💻";
        if (name.includes("móve") || name.includes("move") || name.includes("decora")) return "🛋️";
        if (name.includes("higien") || name.includes("limpez")) return "🧼";
        if (name.includes("saúd") || name.includes("farm")) return "💊";
        if (name.includes("auto") || name.includes("car") || name.includes("veícul") || name.includes("veicul")) return "🚗";
        if (name.includes("brinqu") || name.includes("lazer")) return "🧸";
        if (name.includes("pet")) return "🐾";
        if (name.includes("constr") || name.includes("mater")) return "🧱";
        if (name.includes("papel") || name.includes("escri")) return "📎";
        if (name.includes("jóia") || name.includes("joia") || name.includes("relóg") || name.includes("relog")) return "💎";
        return "🏷️";
    };

    const categoryCards: Array<{
        key: string;
        displayName: string;
        icon: LucideIcon;
        iconWrapClassName: string;
        cardClassName: string;
    }> = [
            {
                key: "Serviços",
                displayName: "Serviços",
                icon: Wrench,
                iconWrapClassName: "bg-action-primary/10 text-action-primary",
                cardClassName: "hover:border-action-primary/40",
            },
            {
                key: "Comércio",
                displayName: "Comércio",
                icon: ShoppingBag,
                iconWrapClassName: "bg-action-primary/10 text-action-primary",
                cardClassName: "hover:border-action-primary/40",
            },
            {
                key: "Escolar",
                displayName: "Escolas",
                icon: School,
                iconWrapClassName: "bg-action-primary/10 text-action-primary",
                cardClassName: "hover:border-action-primary/40",
            },
            {
                key: "Instituições Públicas",
                displayName: "Instituições Públicas",
                icon: Landmark,
                iconWrapClassName: "bg-action-primary/10 text-action-primary",
                cardClassName: "hover:border-action-primary/40",
            },
            {
                key: "Instituições Comunitárias",
                displayName: "Instituições Comunitárias",
                icon: Handshake,
                iconWrapClassName: "bg-action-primary/10 text-action-primary",
                cardClassName: "hover:border-action-primary/40",
            },
            {
                key: "Instituições Religiosas",
                displayName: "Instituições Religiosas",
                icon: Church,
                iconWrapClassName: "bg-action-primary/10 text-action-primary",
                cardClassName: "hover:border-action-primary/40",
            },
        ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, busRes] = await Promise.all([
                    api.get<ApiResponse<Category[]>>('/categories'),
                    api.get<ApiResponse<Business[]>>('/businesses')
                ]);

                if (catRes.data.success) {
                    const byName = new Map(catRes.data.data.map((c) => [c.name, c]));
                    const ordered = categoryCards
                        .map((cfg) => byName.get(cfg.key))
                        .filter((c): c is Category => Boolean(c));
                    setCategories(ordered);
                }

                if (busRes.data.data) {
                    const businesses = Array.isArray(busRes.data.data) ? busRes.data.data : [];
                    setFeatured(businesses.slice(0, 3));
                }

            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!isSearchFocused) {
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
    }, [isSearchFocused]);

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current !== null) {
                window.clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isCategoryModalOpen || !selectedCategory) return;

        let cancelled = false;
        setIsLoadingSubcategories(true);
        setSelectedSubcategoryId("");

        (async () => {
            try {
                const resp = await api.get<ApiResponse<Subcategory[]>>(`/subcategories?category=${encodeURIComponent(selectedCategory.id)}`);
                if (cancelled) return;
                if (resp.data.success && Array.isArray(resp.data.data)) {
                    setSubcategories(resp.data.data);
                } else {
                    setSubcategories([]);
                }
            } catch {
                if (!cancelled) setSubcategories([]);
            } finally {
                if (!cancelled) setIsLoadingSubcategories(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isCategoryModalOpen, selectedCategory?.id]);

    const handleSearch = () => {
        setIsSearchFocused(false);
        const isLeadCaptured = localStorage.getItem("temaki_lead_captured");
        if (!isLeadCaptured) {
            setIsLeadModalOpen(true);
            return;
        }
        navigate(`/directory?search=${searchTerm}`);
    };

    const handleLeadSuccess = () => {
        navigate(`/directory?search=${searchTerm}`);
    };

    const handleCategorySearch = () => {
        if (!selectedCategory) return;
        const qs = new URLSearchParams();
        qs.set("category", selectedCategory.id);
        if (selectedSubcategoryId) qs.set("subcategory", selectedSubcategoryId);
        navigate(`/directory?${qs.toString()}`);
        setIsCategoryModalOpen(false);
    };

    const scrollSearchIntoView = () => {
        const target = searchCardRef.current;
        if (!target) return;

        window.setTimeout(() => {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
            });
        }, 220);
    };

    const handleSearchFocus = () => {
        if (blurTimeoutRef.current !== null) {
            window.clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
        setIsSearchFocused(true);
        scrollSearchIntoView();
    };

    const handleSearchBlur = () => {
        blurTimeoutRef.current = window.setTimeout(() => {
            setIsSearchFocused(false);
            setKeyboardInset(0);
        }, 180);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-action-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-primary"></div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col gap-space-16 pb-space-16"
            style={{
                paddingBottom: keyboardInset > 0 ? `${keyboardInset + 24}px` : undefined,
            }}
        >
            <LeadCaptureModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                onSuccess={handleLeadSuccess}
                searchTerm={searchTerm}
            />

            {/* Hero Section */}
            <section className="relative py-space-20 text-text-on-brand overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={heroBg} alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>

                <div className="container mx-auto px-space-4 relative z-10 text-center">
                    <h1 className="text-text-4xl md:text-text-5xl font-bold mb-space-6 drop-shadow-md">
                        Tudo o que você precisa
                        na Nova Terra
                    </h1>
                    <p className="text-text-lg md:text-text-xl mb-space-8 opacity-90 max-w-2xl mx-auto">
                        Encontre os melhores comércios, serviços e instituições do bairro.
                    </p>

                    <div
                        ref={searchCardRef}
                        className="bg-surface-card p-space-4 rounded-radius-xl shadow-lg max-w-2xl mx-auto flex flex-col md:flex-row gap-space-4 items-center scroll-mt-24 md:scroll-mt-28"
                    >
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5" />
                            <Input
                                placeholder="O que você procura? (ex: farmácia, escola)"
                                className="pl-10 h-12 border-0 bg-surface-subtle text-text-primary focus:ring-2 focus:ring-border-focus"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                onFocus={handleSearchFocus}
                                onBlur={handleSearchBlur}
                            />
                        </div>
                        <Button className="w-full md:w-auto h-12 px-space-12 text-lg" onClick={handleSearch}>Localizar Agora</Button>
                    </div>

                    <div className="mt-space-4 flex items-center justify-center gap-space-2 text-text-sm opacity-80">
                        <MapPin className="h-4 w-4" />
                        Exclusivo para o bairro Nova Terra, São José de Ribamar - MA
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="container mx-auto px-space-4">
                <div className="flex justify-between items-end mb-space-8">
                    <h2 className="text-text-3xl font-bold text-text-primary">Categorias Populares</h2>
                    <Button variant="ghost" className="text-action-primary font-medium" onClick={() => navigate('/directory')}>Ver todas</Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-6">
                    {categoryCards.map((cfg) => {
                        const category = categories.find((c) => c.name === cfg.key);
                        const Icon = cfg.icon;
                        const isDisabled = !category;
                        return (
                            <Card
                                key={cfg.key}
                                className={[
                                    "flex flex-col items-center justify-center p-space-6 md:p-space-8 transition-all border-border-subtle shadow-sm rounded-radius-2xl",
                                    cfg.cardClassName,
                                    isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                                ].join(" ")}
                                onClick={() => {
                                    if (!category) return;
                                    setSelectedCategory(category);
                                    setIsCategoryModalOpen(true);
                                }}
                            >
                                <div className={`p-space-4 rounded-radius-2xl mb-space-4 ${cfg.iconWrapClassName} transition-transform`}>
                                    <Icon className="h-space-8 w-space-8" />
                                </div>
                                <span className="font-bold text-text-base md:text-text-lg text-text-primary text-center leading-tight">{cfg.displayName}</span>
                                <span className="mt-space-2 text-text-xs text-text-muted text-center">
                                    {isDisabled ? "Indisponível" : "Toque para escolher"}
                                </span>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {isCategoryModalOpen && selectedCategory && (
                <div className="fixed inset-0 z-50">
                    <button
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsCategoryModalOpen(false)}
                        aria-label="Fechar"
                    />
                    <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-space-4">
                        <Card className="w-full md:max-w-2xl rounded-radius-2xl border-border-subtle shadow-lg overflow-hidden">
                            <div className="p-space-6 md:p-space-8">
                                <div className="flex items-start justify-between gap-space-4">
                                    <div className="space-y-space-1">
                                        <div className="text-text-xs font-bold text-text-primary/70 uppercase tracking-widest">Categoria</div>
                                        <div className="text-text-2xl font-bold text-text-primary">{selectedCategory.name === "Escolar" ? "Escolas" : selectedCategory.name}</div>
                                        <div className="text-text-sm text-text-secondary">
                                            Selecione uma subcategoria (quando houver) e toque em Buscar para ver os negócios.
                                        </div>
                                    </div>
                                    <button
                                        className="h-10 w-10 flex items-center justify-center rounded-radius-xl bg-surface-subtle hover:bg-surface-subtle/70 border border-border-subtle text-text-muted"
                                        onClick={() => setIsCategoryModalOpen(false)}
                                        aria-label="Fechar"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-space-6">
                                    <div className="flex items-center justify-between gap-space-4 mb-space-3">
                                        <div className="text-text-sm font-bold text-text-primary">Subcategorias</div>
                                        {!isLoadingSubcategories && subcategories.length > 0 && (
                                            <div className="text-text-xs text-text-muted">{subcategories.length} opções</div>
                                        )}
                                    </div>

                                    {isLoadingSubcategories ? (
                                        <div className="flex justify-center py-space-10">
                                            <div className="animate-spin rounded-full h-space-10 w-space-10 border-b-2 border-action-primary"></div>
                                        </div>
                                    ) : subcategories.length === 0 ? (
                                        <div className="p-space-6 rounded-radius-xl bg-surface-subtle border border-border-subtle">
                                            <div className="text-text-sm font-semibold text-text-primary">Sem subcategorias</div>
                                            <div className="text-text-sm text-text-secondary mt-space-1">
                                                Você pode buscar diretamente dentro desta categoria.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3">
                                            {subcategories.map((s) => {
                                                const isSelected = selectedSubcategoryId === s.id;
                                                return (
                                                    <button
                                                        key={s.id}
                                                        className={[
                                                            "text-left p-space-4 rounded-radius-xl border transition-colors flex items-center justify-between gap-space-3",
                                                            isSelected ? "border-action-primary bg-action-primary/10" : "border-border-subtle bg-surface-card hover:bg-surface-subtle",
                                                        ].join(" ")}
                                                        onClick={() => setSelectedSubcategoryId(isSelected ? "" : s.id)}
                                                    >
                                                        <div className="flex items-center gap-space-3">
                                                            <div className="text-text-xl">{getSubcategoryEmoji(s.name)}</div>
                                                            <div className="font-semibold text-text-primary">{s.name}</div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-text-muted" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-space-6 flex flex-col sm:flex-row gap-space-3 sm:justify-end">
                                    <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} className="h-11">
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleCategorySearch} className="h-11">
                                        Buscar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Featured */}
            <section className="container mx-auto px-space-4">
                <div className="flex justify-between items-end mb-space-8">
                    <h2 className="text-text-3xl font-bold text-text-primary">Destaques</h2>
                    <Button variant="ghost" className="text-action-primary font-medium" onClick={() => navigate('/directory')}>Ver todos</Button>
                </div>

                {featured.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
                        {featured.map((b) => (
                            <BusinessCard key={b.id} business={b} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-border-subtle">
                        <div className="text-text-secondary">Nenhum destaque disponível.</div>
                    </Card>
                )}
            </section>
        </div>
    );
}
