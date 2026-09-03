import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Filter, LocateFixed, MapPin, MessageCircle, Navigation, Star } from "lucide-react";
import api from "../services/api";
import type { ApiResponse, Business } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { trackBusinessEvent } from "../services/businessEvents";
import { buildMapRouteLink, buildWhatsAppLink, calculateDistanceMeters, formatDistance, normalizeText } from "../lib/businessLocation";

type NearbyBusiness = Business & { distance_meters: number };

const DISTANCE_FILTERS = [
    { id: "500m", label: "Até 500 m", maxDistance: 500 },
    { id: "1km", label: "Até 1 km", maxDistance: 1000 },
] as const;

const CATEGORY_FILTERS = [
    { id: "comercio", label: "Comércio" },
    { id: "servico", label: "Serviço" },
    { id: "escolar", label: "Escolar" },
    { id: "instituicao-publica", label: "Instituição Pública" },
    { id: "instituicao-comunitaria", label: "Instituição Comunitária" },
    { id: "instituicao-religiosa", label: "Instituição Religiosa" },
] as const;

const RATING_FILTERS = [
    { id: "best-rated", label: "Mais bem avaliados" },
    { id: "with-reviews", label: "Com avaliações" },
    { id: "without-reviews", label: "Sem avaliações" },
] as const;

function getAddressLabel(business: Business) {
    return [business.neighborhood, business.city].filter(Boolean).join(", ") || business.address || "Endereço não informado";
}

function matchesCategoryFilter(categoryName: string | undefined, filterId: (typeof CATEGORY_FILTERS)[number]["id"]) {
    const normalizedName = normalizeText(categoryName || "");

    if (!normalizedName) return false;
    if (filterId === "comercio") return normalizedName.includes("comerc");
    if (filterId === "servico") return normalizedName.includes("servic");
    if (filterId === "escolar") return normalizedName.includes("escolar");
    if (filterId === "instituicao-publica") return normalizedName.includes("instituic") && normalizedName.includes("public");
    if (filterId === "instituicao-comunitaria") return normalizedName.includes("instituic") && normalizedName.includes("comunit");
    if (filterId === "instituicao-religiosa") return normalizedName.includes("instituic") && normalizedName.includes("relig");

    return false;
}

function sortNearbyBusinesses(items: NearbyBusiness[], prioritizeRating: boolean) {
    return [...items].sort((a, b) => {
        if (prioritizeRating) {
            const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
            if (ratingDiff !== 0) return ratingDiff;

            const reviewDiff = (Number(b.review_count) || 0) - (Number(a.review_count) || 0);
            if (reviewDiff !== 0) return reviewDiff;
        }

        return a.distance_meters - b.distance_meters;
    });
}

