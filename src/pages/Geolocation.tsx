import { useEffect, useMemo, useState } from "react";
import { MapComponent, type MapMarker } from "../components/MapComponent";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../services/api";
import type { ApiResponse, Business } from "../types";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "../config/geo";

export function Geolocation() {
    const [center, setCenter] = useState<[number, number]>(NOVA_TERRA_CENTER);
    const [zoom, setZoom] = useState<number>(NOVA_TERRA_DEFAULT_ZOOM);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [error, setError] = useState("");

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

    const markers = useMemo<MapMarker[]>(() => {
        return businesses
            .filter((b) => typeof b.latitude === "number" && typeof b.longitude === "number")
            .map((b) => ({
                id: b.id,
                position: [Number(b.latitude), Number(b.longitude)] as [number, number],
                title: b.name,
                popupContent: (
                    <div className="text-text-xs text-text-muted">
                        {b.neighborhood ? `${b.neighborhood}` : ""}
                    </div>
                ),
            }));
    }, [businesses]);

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
        <div className="container mx-auto px-space-4 py-space-10">
            <div className="flex items-center justify-between mb-space-6">
                <h1 className="text-text-3xl font-bold text-text-primary">Mapa</h1>
                <div className="flex gap-space-2">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setUserLocation(null);
                            setCenter(NOVA_TERRA_CENTER);
                            setZoom(NOVA_TERRA_DEFAULT_ZOOM);
                            setError("");
                        }}
                    >
                        Nova Terra
                    </Button>
                    <Button variant="secondary" onClick={locateMe} disabled={locating}>
                        {locating ? "Localizando..." : "Usar minha localização"}
                    </Button>
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
                <MapComponent center={center} zoom={zoom} userLocation={userLocation} markers={markers} className="h-[520px] w-full" />
            )}
        </div>
    );
}
