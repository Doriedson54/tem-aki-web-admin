import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface MapMarker {
    id: number | string;
    position: [number, number];
    title: string;
    popupContent?: ReactNode;
}

interface MapComponentProps {
    center?: [number, number];
    zoom?: number;
    markers?: MapMarker[];
    userLocation?: [number, number] | null;
    className?: string;
}

function MapViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, map, zoom]);
    return null;
}

export function MapComponent({
    center = [-2.55, -44.06],
    zoom = 13,
    markers = [],
    userLocation = null,
    className = "h-[400px] w-full",
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
            className={`rounded-xl z-0 overflow-hidden touch-none ${className}`}
        >
            <MapViewSync center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
                <CircleMarker center={userLocation} radius={10} pathOptions={{ color: "#2563eb", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.35 }}>
                    <Popup>Você está aqui</Popup>
                </CircleMarker>
            )}
            {markers.map((marker) => (
                <Marker key={marker.id} position={marker.position}>
                    <Popup>
                        <div className="text-sm">
                            <h3 className="font-bold">{marker.title}</h3>
                            {marker.popupContent}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
