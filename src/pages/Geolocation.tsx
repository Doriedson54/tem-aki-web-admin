import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, MessageCircle, Navigation, Star } from "lucide-react";
import { MapComponent, type MapMarker, type MapViewportBounds } from "../components/MapComponent";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../services/api";
import type { ApiResponse, Business } from "../types";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "../config/geo";
import { trackBusinessEvent } from "../services/businessEvents";

type BusinessWithDistance = Business & { distance_meters?: number };

function buildWhatsAppLink(rawPhone: string, message: string): string | null {
    const digitsOnly = String(rawPhone || "").replace(/\D/g, "");
    if (!digitsOnly) return null;
    const normalizedDigits = digitsOnly.replace(/^0+/, "");
    const withCountry = normalizedDigits.startsWith("55") ? normalizedDigits : `55${normalizedDigits}`;
    if (withCountry.length < 12) return null;
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function buildMapRouteLink(business: Business): string | null {
    if (typeof business.latitude === "number" && typeof business.longitude === "number") {
        return `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`;
    }
    if (business.address) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`;
    }
    return null;
}

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

function calculateDistanceMeters(origin: [number, number], destination: [number, number]) {
    const earthRadius = 6371000;
    const dLat = toRadians(destination[0] - origin[0]);
    const dLng = toRadians(destination[1] - origin[1]);
    const lat1 = toRadians(origin[0]);
    const lat2 = toRadians(destination[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function formatDistance(distanceMeters?: number) {
    if (typeof distanceMeters !== "number" || !Number.isFinite(distanceMeters)) return null;
    if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
    return `${(distanceMeters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function Geolocation() {
    const location = useLocation();
    const [center, setCenter] = useState<[number, number]>(NOVA_TERRA_CENTER);
    const [zoom, setZoom] = useState<number>(NOVA_TERRA_DEFAULT_ZOOM);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [visibleBounds, setVisibleBounds] = useState<MapViewportBounds | null>(null);
    const [showNearbyList, setShowNearbyList] = useState(false);
    const [error, setError] = useState("");
    const didTrackOpenRef = useRef(false);
    const isAppFlow = location.pathname.startsWith("/app");
    const detailsPrefix = isAppFlow ? "/app" : "";
    const eventSource = isAppFlow ? "app_map" : "site_map";

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const resp = await api.get<ApiResponse<Business[]>>("/businesses?limit=200");
                if (!cancelled && resp.data.success) setBusinesses(resp.data.data || []);
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
                    typeof business.latitude === "number" && typeof business.longitude === "number"
            ),
        [businesses]
    );

    const visibleBusinesses = useMemo(() => {
        if (!visibleBounds) return businessesWithCoords;
        return businessesWithCoords.filter(
            (business) =>
                business.latitude <= visibleBounds.north &&
                business.latitude >= visibleBounds.south &&
                business.longitude <= visibleBounds.east &&
                business.longitude >= visibleBounds.west
        );
    }, [businessesWithCoords, visibleBounds]);

    const nearbyBusinesses = useMemo<BusinessWithDistance[]>(() => {
        if (!userLocation) return [];
        return businessesWithCoords
            .map((business) => ({
                ...business,
                distance_meters: calculateDistanceMeters(userLocation, [business.latitude, business.longitude]),
            }))
            .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    }, [businessesWithCoords, userLocation]);

    const listedBusinesses = showNearbyList && nearbyBusinesses.length ? nearbyBusinesses : visibleBusinesses;

    const registerBusinessMapEvent = (businessId: string, action: "map_open" | "map_marker_click" | "map_route_request", metadata?: Record<string, unknown>) => {
        void trackBusinessEvent({
            business_id: businessId,
            event_type: "map_click",
            source: eventSource,
            metadata: {
                action,
                path: location.pathname,
                ...metadata,
            },
        });
    };

    useEffect(() => {
        if (didTrackOpenRef.current) return;
        if (!businessesWithCoords.length) return;
        didTrackOpenRef.current = true;
        registerBusinessMapEvent(businessesWithCoords[0].id, "map_open", {
            visible_businesses: visibleBusinesses.length,
            reused_event_type: "map_click",
        });
    }, [businessesWithCoords, visibleBusinesses.length]);

    const markers = useMemo<MapMarker[]>(() => {
        return businessesWithCoords
            .map((b) => ({
                id: b.id,
                position: [Number(b.latitude), Number(b.longitude)] as [number, number],
                title: b.name,
                onClick: () => {
                    registerBusinessMapEvent(b.id, "map_marker_click", {
                        category: b.category?.name || null,
                        reused_event_type: "map_click",
                    });
                },
                popupContent: (
                    <div className="mt-space-2 space-y-space-3">
                        {(b.image_url || b.logo_url) && (
                            <img
                                src={b.image_url || b.logo_url}
                                alt={b.name}
                                className="h-24 w-full rounded-radius-lg object-cover"
                            />
                        )}
                        <div className="text-text-xs text-text-muted">
                            {b.category?.name || "Categoria não informada"}
                            {b.subcategory?.name ? ` • ${b.subcategory.name}` : ""}
                        </div>
                        <div className="text-text-sm font-semibold text-text-primary">{b.name}</div>
                        <div className="text-text-xs text-text-secondary">
                            {[b.address, b.neighborhood, b.city].filter(Boolean).join(", ") || "Endereço não informado"}
                        </div>
                        {typeof b.rating === "number" && b.rating > 0 && (
                            <div className="mt-space-2 flex items-center gap-space-2 text-text-xs text-text-secondary">
                                <span className="inline-flex items-center gap-1 text-status-warning">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    {b.rating.toFixed(1).replace(".", ",")}
                                </span>
                                {typeof b.review_count === "number" && b.review_count > 0 && (
                                    <span>({b.review_count} avaliações)</span>
                                )}
                            </div>
                        )}
                        <div className="mt-space-3 flex flex-col gap-space-2">
                            <Link
                                to={`${detailsPrefix}/business/${b.id}`}
                                className="inline-flex items-center justify-center rounded-radius-lg bg-action-primary px-space-3 py-space-2 text-text-xs font-semibold text-text-on-brand"
                            >
                                Ver Perfil
                            </Link>
                            {buildWhatsAppLink(b.whatsapp || b.phone, `Olá, vi seu negócio no Tem Aki no Bairro!`) && (
                                <a
                                    href={buildWhatsAppLink(b.whatsapp || b.phone, `Olá, vi seu negócio no Tem Aki no Bairro!`) || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1 rounded-radius-lg border border-border-subtle px-space-3 py-space-2 text-text-xs font-semibold text-status-success"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    WhatsApp
                                </a>
                            )}
                            {buildMapRouteLink(b) && (
                                <a
                                    href={buildMapRouteLink(b) || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1 rounded-radius-lg border border-border-subtle px-space-3 py-space-2 text-text-xs font-semibold text-action-primary"
                                    onClick={() =>
                                        registerBusinessMapEvent(b.id, "map_route_request", {
                                            route_target: "google_maps",
                                            reused_event_type: "map_click",
                                        })
                                    }
                                >
                                    <Navigation className="h-3.5 w-3.5" />
                                    Como chegar
                                </a>
                            )}
                        </div>
                    </div>
                ),
            }));
    }, [businessesWithCoords, detailsPrefix]);

    const locateMe = () => {
        setError("");
        if (!navigator.geolocation) {
            setError("Geolocalização não suportada.");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(next);
                setCenter(next);
                setZoom(USER_LOCATION_ZOOM);
                setShowNearbyList(false);
                setLocating(false);
            },
            (err) => {
                if (err?.code === 1) {
                    setError("Permissão negada. Ative a localização nas configurações do navegador para centralizar no seu ponto.");
                } else {
                    setError("Não foi possível obter sua localização agora. Tente novamente.");
                }
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="container mx-auto px-space-4 py-space-6 md:py-space-10">
            <div className="mb-space-6 flex flex-col gap-space-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-text-3xl font-bold text-text-primary">Mapa</h1>
                    <p className="mt-space-1 text-text-sm text-text-secondary">
                        {visibleBusinesses.length
                            ? `${visibleBusinesses.length} negócio(s) nesta região`
                            : "Nenhum negócio visível nesta área"}
                    </p>
                </div>
                <div className="flex flex-wrap gap-space-2">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setUserLocation(null);
                            setCenter(NOVA_TERRA_CENTER);
                            setZoom(NOVA_TERRA_DEFAULT_ZOOM);
                            setShowNearbyList(false);
                            setError("");
                        }}
                    >
                        Nova Terra
                    </Button>
                    <Button variant="secondary" onClick={locateMe} disabled={locating}>
                        {locating ? "Localizando..." : "Usar minha localização"}
                    </Button>
                    {userLocation && nearbyBusinesses.length > 0 && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setCenter(userLocation);
                                setZoom(USER_LOCATION_ZOOM);
                                setShowNearbyList(true);
                            }}
                        >
                            Negócios próximos de você
                        </Button>
                    )}
                </div>
            </div>
            {error && (
                <Card className="border-border-subtle mb-space-6">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}
            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <div className="space-y-space-5">
                    <MapComponent
                        center={center}
                        zoom={zoom}
                        userLocation={userLocation}
                        markers={markers}
                        onBoundsChange={setVisibleBounds}
                        className="h-[52dvh] min-h-[360px] w-full"
                    />

                    <Card className="border-border-subtle">
                        <div className="flex items-center justify-between gap-space-4">
                            <div>
                                <h2 className="text-text-lg font-bold text-text-primary">
                                    {showNearbyList ? "Negócios próximos de você" : "Negócios visíveis nesta área"}
                                </h2>
                                <p className="mt-space-1 text-text-sm text-text-secondary">
                                    {showNearbyList
                                        ? "Ordenados pela distância aproximada a partir da sua localização."
                                        : "A lista reflete preferencialmente a área visível do mapa."}
                                </p>
                            </div>
                            {showNearbyList && (
                                <Button variant="secondary" onClick={() => setShowNearbyList(false)}>
                                    Voltar para área visível
                                </Button>
                            )}
                        </div>

                        <div className="mt-space-5 space-y-space-3">
                            {listedBusinesses.length ? (
                                listedBusinesses.map((business) => {
                                    const whatsappLink = buildWhatsAppLink(
                                        business.whatsapp || business.phone,
                                        "Olá, vi seu negócio no Tem Aki no Bairro!"
                                    );
                                    const routeLink = buildMapRouteLink(business);
                                    const distanceLabel = formatDistance((business as BusinessWithDistance).distance_meters);

                                    return (
                                        <div key={business.id} className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-4">
                                            <div className="flex items-start justify-between gap-space-4">
                                                <div className="min-w-0">
                                                    <div className="text-text-base font-bold text-text-primary">{business.name}</div>
                                                    <div className="mt-space-1 text-text-sm text-text-secondary">
                                                        {business.category?.name || "Categoria não informada"}
                                                        {business.subcategory?.name ? ` • ${business.subcategory.name}` : ""}
                                                    </div>
                                                    {typeof business.rating === "number" && business.rating > 0 && (
                                                        <div className="mt-space-2 text-text-sm text-text-secondary">
                                                            ★ {business.rating.toFixed(1).replace(".", ",")}
                                                            {typeof business.review_count === "number" && business.review_count > 0
                                                                ? ` (${business.review_count} avaliações)`
                                                                : ""}
                                                        </div>
                                                    )}
                                                    {distanceLabel && (
                                                        <div className="mt-space-2 inline-flex items-center gap-1 rounded-radius-full bg-action-primary/10 px-space-3 py-space-1 text-text-xs font-semibold text-action-primary">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {distanceLabel}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 flex-col gap-space-2">
                                                    <Link
                                                        to={`${detailsPrefix}/business/${business.id}`}
                                                        className="inline-flex items-center justify-center rounded-radius-lg bg-action-primary px-space-4 py-space-2 text-text-xs font-semibold text-text-on-brand"
                                                    >
                                                        Ver Perfil
                                                    </Link>
                                                    {whatsappLink && (
                                                        <a
                                                            href={whatsappLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center gap-1 rounded-radius-lg border border-border-subtle px-space-4 py-space-2 text-text-xs font-semibold text-status-success"
                                                        >
                                                            <MessageCircle className="h-3.5 w-3.5" />
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                    {routeLink && (
                                                        <a
                                                            href={routeLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center gap-1 rounded-radius-lg border border-border-subtle px-space-4 py-space-2 text-text-xs font-semibold text-action-primary"
                                                            onClick={() =>
                                                                registerBusinessMapEvent(business.id, "map_route_request", {
                                                                    route_target: "google_maps",
                                                                    reused_event_type: "map_click",
                                                                })
                                                            }
                                                        >
                                                            <Navigation className="h-3.5 w-3.5" />
                                                        Como chegar
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-radius-2xl border border-border-subtle bg-surface-card p-space-5 text-text-sm text-text-secondary">
                                    {showNearbyList
                                        ? "Nenhum negócio com coordenadas foi encontrado próximo à sua localização."
                                        : "Nenhum negócio visível nesta área."}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
