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
    { id: "500m", label: "At\xE9 500 m", maxDistance: 500 },
    { id: "1km", label: "At\xE9 1 km", maxDistance: 1000 },
] as const;

const CATEGORY_FILTERS = [
    { id: "comercio", label: "Com\xE9rcio" },
    { id: "servico", label: "Servi\xE7o" },
    { id: "escolar", label: "Escolar" },
    { id: "instituicao-publica", label: "Institui\xE7\xE3o P\xFAblica" },
    { id: "instituicao-comunitaria", label: "Institui\xE7\xE3o Comunit\xE1ria" },
    { id: "instituicao-religiosa", label: "Institui\xE7\xE3o Religiosa" },
] as const;

const RATING_FILTERS = [
    { id: "best-rated", label: "Mais bem avaliados" },
    { id: "with-reviews", label: "Com avalia\xE7\xF5es" },
    { id: "without-reviews", label: "Sem avalia\xE7\xF5es" },
] as const;

function getAddressLabel(business: Business) {
    return [business.address, business.neighborhood, business.city].filter(Boolean).join(", ") || "Endere\xE7o n\xE3o informado";
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
            className={`rounded-full border px-space-3 py-space-2 text-text-xs font-semibold transition-colors ${
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
                    typeof business.latitude === "number" && Number.isFinite(business.latitude) &&
                    typeof business.longitude === "number" && Number.isFinite(business.longitude)
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
            setError("N\xE3o foi poss\xEDvel acessar sua localiza\xE7\xE3o. Ative a permiss\xE3o de localiza\xE7\xE3o no navegador ou no celular.");
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
                    setError("N\xE3o foi poss\xEDvel acessar sua localiza\xE7\xE3o. Ative a permiss\xE3o de localiza\xE7\xE3o no navegador ou no celular.");
                } else {
                    setError("N\xE3o foi poss\xEDvel obter sua localiza\xE7\xE3o agora. Tente novamente.");
                }
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const emptyMessage = useMemo(() => {
        if (loading) return "";
        if (!businessesWithCoords.length) return "Ainda n\xE3o h\xE1 neg\xF3cios com localiza\xE7\xE3o dispon\xEDvel.";
        if (!userLocation) return "Toque em \u201CUsar minha localiza\xE7\xE3o\u201D para ver os neg\xF3cios mais pr\xF3ximos de voc\xEA.";
        if (!filteredBusinesses.length) return "Nenhum neg\xF3cio encontrado com os filtros selecionados.";
        return "";
    }, [businessesWithCoords.length, filteredBusinesses.length, loading, userLocation]);

    return (
        <div className="container mx-auto px-space-4 py-space-5 md:py-space-8">
            <div className="space-y-space-5">
                <div className="space-y-space-2">
                    <h1 className="text-text-2xl font-bold text-text-primary">Neg\xF3cios Pr\xF3ximos</h1>
                    <p className="text-text-sm text-text-secondary">Encontre os neg\xF3cios mais pr\xF3ximos da sua localiza\xE7\xE3o.</p>
                    {userLocation && filteredBusinesses.length > 0 && (
                        <div className="text-text-xs font-semibold uppercase tracking-wide text-action-primary">
                            {filteredBusinesses.length} neg\xF3cio(s) encontrados
                        </div>
                    )}
                </div>

                <Card className="border-border-subtle p-space-4">
                    <div className="flex flex-wrap items-center gap-space-2">
                        <Button onClick={handleUseMyLocation} disabled={locating} className="gap-space-2">
                            <LocateFixed className="h-4 w-4" />
                            {locating ? "Localizando..." : "Usar minha localiza\xE7\xE3o"}
                        </Button>
                        <Button variant="secondary" onClick={() => setFiltersOpen((prev) => !prev)} className="gap-space-2">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </Button>
                    </div>

                    {filtersOpen && (
                        <div className="mt-space-4 space-y-space-4">
                            <div>
                                <div className="mb-space-2 text-text-xs font-bold uppercase tracking-wide text-text-muted">Todos</div>
                                <div className="flex flex-wrap gap-space-2">
                                    <NearbyFilterChip label="Todos" selected={allSelected} onClick={handleToggleAll} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-space-2 text-text-xs font-bold uppercase tracking-wide text-text-muted">Por dist\xE2ncia</div>
                                <div className="flex flex-wrap gap-space-2">
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
                                <div className="mb-space-2 text-text-xs font-bold uppercase tracking-wide text-text-muted">Por categorias</div>
                                <div className="flex flex-wrap gap-space-2">
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
                                <div className="mb-space-2 text-text-xs font-bold uppercase tracking-wide text-text-muted">Por avalia\xE7\xE3o</div>
                                <div className="flex flex-wrap gap-space-2">
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
                    <div className="space-y-space-4">
                        {filteredBusinesses.map((business) => {
                            const whatsappLink = buildWhatsAppLink(
                                business.whatsapp || business.phone,
                                "Ol\xE1, vi seu neg\xF3cio no Tem Aki no Bairro!"
                            );
                            const routeLink = buildMapRouteLink(business);
                            const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
                            const ratingText = typeof business.rating === "number" && business.rating > 0
                                ? business.rating.toFixed(1).replace(".", ",")
                                : null;
                            const distanceLabel = formatDistance(business.distance_meters);

                            return (
                                <Card key={business.id} className="overflow-hidden border-border-subtle p-0">
                                    <div className="flex flex-col">
                                        <div className="aspect-[16/9] bg-surface-subtle">
                                            <img
                                                src={business.image_url || business.logo_url || "https://placehold.co/720x405/e2e8f0/94a3b8?text=Tem+Aki"}
                                                alt={business.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>

                                        <div className="space-y-space-4 p-space-4">
                                            <div className="flex items-start justify-between gap-space-3">
                                                <div className="min-w-0">
                                                    <div className="text-text-xs font-bold uppercase tracking-wide text-action-primary">
                                                        {business.category?.name || "Categoria n\xE3o informada"}
                                                    </div>
                                                    <h2 className="mt-space-1 text-text-lg font-bold text-text-primary">{business.name}</h2>
                                                </div>
                                                {distanceLabel && (
                                                    <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-action-primary/10 px-space-3 py-space-1 text-text-xs font-semibold text-action-primary">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {distanceLabel}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-text-sm text-text-secondary">{getAddressLabel(business)}</div>

                                            <div className="flex flex-wrap items-center gap-space-3 text-text-sm text-text-secondary">
                                                {ratingText ? (
                                                    <div className="inline-flex items-center gap-1">
                                                        <Star className="h-4 w-4 fill-current text-status-warning" />
                                                        <span>{ratingText}</span>
                                                        {reviewCount > 0 && <span>({reviewCount} avalia\xE7\xF5es)</span>}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-text-muted">
                                                        <Star className="h-4 w-4 text-border-default" />
                                                        <span>{reviewCount > 0 ? `${reviewCount} avalia\xE7\xF5es` : "Sem avalia\xE7\xF5es"}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-space-2 sm:grid-cols-3">
                                                <Link
                                                    to={`/app/business/${business.id}`}
                                                    className="inline-flex items-center justify-center rounded-radius-lg bg-action-primary px-space-4 py-space-3 text-text-sm font-semibold text-text-on-brand"
                                                    onClick={() => registerNearbyEvent(business.id, "map_click", "nearby_profile_click")}
                                                >
                                                    Ver Perfil
                                                </Link>

                                                {whatsappLink ? (
                                                    <a
                                                        href={whatsappLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1 rounded-radius-lg border border-border-subtle px-space-4 py-space-3 text-text-sm font-semibold text-status-success"
                                                        onClick={() =>
                                                            registerNearbyEvent(business.id, "whatsapp_click", "nearby_whatsapp_click", {
                                                                has_whatsapp: Boolean(business.whatsapp || business.phone),
                                                            })
                                                        }
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                        WhatsApp
                                                    </a>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center rounded-radius-lg border border-border-subtle px-space-4 py-space-3 text-text-sm font-semibold text-text-muted">
                                                        WhatsApp indispon\xEDvel
                                                    </div>
                                                )}

                                                {routeLink ? (
                                                    <a
                                                        href={routeLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1 rounded-radius-lg border border-border-subtle px-space-4 py-space-3 text-text-sm font-semibold text-action-primary"
                                                        onClick={() =>
                                                            registerNearbyEvent(business.id, "map_click", "map_route_request", {
                                                                route_target: "google_maps",
                                                            })
                                                        }
                                                    >
                                                        <Navigation className="h-4 w-4" />
                                                        Como chegar
                                                    </a>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center rounded-radius-lg border border-border-subtle px-space-4 py-space-3 text-text-sm font-semibold text-text-muted">
                                                        Rota indispon\xEDvel
                                                    </div>
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
