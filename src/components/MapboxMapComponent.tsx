import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import type { MapHighlightPoint, MapMarker, MapViewportBounds } from "./MapComponent";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM } from "../config/geo";

type MapboxMapComponentProps = {
    accessToken: string;
    center?: [number, number];
    zoom?: number;
    markers?: MapMarker[];
    userLocation?: [number, number] | null;
    highlightPoint?: MapHighlightPoint | null;
    className?: string;
    onBoundsChange?: (bounds: MapViewportBounds) => void;
    onMapClick?: (position: [number, number]) => void;
};

type PopupTarget =
    | { id: string | number; position: [number, number]; title: string; popupContent?: ReactNode }
    | { id: "__user__"; position: [number, number]; title: string; popupContent?: ReactNode }
    | { id: "__highlight__"; position: [number, number]; title: string; popupContent?: ReactNode };

function emitBounds(map: mapboxgl.Map, onBoundsChange?: (bounds: MapViewportBounds) => void) {
    if (!onBoundsChange) return;
    const bounds = map.getBounds();
    onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
    });
}

function createMarkerElement(kind: "business" | "user" | "highlight") {
    const element = document.createElement("button");
    element.type = "button";
    element.style.width = kind === "highlight" ? "28px" : "24px";
    element.style.height = kind === "highlight" ? "28px" : "24px";
    element.style.borderRadius = "9999px";
    element.style.border = kind === "user" ? "3px solid #1d4ed8" : "3px solid #c2410c";
    element.style.background = kind === "user" ? "#60a5fa" : "#f97316";
    element.style.boxShadow = "0 10px 20px rgba(15, 23, 42, 0.28)";
    element.style.cursor = "pointer";
    element.style.padding = "0";
    element.style.outline = "none";

    if (kind === "highlight") {
        element.style.background = "rgba(249, 115, 22, 0.38)";
        element.style.border = "3px solid #b45309";
    }

    return element;
}

