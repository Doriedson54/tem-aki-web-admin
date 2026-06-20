import { useEffect } from "react";
import type { ReactNode } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapboxMapComponent } from "./MapboxMapComponent";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM } from "../config/geo";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface MapMarker {
    id: number | string;
    position: [number, number];
    title: string;
    popupContent?: ReactNode;
    onClick?: () => void;
}

export interface MapHighlightPoint {
    position: [number, number];
    label?: string;
    popupContent?: ReactNode;
}

export interface MapViewportBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface MapComponentProps {
    center?: [number, number];
    zoom?: number;
    markers?: MapMarker[];
    userLocation?: [number, number] | null;
    highlightPoint?: MapHighlightPoint | null;
    className?: string;
    onBoundsChange?: (bounds: MapViewportBounds) => void;
    onMapClick?: (position: [number, number]) => void;
}

function MapViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, map, zoom]);
    return null;
}

function MapBoundsListener({
    onBoundsChange,
    onMapClick,
}: {
    onBoundsChange?: (bounds: MapViewportBounds) => void;
    onMapClick?: (position: [number, number]) => void;
}) {
    const map = useMap();

    useEffect(() => {
        if (!onBoundsChange) return;
        const bounds = map.getBounds();
        onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
        });
    }, [map, onBoundsChange]);

    useMapEvents({
        click(event) {
            if (!onMapClick) return;
            onMapClick([event.latlng.lat, event.latlng.lng]);
        },
        moveend() {
            if (!onBoundsChange) return;
            const bounds = map.getBounds();
            onBoundsChange({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            });
        },
        zoomend() {
            if (!onBoundsChange) return;
            const bounds = map.getBounds();
            onBoundsChange({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            });
        },
    });

    return null;
}

function LeafletMapComponent({
    center = NOVA_TERRA_CENTER,
    zoom = NOVA_TERRA_DEFAULT_ZOOM,
    markers = [],
    userLocation = null,
    highlightPoint = null,
    className = "h-[400px] w-full",
    onBoundsChange,
    onMapClick,
}: MapComponentProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            touchZoom
            dragging
            doubleClickZoom
            zoomControl
            tap
            className={`rounded-xl z-0 overflow-hidden touch-auto [touch-action:auto] ${className}`}
        >
            <MapViewSync center={center} zoom={zoom} />
            <MapBoundsListener onBoundsChange={onBoundsChange} onMapClick={onMapClick} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
                <CircleMarker center={userLocation} radius={10} pathOptions={{ color: "#2563eb", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.35 }}>
                    <Popup>Você está aqui</Popup>
                </CircleMarker>
            )}
            {highlightPoint && (
                <CircleMarker center={highlightPoint.position} radius={9} pathOptions={{ color: "#ea580c", weight: 2, fillColor: "#fb923c", fillOpacity: 0.4 }}>
                    <Popup>
                        <div className="text-sm">
                            <h3 className="font-bold">{highlightPoint.label || "Ponto selecionado"}</h3>
                            {highlightPoint.popupContent}
                        </div>
                    </Popup>
                </CircleMarker>
            )}
            {markers.map((marker) => (
                <Marker key={marker.id} position={marker.position} eventHandlers={marker.onClick ? { click: marker.onClick } : undefined}>
                    <Popup>
                        <div className="min-w-[220px] max-w-[280px] text-sm">
                            {!marker.popupContent && <h3 className="font-bold">{marker.title}</h3>}
                            {marker.popupContent}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export function MapComponent(props: MapComponentProps) {
    const mapboxAccessToken = String(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "").trim();

    if (mapboxAccessToken) {
        return <MapboxMapComponent accessToken={mapboxAccessToken} {...props} />;
    }

    return (
        <div className="space-y-space-3">
            <div className="rounded-radius-xl border border-border-subtle bg-surface-subtle px-space-4 py-space-3 text-text-sm text-text-secondary">
                Mapa temporariamente indisponível. Token Mapbox não configurado.
            </div>
            <LeafletMapComponent {...props} />
        </div>
    );
}