function NearbyFilterChip({
    label,
    selected,
    onClick,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-space-3 py-1.5 text-[11px] font-semibold transition-colors ${
                selected
                    ? "border-action-primary bg-action-primary text-text-on-brand"
                    : "border-border-default bg-surface-card text-text-secondary hover:border-action-primary hover:text-action-primary"
            }`}
        >
            {label}
        </button>
    );
}

export function AppNearby() {
    const location = useLocation();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [error, setError] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [allSelected, setAllSelected] = useState(true);
    const [distanceFilters, setDistanceFilters] = useState<string[]>([]);
    const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
    const [ratingFilters, setRatingFilters] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<Business[]>>("/businesses?limit=200");
                if (!cancelled && response.data.success) {
                    setBusinesses(Array.isArray(response.data.data) ? response.data.data : []);
                }
            } catch {
                if (!cancelled) setBusinesses([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const businessesWithCoords = useMemo(
        () =>
            businesses.filter(
                (business): business is Business & { latitude: number; longitude: number } =>
                    typeof business.latitude === "number" &&
                    Number.isFinite(business.latitude) &&
                    typeof business.longitude === "number" &&
                    Number.isFinite(business.longitude)
            ),
        [businesses]
    );

    const nearbyBusinesses = useMemo<NearbyBusiness[]>(() => {
        if (!userLocation) return [];

        return businessesWithCoords.map((business) => ({
            ...business,
            distance_meters: calculateDistanceMeters(userLocation, [business.latitude, business.longitude]),
        }));
    }, [businessesWithCoords, userLocation]);

    const filteredBusinesses = useMemo(() => {
        if (!userLocation) return [];

        const thresholdIds = new Set(distanceFilters);
        const categoryIds = new Set(categoryFilters);
        const ratingIds = new Set(ratingFilters);
        const prioritizeRating = ratingIds.has("best-rated");

        const filtered = nearbyBusinesses.filter((business) => {
            if (allSelected) return true;

            const distanceMatches =
                thresholdIds.size === 0 ||
                DISTANCE_FILTERS.some((filter) => thresholdIds.has(filter.id) && business.distance_meters <= filter.maxDistance);

            const categoryMatches =
                categoryIds.size === 0 ||
                CATEGORY_FILTERS.some((filter) => categoryIds.has(filter.id) && matchesCategoryFilter(business.category?.name, filter.id));

            const reviewCount = Number(business.review_count) || 0;
            const ratingFiltersWithoutSort = [...ratingIds].filter((id) => id !== "best-rated");
            const ratingMatches =
                ratingFiltersWithoutSort.length === 0 ||
                ratingFiltersWithoutSort.some((filterId) => {
                    if (filterId === "with-reviews") return reviewCount > 0;
                    if (filterId === "without-reviews") return reviewCount === 0;
                    return false;
                });

            return distanceMatches && categoryMatches && ratingMatches;
        });

        return sortNearbyBusinesses(filtered, prioritizeRating);
    }, [allSelected, categoryFilters, distanceFilters, nearbyBusinesses, ratingFilters, userLocation]);

    const registerNearbyEvent = (
        businessId: string,
        eventType: "map_click" | "whatsapp_click",
        action: string,
        metadata?: Record<string, unknown>
    ) => {
        void trackBusinessEvent({
            business_id: businessId,
            event_type: eventType,
            source: "app_nearby",
            metadata: {
                action,
                path: location.pathname,
                ...metadata,
            },
        });
    };

    const syncAllFilterState = (nextDistanceFilters: string[], nextCategoryFilters: string[], nextRatingFilters: string[]) => {
        const hasSpecificFilters = nextDistanceFilters.length > 0 || nextCategoryFilters.length > 0 || nextRatingFilters.length > 0;
        setAllSelected(!hasSpecificFilters);
    };

    const toggleSelection = (current: string[], value: string) => {
        return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    };

    const handleToggleAll = () => {
        setAllSelected(true);
        setDistanceFilters([]);
        setCategoryFilters([]);
        setRatingFilters([]);
    };

    const handleToggleDistance = (filterId: string) => {
        const nextDistanceFilters = toggleSelection(distanceFilters, filterId);
        setDistanceFilters(nextDistanceFilters);
        syncAllFilterState(nextDistanceFilters, categoryFilters, ratingFilters);
    };

    const handleToggleCategory = (filterId: string) => {
        const nextCategoryFilters = toggleSelection(categoryFilters, filterId);
        setCategoryFilters(nextCategoryFilters);
        syncAllFilterState(distanceFilters, nextCategoryFilters, ratingFilters);
    };

    const handleToggleRating = (filterId: string) => {
        const nextRatingFilters = toggleSelection(ratingFilters, filterId);
        setRatingFilters(nextRatingFilters);
        syncAllFilterState(distanceFilters, categoryFilters, nextRatingFilters);
    };

    const handleUseMyLocation = () => {
        setError("");

        if (!navigator.geolocation) {
            setError("Não foi possível acessar sua localização. Ative a permissão de localização no navegador ou no celular.");
            return;
        }

        if (businessesWithCoords[0]?.id) {
            registerNearbyEvent(businessesWithCoords[0].id, "map_click", "nearby_location_request", {
                available_businesses: businessesWithCoords.length,
            });
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
                setLocating(false);
            },
            (geoError) => {
                if (geoError?.code === 1) {
                    setError("Não foi possível acessar sua localização. Ative a permissão de localização no navegador ou no celular.");
                } else {
                    setError("Não foi possível obter sua localização agora. Tente novamente.");
                }
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const emptyMessage = useMemo(() => {
        if (loading) return "";
        if (!businessesWithCoords.length) return "Ainda não há negócios com localização disponível.";
        if (!userLocation) return 'Toque em "Usar minha localização" para ver os negócios mais próximos de você.';
        if (!filteredBusinesses.length) return "Nenhum negócio encontrado com os filtros selecionados.";
        return "";
    }, [businessesWithCoords.length, filteredBusinesses.length, loading, userLocation]);

    return (
        <div className="container mx-auto px-space-4 py-space-5 md:py-space-8">
            <div className="space-y-space-4 pb-space-2">
                <div className="space-y-space-1">
                    <h1 className="text-text-2xl font-bold text-text-primary">Negócios Próximos</h1>
                    <p className="text-text-sm text-text-secondary">Encontre os negócios mais próximos da sua localização.</p>
                    {userLocation && filteredBusinesses.length > 0 && (
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-action-primary">
                            {filteredBusinesses.length} negócio(s) encontrados
                        </div>
                    )}
                </div>

                <Card className="border-border-subtle p-space-3">
                    <div className="flex flex-wrap items-center gap-space-2">
                        <Button
                            onClick={handleUseMyLocation}
                            disabled={locating}
                            variant="ghost"
                            className="group h-10 gap-space-2 rounded-radius-md border border-border-subtle border-b-4 bg-[#FFF1E2] px-space-4 text-text-sm font-semibold text-[#B86A1A] shadow-[0_4px_0_0_#E7C9A4] transition-all duration-150 hover:translate-y-[1px] hover:border-b-[3px] hover:bg-[#FFE9D1] hover:shadow-[0_3px_0_0_#E7C9A4] active:translate-y-[3px] active:border-b-2 active:shadow-[0_1px_0_0_#E7C9A4] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-b-4 disabled:hover:shadow-[0_4px_0_0_#E7C9A4]"
                        >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#B86A1A] shadow-[0_2px_0_0_#DCC9B2] transition-all duration-150 group-hover:translate-y-[0.5px] group-hover:shadow-[0_1.5px_0_0_#DCC9B2] group-active:translate-y-[1px] group-active:shadow-[0_0.5px_0_0_#DCC9B2] group-disabled:shadow-[0_2px_0_0_#DCC9B2] group-disabled:group-hover:translate-y-0 group-disabled:group-hover:shadow-[0_2px_0_0_#DCC9B2]">
                                <LocateFixed className="h-3.5 w-3.5" />
                            </span>
                            {locating ? "Localizando..." : "Usar minha localização"}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setFiltersOpen((prev) => !prev)}
                            className="h-9 gap-space-2 px-space-3 text-text-sm"
                        >
                            <Filter className="h-4 w-4" />
                            Filtros
                        </Button>
                    </div>

                    {filtersOpen && (
                        <div className="mt-space-3 space-y-space-3">
                            <div>
                                <div className="mb-space-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Todos</div>
                                <div className="flex flex-wrap gap-2">
                                    <NearbyFilterChip label="Todos" selected={allSelected} onClick={handleToggleAll} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-space-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Por distância</div>
                                <div className="flex flex-wrap gap-2">
                                    {DISTANCE_FILTERS.map((filter) => (
                                        <NearbyFilterChip
                                            key={filter.id}
                                            label={filter.label}
                                            selected={!allSelected && distanceFilters.includes(filter.id)}
                                            onClick={() => handleToggleDistance(filter.id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-space-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Por categorias</div>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_FILTERS.map((filter) => (
                                        <NearbyFilterChip
                                            key={filter.id}
                                            label={filter.label}
                                            selected={!allSelected && categoryFilters.includes(filter.id)}
                                            onClick={() => handleToggleCategory(filter.id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-space-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Por avaliação</div>
                                <div className="flex flex-wrap gap-2">
                                    {RATING_FILTERS.map((filter) => (
                                        <NearbyFilterChip
                                            key={filter.id}
                                            label={filter.label}
                                            selected={!allSelected && ratingFilters.includes(filter.id)}
                                            onClick={() => handleToggleRating(filter.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {error && (
                    <Card className="border-border-subtle p-space-4">
                        <div className="text-text-sm font-semibold text-status-error">{error}</div>
                    </Card>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-space-12 text-action-primary">
                        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-action-primary" />
                    </div>
                ) : emptyMessage ? (
                    <Card className="border-border-subtle p-space-5">
                        <div className="text-text-sm text-text-secondary">{emptyMessage}</div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 gap-3 pb-space-3">
                        {filteredBusinesses.map((business) => {
                            const whatsappLink = buildWhatsAppLink(
                                business.whatsapp || business.phone,
                                "Olá, vi seu negócio no Tem Aki no Bairro!"
                            );
                            const routeLink = buildMapRouteLink(business);
                            const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
                            const ratingText =
                                typeof business.rating === "number" && business.rating > 0
                                    ? business.rating.toFixed(1).replace(".", ",")
                                    : null;
                            const distanceLabel = formatDistance(business.distance_meters);

                            return (
                                <Card key={business.id} className="overflow-hidden border-border-subtle p-0">
                                    <div className="flex h-full flex-col">
                                        <div className="aspect-[16/10] bg-surface-subtle">
                                            <img
                                                src={business.image_url || business.logo_url || "https://placehold.co/480x300/e2e8f0/94a3b8?text=Tem+Aki"}
                                                alt={business.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>

                                        <div className="flex h-full flex-col gap-2 p-space-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-[10px] font-bold uppercase tracking-wide text-action-primary">
                                                    {business.category?.name || "Categoria não informada"}
                                                </div>
                                                <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-text-primary">
                                                    {business.name}
                                                </h2>
                                            </div>

                                            <div className="truncate text-[11px] text-text-secondary">{getAddressLabel(business)}</div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="inline-flex min-w-0 items-center gap-1 rounded-full bg-action-primary/10 px-2 py-1 text-[11px] font-semibold text-action-primary">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{distanceLabel || "--"}</span>
                                                </div>
                                                <div className="inline-flex min-w-0 items-center gap-1 text-[11px] text-text-secondary">
                                                    <Star className={`h-3.5 w-3.5 ${ratingText ? "fill-current text-status-warning" : "text-border-default"}`} />
                                                    <span className="truncate">{ratingText ? `${ratingText} (${reviewCount})` : reviewCount > 0 ? `${reviewCount} avaliações` : "Sem avaliações"}</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center gap-2">
                                                <Link
                                                    to={`/app/business/${business.id}`}
                                                    className="inline-flex h-8 flex-1 items-center justify-center rounded-radius-md bg-action-primary px-2 text-[11px] font-semibold text-text-on-brand"
                                                    onClick={() => registerNearbyEvent(business.id, "map_click", "nearby_profile_click")}
                                                >
                                                    Perfil
                                                </Link>

                                                {whatsappLink && (
                                                    <a
                                                        href={whatsappLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`WhatsApp de ${business.name}`}
                                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-md border border-border-subtle text-status-success"
                                                        onClick={() =>
                                                            registerNearbyEvent(business.id, "whatsapp_click", "nearby_whatsapp_click", {
                                                                has_whatsapp: Boolean(business.whatsapp || business.phone),
                                                            })
                                                        }
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </a>
                                                )}

                                                {routeLink && (
                                                    <a
                                                        href={routeLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Como chegar em ${business.name}`}
                                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-md border border-border-subtle text-action-primary"
                                                        onClick={() =>
                                                            registerNearbyEvent(business.id, "map_click", "map_route_request", {
                                                                route_target: "google_maps",
                                                            })
                                                        }
                                                    >
                                                        <Navigation className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
