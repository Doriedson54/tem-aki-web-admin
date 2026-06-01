import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
    className?: string;
}

export function MapComponent({ center = [-2.55, -44.06], zoom = 13, markers = [], className = "h-[400px] w-full" }: MapComponentProps) {
    return (
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className={`rounded-xl z-0 ${className}`}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
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
