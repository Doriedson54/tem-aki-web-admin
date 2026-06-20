import type { Business } from "../types";

export type CoordinatePair = [number, number];

export function buildWhatsAppLink(rawPhone: string, message: string): string | null {
    const digitsOnly = String(rawPhone || "").replace(/\D/g, "");
    if (!digitsOnly) return null;

    const normalizedDigits = digitsOnly.replace(/^0+/, "");
    const withCountry = normalizedDigits.startsWith("55") ? normalizedDigits : `55${normalizedDigits}`;
    if (withCountry.length < 12) return null;

    return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function buildMapRouteLink(business: Pick<Business, "latitude" | "longitude" | "address">): string | null {
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

export function calculateDistanceMeters(origin: CoordinatePair, destination: CoordinatePair) {
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

export function formatDistance(distanceMeters?: number) {
    if (typeof distanceMeters !== "number" || !Number.isFinite(distanceMeters)) return null;
    if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
    return `${(distanceMeters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function normalizeText(value: string) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}
