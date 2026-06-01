import { useEffect, useMemo, useState } from "react";
import { MapComponent, type MapMarker } from "../components/MapComponent";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../services/api";
import type { ApiResponse, Business } from "../types";

export function Geolocation() {
    const [center, setCenter] = useState<[number, number]>([-2.55, -44.06]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        if (!markers.length) return;
        const sum = markers.reduce(
            (acc, m) => ({ lat: acc.lat + m.position[0], lng: acc.lng + m.position[1] }),
            { lat: 0, lng: 0 }
        );
        setCenter([sum.lat / markers.length, sum.lng / markers.length]);
    }, [markers]);

    const locateMe = () => {
        setError("");
        if (!navigator.geolocation) {
            setError("Geolocalização não suportada.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCenter([pos.coords.latitude, pos.coords.longitude]);
            },
            () => {
                setError("Não foi possível obter sua localização.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="container mx-auto px-space-4 py-space-10">
            <div className="flex items-center justify-between mb-space-6">
                <h1 className="text-text-3xl font-bold text-text-primary">Mapa</h1>
                <Button variant="secondary" onClick={locateMe}>Usar minha localização</Button>
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
                <MapComponent center={center} zoom={13} markers={markers} className="h-[520px] w-full" />
            )}
        </div>
    );
}