export function MapboxMapComponent({
    accessToken,
    center = NOVA_TERRA_CENTER,
    zoom = NOVA_TERRA_DEFAULT_ZOOM,
    markers = [],
    userLocation = null,
    highlightPoint = null,
    className = "h-[400px] w-full",
    onBoundsChange,
    onMapClick,
}: MapboxMapComponentProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const businessMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const highlightMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState("");
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | number | "__user__" | "__highlight__" | null>(null);
    const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);

    const popupTarget = useMemo<PopupTarget | null>(() => {
        if (selectedMarkerId === "__user__" && userLocation) {
            return {
                id: "__user__",
                position: userLocation,
                title: "Você está aqui",
                popupContent: <div className="text-text-sm text-text-primary">Você está aqui</div>,
            };
        }

        if (selectedMarkerId === "__highlight__" && highlightPoint) {
            return {
                id: "__highlight__",
                position: highlightPoint.position,
                title: highlightPoint.label || "Ponto selecionado",
                popupContent: (
                    <div className="text-sm">
                        <h3 className="font-bold text-text-primary">{highlightPoint.label || "Ponto selecionado"}</h3>
                        {highlightPoint.popupContent}
                    </div>
                ),
            };
        }

        if (selectedMarkerId === null) return null;
        return markers.find((marker) => marker.id === selectedMarkerId) || null;
    }, [highlightPoint, markers, selectedMarkerId, userLocation]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        mapboxgl.accessToken = accessToken;

        try {
            const map = new mapboxgl.Map({
                container: containerRef.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: [center[1], center[0]],
                zoom,
                attributionControl: false,
            });

            mapRef.current = map;
            map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
            map.addControl(new mapboxgl.AttributionControl({ compact: true }));

            map.on("load", () => {
                setMapReady(true);
                emitBounds(map, onBoundsChange);
            });

            map.on("moveend", () => emitBounds(map, onBoundsChange));
            map.on("zoomend", () => emitBounds(map, onBoundsChange));
            map.on("click", (event) => {
                setSelectedMarkerId(null);
                onMapClick?.([event.lngLat.lat, event.lngLat.lng]);
            });
            map.on("error", (event) => {
                const message = event.error?.message || "";
                if (message) setMapError(message);
            });

            const handleResize = () => map.resize();
            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
                setPopupContainer(null);
                popupRef.current?.remove();
                popupRef.current = null;
                highlightMarkerRef.current?.remove();
                userMarkerRef.current?.remove();
                businessMarkersRef.current.forEach((marker) => marker.remove());
                businessMarkersRef.current = [];
                userMarkerRef.current = null;
                highlightMarkerRef.current = null;
                map.remove();
                mapRef.current = null;
                setMapReady(false);
            };
        } catch (error) {
            setMapError(error instanceof Error ? error.message : "Falha ao iniciar o Mapbox.");
            return undefined;
        }
    }, [accessToken, center, onBoundsChange, onMapClick, zoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        map.easeTo({ center: [center[1], center[0]], zoom, duration: 600 });
    }, [center, mapReady, zoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        businessMarkersRef.current.forEach((marker) => marker.remove());
        businessMarkersRef.current = markers.map((marker) => {
            const element = createMarkerElement("business");
            element.setAttribute("aria-label", marker.title);
            element.addEventListener("click", (event) => {
                event.stopPropagation();
                setSelectedMarkerId(marker.id);
                marker.onClick?.();
            });

            return new mapboxgl.Marker({ element, anchor: "center" })
                .setLngLat([marker.position[1], marker.position[0]])
                .addTo(map);
        });

        return () => {
            businessMarkersRef.current.forEach((marker) => marker.remove());
            businessMarkersRef.current = [];
        };
    }, [mapReady, markers]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        userMarkerRef.current?.remove();
        userMarkerRef.current = null;

        if (!userLocation) return;

        const element = createMarkerElement("user");
        element.setAttribute("aria-label", "Você está aqui");
        element.addEventListener("click", (event) => {
            event.stopPropagation();
            setSelectedMarkerId("__user__");
        });

        userMarkerRef.current = new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat([userLocation[1], userLocation[0]])
            .addTo(map);

        return () => {
            userMarkerRef.current?.remove();
            userMarkerRef.current = null;
        };
    }, [mapReady, userLocation]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        highlightMarkerRef.current?.remove();
        highlightMarkerRef.current = null;

        if (!highlightPoint) return;

        const element = createMarkerElement("highlight");
        element.setAttribute("aria-label", highlightPoint.label || "Ponto selecionado");
        element.addEventListener("click", (event) => {
            event.stopPropagation();
            setSelectedMarkerId("__highlight__");
        });

        highlightMarkerRef.current = new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat([highlightPoint.position[1], highlightPoint.position[0]])
            .addTo(map);

        return () => {
            highlightMarkerRef.current?.remove();
            highlightMarkerRef.current = null;
        };
    }, [highlightPoint, mapReady]);

    useEffect(() => {
        const map = mapRef.current;
        setPopupContainer(null);
        popupRef.current?.remove();
        popupRef.current = null;

        if (!map || !mapReady || !popupTarget?.popupContent) return;

        const nextPopupContainer = document.createElement("div");
        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: 18,
            maxWidth: "320px",
        })
            .setLngLat([popupTarget.position[1], popupTarget.position[0]])
            .setDOMContent(nextPopupContainer)
            .addTo(map);

        setPopupContainer(nextPopupContainer);

        popup.on("close", () => {
            setSelectedMarkerId((current) => (current === popupTarget.id ? null : current));
            setPopupContainer((current) => (current === nextPopupContainer ? null : current));
        });

        popupRef.current = popup;

        return () => {
            setPopupContainer((current) => (current === nextPopupContainer ? null : current));
            if (popupRef.current === popup) popupRef.current = null;
            popup.remove();
        };
    }, [mapReady, popupTarget]);

    if (mapError) {
        return (
            <div className={`${className} rounded-radius-2xl border border-border-subtle bg-surface-card p-space-6`}>
                <div className="flex h-full items-center justify-center text-center text-text-sm text-text-secondary">
                    Não foi possível carregar o mapa Mapbox. {mapError}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`${className} overflow-hidden rounded-radius-2xl border border-border-subtle bg-surface-card`}>
                <div ref={containerRef} className="h-full w-full touch-auto [touch-action:auto]" />
            </div>
            {popupContainer && popupTarget?.popupContent
                ? createPortal(<div className="max-w-[280px]">{popupTarget.popupContent}</div>, popupContainer)
                : null}
        </>
    );
}
