import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CircleF, GoogleMap, InfoWindowF, MarkerF, useLoadScript, type Libraries } from "@react-google-maps/api";
import type { MapHighlightPoint, MapMarker, MapViewportBounds } from "./MapComponent";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM } from "../config/geo";

type GoogleMapComponentProps = {
  apiKey: string;
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  userLocation?: [number, number] | null;
  highlightPoint?: MapHighlightPoint | null;
  className?: string;
  onBoundsChange?: (bounds: MapViewportBounds) => void;
  onMapClick?: (position: [number, number]) => void;
};

const containerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
};

const libraries: Libraries = [];

function toBounds(bounds: google.maps.LatLngBounds): MapViewportBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    north: ne.lat(),
    east: ne.lng(),
    south: sw.lat(),
    west: sw.lng(),
  };
}

export function GoogleMapComponent({
  apiKey,
  center = NOVA_TERRA_CENTER,
  zoom = NOVA_TERRA_DEFAULT_ZOOM,
  markers = [],
  userLocation = null,
  highlightPoint = null,
  className = "h-[400px] w-full",
  onBoundsChange,
  onMapClick,
}: GoogleMapComponentProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | number | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo({ lat: center[0], lng: center[1] });
    if (typeof zoom === "number") map.setZoom(zoom);
  }, [center, zoom]);

  const selectedMarker = useMemo(() => {
    if (selectedMarkerId === null) return null;
    return markers.find((m) => m.id === selectedMarkerId) || null;
  }, [markers, selectedMarkerId]);

  const businessIcon = useMemo<google.maps.Icon | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return {
      url: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
      scaledSize: new google.maps.Size(34, 34),
    };
  }, []);

  const userIcon = useMemo<google.maps.Icon | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return {
      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      scaledSize: new google.maps.Size(34, 34),
    };
  }, []);

  if (loadError) {
    return (
      <div className={className}>
        <div className="flex h-full w-full items-center justify-center rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6 text-center text-text-sm text-text-secondary">
          Não foi possível carregar o Google Maps. Verifique a chave e a configuração do domínio.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={className}>
        <div className="flex h-full w-full items-center justify-center rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6 text-center text-text-sm text-text-secondary">
          Carregando mapa...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        }}
        onLoad={(map) => {
          mapRef.current = map;
          if (onBoundsChange) {
            const bounds = map.getBounds();
            if (bounds) onBoundsChange(toBounds(bounds));
          }
        }}
        onIdle={() => {
          if (!onBoundsChange) return;
          const map = mapRef.current;
          if (!map) return;
          const bounds = map.getBounds();
          if (!bounds) return;
          onBoundsChange(toBounds(bounds));
        }}
        onClick={(event) => {
          if (!onMapClick) return;
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();
          if (typeof lat !== "number" || typeof lng !== "number") return;
          onMapClick([lat, lng]);
        }}
      >
        {userLocation && (
          <MarkerF
            position={{ lat: userLocation[0], lng: userLocation[1] }}
            icon={userIcon}
            title="Você está aqui"
            onClick={() => setSelectedMarkerId("user")}
          />
        )}

        {highlightPoint && (
          <CircleF
            center={{ lat: highlightPoint.position[0], lng: highlightPoint.position[1] }}
            radius={45}
            options={{
              fillColor: "#B86A1A",
              fillOpacity: 0.28,
              strokeColor: "#B86A1A",
              strokeOpacity: 0.9,
              strokeWeight: 2,
            }}
          />
        )}

        {markers.map((marker) => (
          <MarkerF
            key={marker.id}
            position={{ lat: marker.position[0], lng: marker.position[1] }}
            title={marker.title}
            icon={businessIcon}
            onClick={() => {
              setSelectedMarkerId(marker.id);
              marker.onClick?.();
            }}
          />
        ))}

        {selectedMarkerId === "user" && userLocation && (
          <InfoWindowF
            position={{ lat: userLocation[0], lng: userLocation[1] }}
            onCloseClick={() => setSelectedMarkerId(null)}
            options={{ pixelOffset: new google.maps.Size(0, -6) }}
          >
            <div className="text-text-sm text-text-primary">Você está aqui</div>
          </InfoWindowF>
        )}

        {selectedMarker && selectedMarker.popupContent && (
          <InfoWindowF
            position={{ lat: selectedMarker.position[0], lng: selectedMarker.position[1] }}
            onCloseClick={() => setSelectedMarkerId(null)}
            options={{ pixelOffset: new google.maps.Size(0, -6) }}
          >
            <div className="max-w-[240px]">{selectedMarker.popupContent}</div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
