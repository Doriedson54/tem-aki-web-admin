import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, Business } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ExternalLink, Pencil, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { MapComponent } from "../../components/MapComponent";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM } from "../../config/geo";

type GeocodeBatchEntry = {
    id: string;
    name: string;
    address: string;
    searched_address?: string | null;
    strategy_key?: string | null;
    strategy_label?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    display_name?: string | null;
    returned_name?: string | null;
    confidence?: "found" | "dubious" | "not_found" | null;
    confidence_score?: number | null;
    location_type?: "Exata" | "Aproximada" | null;
    source?: "Nominatim" | "Rua" | "CEP" | "Centro do bairro" | null;
    coordinate_origin?: string | null;
    distance_to_nova_terra_km?: number | null;
    message?: string | null;
};

type GeocodeBatchStats = {
    successful: number;
    direct_found: number;
    recovered_by_street_lookup: number;
    recovered_by_street_reuse: number;
    recovered_by_zip: number;
    recovered_by_neighborhood_center: number;
    recovered_by_fallback: number;
};

type GeocodeMemoryStreetEntry = {
    key: string;
    street_name: string;
    neighborhood: string;
    city: string;
    lat: number;
    lng: number;
    score: number;
    display_name: string;
};

type GeocodeMemoryZipEntry = {
    key: string;
    zip_code: string;
    neighborhood: string;
    city: string;
    lat: number;
    lng: number;
    score: number;
    display_name: string;
};

type GeocodeProcessingState = {
    streets: GeocodeMemoryStreetEntry[];
    zips: GeocodeMemoryZipEntry[];
};

type GeocodeBatchReport = {
    mode: "dry-run" | "apply";
    processed: number;
    total: number | null;
    found: GeocodeBatchEntry[];
    not_found: GeocodeBatchEntry[];
    dubious: GeocodeBatchEntry[];
    updated: Array<{ id: string; name: string; latitude: number; longitude: number }>;
    stats: GeocodeBatchStats;
};

type GeocodeBatchResponse = {
    mode: "dry-run" | "apply";
    processed: number;
    totalRemaining: number;
    found: GeocodeBatchEntry[];
    not_found: GeocodeBatchEntry[];
    dubious: GeocodeBatchEntry[];
    updated: Array<{ id: string; name: string; latitude: number; longitude: number }>;
    stats: GeocodeBatchStats;
    processing_state?: GeocodeProcessingState;
    nextOffset: number | null;
    hasMore: boolean;
};

type GeocodeProgressState = {
    processed: number;
    total: number | null;
    mode: "dry-run" | "apply";
};

const GEOCODE_BATCH_SIZE = 3;
const EMPTY_GEOCODE_STATS: GeocodeBatchStats = {
    successful: 0,
    direct_found: 0,
    recovered_by_street_lookup: 0,
    recovered_by_street_reuse: 0,
    recovered_by_zip: 0,
    recovered_by_neighborhood_center: 0,
    recovered_by_fallback: 0,
};
const EMPTY_GEOCODE_PROCESSING_STATE: GeocodeProcessingState = {
    streets: [],
    zips: [],
};

function mergeUniqueById<T extends { id: string }>(current: T[], next: T[]) {
    const map = new Map<string, T>();
    [...current, ...next].forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
}

function formatGeocodeError(error: unknown) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const apiMessage =
            typeof error.response?.data?.message === "string"
                ? error.response.data.message
                : typeof error.message === "string"
                  ? error.message
                  : "Falha ao atualizar coordenadas.";

        let message = status ? `Erro HTTP ${status}: ${apiMessage}` : apiMessage;
        if (status === 504) {
            message += " Timeout do lote. O sistema usa lotes menores; tente novamente em instantes.";
        } else if (status === 429) {
            message += " O serviço de geocodificação limitou as requisições; aguarde um pouco e tente novamente.";
        }
        return message;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "Falha ao atualizar coordenadas.";
}

function formatDistanceFromNovaTerra(distanceKm?: number | null) {
    if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) return "Nao disponivel";
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(2).replace(".", ",")} km`;
}

function mergeGeocodeStats(current: GeocodeBatchStats, next?: GeocodeBatchStats | null): GeocodeBatchStats {
    if (!next) return current;
    return {
        successful: current.successful + (next.successful || 0),
        direct_found: current.direct_found + (next.direct_found || 0),
        recovered_by_street_lookup: current.recovered_by_street_lookup + (next.recovered_by_street_lookup || 0),
        recovered_by_street_reuse: current.recovered_by_street_reuse + (next.recovered_by_street_reuse || 0),
        recovered_by_zip: current.recovered_by_zip + (next.recovered_by_zip || 0),
        recovered_by_neighborhood_center: current.recovered_by_neighborhood_center + (next.recovered_by_neighborhood_center || 0),
        recovered_by_fallback: current.recovered_by_fallback + (next.recovered_by_fallback || 0),
    };
}

export function BusinessList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Business[]>([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [geocodeRunning, setGeocodeRunning] = useState(false);
    const [geocodeReport, setGeocodeReport] = useState<GeocodeBatchReport | null>(null);
    const [geocodeProgress, setGeocodeProgress] = useState<GeocodeProgressState | null>(null);
    const [selectedGeocodeItem, setSelectedGeocodeItem] = useState<GeocodeBatchEntry | null>(null);
    const [approvedDubiousItems, setApprovedDubiousItems] = useState<GeocodeBatchEntry[]>([]);
    const cancelGeocodeRef = useRef(false);
    const geocodeSuccessRate = useMemo(() => {
        if (!geocodeReport?.processed) return 0;
        const successful = geocodeReport.found.length + geocodeReport.dubious.length;
        return (successful / geocodeReport.processed) * 100;
    }, [geocodeReport]);
    const approvedDubiousIds = useMemo(() => new Set(approvedDubiousItems.map((item) => item.id)), [approvedDubiousItems]);
    const geocodeStreetRecoveryCount = useMemo(
        () => (geocodeReport?.stats.recovered_by_street_lookup || 0) + (geocodeReport?.stats.recovered_by_street_reuse || 0),
        [geocodeReport]
    );
    const geocodeDirectSuccessRate = useMemo(() => {
        if (!geocodeReport?.processed) return 0;
        return ((geocodeReport.stats.direct_found || 0) / geocodeReport.processed) * 100;
    }, [geocodeReport]);
    const geocodeStreetRecoveryRate = useMemo(() => {
        if (!geocodeReport?.processed) return 0;
        return (geocodeStreetRecoveryCount / geocodeReport.processed) * 100;
    }, [geocodeReport, geocodeStreetRecoveryCount]);
    const geocodeZipRecoveryRate = useMemo(() => {
        if (!geocodeReport?.processed) return 0;
        return ((geocodeReport.stats.recovered_by_zip || 0) / geocodeReport.processed) * 100;
    }, [geocodeReport]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((b) => {
            const text = `${b.name} ${b.category?.name || ""} ${b.status}`.toLowerCase();
            return text.includes(q);
        });
    }, [items, query]);

    const load = async () => {
        setError("");
        setLoading(true);
        try {
            const resp = await api.get<ApiResponse<Business[]>>("/businesses?limit=200");
            if (resp.data.success) setItems(resp.data.data || []);
            else setError(resp.data.message || "Falha ao carregar.");
        } catch {
            setError("Falha ao carregar.");
        } finally {
            setLoading(false);
        }
    };

    const runGeocodeBatch = async (mode: "dry-run" | "apply") => {
        if (mode === "apply") {
            const ok = window.confirm("Aplicar coordenadas encontradas aos negócios sem latitude/longitude?");
            if (!ok) return;
        }

        cancelGeocodeRef.current = false;
        setGeocodeRunning(true);
        setError("");
        setApprovedDubiousItems([]);
        setGeocodeProgress({ processed: 0, total: null, mode });

        let aggregate: GeocodeBatchReport = {
            mode,
            processed: 0,
            total: null,
            found: [],
            not_found: [],
            dubious: [],
            updated: [],
            stats: { ...EMPTY_GEOCODE_STATS },
        };
        setGeocodeReport(aggregate);

        let offset = 0;
        let completed = false;
        let processingState: GeocodeProcessingState = { ...EMPTY_GEOCODE_PROCESSING_STATE, streets: [], zips: [] };

        try {
            while (true) {
                if (cancelGeocodeRef.current) {
                    setError("Processamento cancelado pelo usuário.");
                    break;
                }

                const resp = await api.post<ApiResponse<GeocodeBatchResponse>>("/businesses/geocode/batch", {
                    mode,
                    limit: GEOCODE_BATCH_SIZE,
                    offset,
                    processing_state: processingState,
                });

                if (!resp.data.success || !resp.data.data) {
                    setError(resp.data.message || "Falha ao atualizar coordenadas.");
                    break;
                }

                const batch = resp.data.data;
                processingState = batch.processing_state || processingState;
                const total = aggregate.processed + batch.processed + batch.totalRemaining;

                aggregate = {
                    mode,
                    processed: aggregate.processed + batch.processed,
                    total,
                    found: mergeUniqueById(aggregate.found, batch.found),
                    dubious: mergeUniqueById(aggregate.dubious, batch.dubious),
                    not_found: mergeUniqueById(aggregate.not_found, batch.not_found),
                    updated: mergeUniqueById(aggregate.updated, batch.updated),
                    stats: mergeGeocodeStats(aggregate.stats, batch.stats),
                };

                setGeocodeReport(aggregate);
                setGeocodeProgress({ processed: aggregate.processed, total, mode });

                if (!batch.hasMore || batch.nextOffset === null) {
                    completed = true;
                    break;
                }

                if (batch.processed === 0 && batch.nextOffset === offset) {
                    throw new Error("O processamento de geocodificação não avançou para o próximo lote.");
                }

                offset = batch.nextOffset;
            }

            if (completed && mode === "apply") {
                await load();
            }
        } catch (err) {
            setError(formatGeocodeError(err));
        } finally {
            setGeocodeRunning(false);
            setGeocodeProgress((current) => {
                if (!current) return null;
                return current;
            });
        }
    };

    const approveDubiousCoordinate = (item: GeocodeBatchEntry) => {
        setApprovedDubiousItems((current) => mergeUniqueById(current, [item]));
    };

    useEffect(() => {
        load();
    }, []);

    const remove = async (id: string) => {
        const ok = window.confirm("Excluir este negócio?");
        if (!ok) return;
        setError("");
        try {
            await api.delete(`/businesses/${id}`);
            await load();
        } catch {
            setError("Falha ao excluir.");
        }
    };

    const toggleStatus = async (item: Business) => {
        const nextStatus = item.status === "active" ? "inactive" : "active";
        const ok = window.confirm(nextStatus === "inactive" ? "Inativar este negócio?" : "Ativar este negócio?");
        if (!ok) return;

        setError("");
        try {
            const resp = await api.put(`/businesses/${item.id}`, { status: nextStatus });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao alterar status.");
                return;
            }
            setItems((prev) => prev.map((b) => (b.id === item.id ? { ...b, status: nextStatus } : b)));
        } catch {
            setError("Falha ao alterar status.");
        }
    };

    const selectedGeocodePosition = useMemo<[number, number] | null>(() => {
        if (
            !selectedGeocodeItem ||
            typeof selectedGeocodeItem.latitude !== "number" ||
            typeof selectedGeocodeItem.longitude !== "number"
        ) {
            return null;
        }

        return [selectedGeocodeItem.latitude, selectedGeocodeItem.longitude];
    }, [selectedGeocodeItem]);

    const renderGeocodeEntry = (item: GeocodeBatchEntry, tone: "neutral" | "warning" | "error") => {
        const containerClass =
            tone === "warning"
                ? "rounded-radius-lg border border-status-warning/30 bg-status-warning/10 p-space-3 text-text-sm"
                : tone === "error"
                  ? "rounded-radius-lg border border-status-error/20 bg-status-error/10 p-space-3 text-text-sm"
                  : "rounded-radius-lg border border-border-subtle bg-surface-card p-space-3 text-text-sm";

        return (
            <div key={item.id} className={containerClass}>
                <div className="flex flex-col gap-space-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-text-primary">{item.name}</div>
                        <div className="mt-space-1 text-text-xs font-semibold uppercase tracking-wide text-text-muted">Endereço pesquisado</div>
                        <div className="text-text-secondary">{item.searched_address || item.address}</div>
                        {item.strategy_label && (
                            <>
                                <div className="mt-space-2 text-text-xs font-semibold uppercase tracking-wide text-text-muted">Estratégia</div>
                                <div className="text-text-secondary">{item.strategy_label}</div>
                            </>
                        )}
                        {item.returned_name && (
                            <>
                                <div className="mt-space-2 text-text-xs font-semibold uppercase tracking-wide text-text-muted">Encontrado</div>
                                <div className="text-text-secondary">{item.returned_name}</div>
                            </>
                        )}
                        {(typeof item.latitude === "number" || typeof item.longitude === "number") && (
                            <>
                                <div className="mt-space-2 text-text-xs font-semibold uppercase tracking-wide text-text-muted">Coordenadas</div>
                                <div className="text-text-secondary text-text-xs">
                                    Lat: {item.latitude} | Lng: {item.longitude}
                                </div>
                            </>
                        )}
                        {typeof item.confidence_score === "number" && (
                            <>
                                <div className="mt-space-2 text-text-xs font-semibold uppercase tracking-wide text-text-muted">Confiança</div>
                                <div className="text-text-secondary">{item.confidence_score.toFixed(2)}</div>
                            </>
                        )}
                        {item.message && <div className="mt-space-2 text-text-xs text-text-secondary">{item.message}</div>}
                        <div className="mt-space-2 grid gap-space-2 text-text-xs text-text-secondary md:grid-cols-4">
                            <div>
                                <div className="font-semibold uppercase tracking-wide text-text-muted">Tipo</div>
                                <div>{item.location_type || "-"}</div>
                            </div>
                            <div>
                                <div className="font-semibold uppercase tracking-wide text-text-muted">Fonte</div>
                                <div>{item.source || "-"}</div>
                            </div>
                            <div>
                                <div className="font-semibold uppercase tracking-wide text-text-muted">Origem</div>
                                <div>{item.coordinate_origin || item.strategy_label || "-"}</div>
                            </div>
                            <div>
                                <div className="font-semibold uppercase tracking-wide text-text-muted">Distância Nova Terra</div>
                                <div>{formatDistanceFromNovaTerra(item.distance_to_nova_terra_km)}</div>
                            </div>
                        </div>
                        {item.display_name && <div className="text-text-muted text-text-xs mt-space-2">{item.display_name}</div>}
                        {approvedDubiousIds.has(item.id) && (
                            <div className="mt-space-2 inline-flex rounded-radius-full bg-status-success/10 px-space-3 py-space-1 text-text-xs font-semibold text-status-success">
                                Coordenada aprovada manualmente
                            </div>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-space-2">
                        {(typeof item.latitude === "number" && typeof item.longitude === "number") && (
                            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedGeocodeItem(item)}>
                                Ver no mapa
                            </Button>
                        )}
                        {item.confidence === "dubious" && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => approveDubiousCoordinate(item)}
                                disabled={approvedDubiousIds.has(item.id)}
                            >
                                {approvedDubiousIds.has(item.id) ? "Aprovada" : "Aprovar coordenada"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-space-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-space-4">
                <div>
                    <h1 className="text-text-3xl font-bold text-text-primary">Gerenciar Negócios</h1>
                    <div className="text-text-sm text-text-secondary mt-space-1">Cadastre, edite e mantenha o catálogo atualizado</div>
                </div>
                <div className="flex w-full md:w-auto gap-space-3">
                    <div className="flex-1 md:w-72">
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, categoria ou status..." />
                    </div>
                    <Link to="/admin/businesses/new">
                        <Button>Novo</Button>
                    </Link>
                </div>
            </div>

            <Card className="border-border-subtle p-space-4">
                <div className="flex flex-col gap-space-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-text-lg font-bold text-text-primary">Atualizar coordenadas dos negócios</h2>
                        <div className="mt-space-1 text-text-sm text-text-secondary">
                            Rode primeiro em modo simular. Apenas negócios sem coordenadas entram no processo.
                        </div>
                        <div className="mt-space-1 text-text-xs text-text-muted">
                            Lote atual: {GEOCODE_BATCH_SIZE} negócio(s) por chamada.
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-space-3">
                        <Button type="button" variant="secondary" onClick={() => runGeocodeBatch("dry-run")} disabled={geocodeRunning}>
                            {geocodeRunning ? "Processando..." : "Simular geocodificação"}
                        </Button>
                        <Button type="button" onClick={() => runGeocodeBatch("apply")} disabled={geocodeRunning}>
                            Aplicar coordenadas
                        </Button>
                        {geocodeRunning && (
                            <Button type="button" variant="secondary" onClick={() => { cancelGeocodeRef.current = true; }}>
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                {geocodeProgress && (
                    <div className="mt-space-4 rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                        <div className="text-text-sm font-semibold text-text-primary">
                            Processando {geocodeProgress.processed}
                            {typeof geocodeProgress.total === "number" ? ` de ${geocodeProgress.total}` : ""}...
                        </div>
                        <div className="mt-space-1 text-text-xs text-text-secondary">
                            Modo: {geocodeProgress.mode === "apply" ? "aplicar" : "simular"}
                        </div>
                    </div>
                )}

                {geocodeReport && (
                    <div className="mt-space-5 space-y-space-5">
                        <div className="grid grid-cols-2 gap-space-3 md:grid-cols-4 xl:grid-cols-8">
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Modo</div>
                                <div className="mt-space-1 text-text-base font-bold text-text-primary">{geocodeReport.mode}</div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Analisados</div>
                                <div className="mt-space-1 text-text-base font-bold text-text-primary">{geocodeReport.processed}</div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Total estimado</div>
                                <div className="mt-space-1 text-text-base font-bold text-text-primary">{geocodeReport.total ?? geocodeReport.processed}</div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Encontrados</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-success">{geocodeReport.found.length}</div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Duvidosos</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-warning">{geocodeReport.dubious.length}</div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Não encontrados</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-error">{geocodeReport.not_found.length}</div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Sucesso real</div>
                                <div className="mt-space-1 text-text-base font-bold text-action-primary">
                                    {geocodeSuccessRate.toFixed(1).replace(".", ",")}%
                                </div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Sucesso direto</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-success">
                                    {geocodeDirectSuccessRate.toFixed(1).replace(".", ",")}%
                                </div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Recuperados rua</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-warning">{geocodeStreetRecoveryCount}</div>
                                <div className="mt-space-1 text-text-xs text-text-secondary">
                                    {geocodeStreetRecoveryRate.toFixed(1).replace(".", ",")}%
                                </div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Recuperados CEP</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-warning">{geocodeReport.stats.recovered_by_zip}</div>
                                <div className="mt-space-1 text-text-xs text-text-secondary">
                                    {geocodeZipRecoveryRate.toFixed(1).replace(".", ",")}%
                                </div>
                            </div>
                            <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Recuperados fallback</div>
                                <div className="mt-space-1 text-text-base font-bold text-status-warning">{geocodeReport.stats.recovered_by_fallback}</div>
                            </div>
                        </div>

                        {geocodeReport.updated.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Atualizados</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.updated.slice(0, 10).map((item) => (
                                        <div key={item.id} className="rounded-radius-lg border border-border-subtle bg-surface-card p-space-3 text-text-sm">
                                            <div className="font-semibold text-text-primary">{item.name}</div>
                                            <div className="text-text-secondary">
                                                {item.latitude}, {item.longitude}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {approvedDubiousItems.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Coordenadas aprovadas manualmente</div>
                                <div className="mt-space-1 text-text-xs text-text-secondary">
                                    Itens aprovados para aplicação manual posterior, sem gravação automática no banco.
                                </div>
                                <div className="mt-space-2 space-y-space-2">
                                    {approvedDubiousItems.map((item) => renderGeocodeEntry(item, "warning"))}
                                </div>
                            </div>
                        )}

                        {geocodeReport.found.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Encontrados com boa confiança</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.found.slice(0, 10).map((item) => renderGeocodeEntry(item, "neutral"))}
                                </div>
                            </div>
                        )}

                        {geocodeReport.dubious.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Resultados duvidosos</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.dubious.slice(0, 10).map((item) => renderGeocodeEntry(item, "warning"))}
                                </div>
                            </div>
                        )}

                        {geocodeReport.not_found.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Não encontrados</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.not_found.slice(0, 10).map((item) => renderGeocodeEntry(item, "error"))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {selectedGeocodeItem && selectedGeocodePosition && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-space-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Mapa da geocodificação de ${selectedGeocodeItem.name}`}
                    onClick={() => setSelectedGeocodeItem(null)}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-radius-xl bg-surface-card shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-space-3 border-b border-border-subtle p-space-4">
                            <div>
                                <div className="text-text-lg font-bold text-text-primary">{selectedGeocodeItem.name}</div>
                                <div className="mt-space-1 text-text-sm text-text-secondary">
                                    {selectedGeocodeItem.location_type || "Localização"} via {selectedGeocodeItem.source || "fonte não informada"}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-radius-md border border-border-default bg-surface-subtle text-text-secondary transition-colors hover:text-text-primary"
                                onClick={() => setSelectedGeocodeItem(null)}
                                aria-label="Fechar mapa"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-space-4 overflow-auto p-space-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
                            <MapComponent
                                center={selectedGeocodePosition}
                                zoom={selectedGeocodeItem.location_type === "Aproximada" ? NOVA_TERRA_DEFAULT_ZOOM : 16}
                                className="h-[420px] w-full"
                                highlightPoint={{
                                    position: selectedGeocodePosition,
                                    label: selectedGeocodeItem.name,
                                    popupContent: (
                                        <div className="space-y-1 text-text-xs">
                                            <div>{selectedGeocodeItem.display_name || selectedGeocodeItem.returned_name || "Coordenada encontrada"}</div>
                                            <div>
                                                Lat: {selectedGeocodeItem.latitude} | Lng: {selectedGeocodeItem.longitude}
                                            </div>
                                        </div>
                                    ),
                                }}
                            />
                            <div className="space-y-space-3">
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Latitude</div>
                                    <div className="mt-space-1 text-text-sm text-text-primary">{selectedGeocodeItem.latitude}</div>
                                </div>
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Longitude</div>
                                    <div className="mt-space-1 text-text-sm text-text-primary">{selectedGeocodeItem.longitude}</div>
                                </div>
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Score de confiança</div>
                                    <div className="mt-space-1 text-text-sm text-text-primary">
                                        {typeof selectedGeocodeItem.confidence_score === "number"
                                            ? selectedGeocodeItem.confidence_score.toFixed(2)
                                            : "-"}
                                    </div>
                                </div>
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Endereço pesquisado</div>
                                    <div className="mt-space-1 text-text-sm text-text-secondary">
                                        {selectedGeocodeItem.searched_address || selectedGeocodeItem.address || "-"}
                                    </div>
                                </div>
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Endereço retornado</div>
                                    <div className="mt-space-1 text-text-sm text-text-secondary">
                                        {selectedGeocodeItem.display_name || selectedGeocodeItem.returned_name || "-"}
                                    </div>
                                </div>
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="grid gap-space-2 text-text-sm text-text-secondary sm:grid-cols-3">
                                        <div>
                                            <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Tipo</div>
                                            <div className="mt-space-1">{selectedGeocodeItem.location_type || "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Fonte</div>
                                            <div className="mt-space-1">{selectedGeocodeItem.source || "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Origem</div>
                                            <div className="mt-space-1">{selectedGeocodeItem.coordinate_origin || selectedGeocodeItem.strategy_label || "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Distância Nova Terra</div>
                                            <div className="mt-space-1">{formatDistanceFromNovaTerra(selectedGeocodeItem.distance_to_nova_terra_km)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle p-space-3">
                                    <div className="text-text-xs font-semibold uppercase tracking-wide text-text-muted">Estratégia utilizada</div>
                                    <div className="mt-space-1 text-text-sm text-text-secondary">{selectedGeocodeItem.strategy_label || "-"}</div>
                                </div>
                                {selectedGeocodeItem.message && (
                                    <div className="rounded-radius-lg border border-status-warning/20 bg-status-warning/10 p-space-3 text-text-sm text-text-secondary">
                                        {selectedGeocodeItem.message}
                                    </div>
                                )}
                                {selectedGeocodeItem.confidence === "dubious" && (
                                    <Button
                                        type="button"
                                        onClick={() => approveDubiousCoordinate(selectedGeocodeItem)}
                                        disabled={approvedDubiousIds.has(selectedGeocodeItem.id)}
                                    >
                                        {approvedDubiousIds.has(selectedGeocodeItem.id) ? "Coordenada aprovada" : "Aprovar coordenada"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <Card className="border-border-subtle p-space-4">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle p-space-4">
                    <div className="text-text-sm text-text-secondary">{filtered.length} de {items.length} negócios</div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted">
                                    <th className="py-2 pr-4">Nome</th>
                                    <th className="py-2 pr-4">Categoria</th>
                                    <th className="py-2 pr-4">Coordenadas</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr key={b.id} className="border-t border-border-subtle hover:bg-surface-subtle/60">
                                        <td className="py-3 pr-4 font-semibold text-text-primary">{b.name}</td>
                                        <td className="py-3 pr-4 text-text-secondary">{b.category?.name || "-"}</td>
                                        <td className="py-3 pr-4 text-text-secondary">
                                            {typeof b.latitude === "number" && typeof b.longitude === "number" ? "OK" : "Pendente"}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="inline-flex items-center rounded-radius-full border border-border-default px-2 py-1 text-text-xs font-semibold text-text-secondary bg-surface-subtle">
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/business/${b.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-radius-md border border-border-default bg-surface-card text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
                                                    aria-label="Abrir negócio público"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    to={`/admin/businesses/edit/${b.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-radius-md border border-border-default bg-surface-card text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
                                                    aria-label="Editar negócio"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-radius-md border border-border-default bg-surface-card text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
                                                    onClick={() => toggleStatus(b)}
                                                    aria-label={b.status === "active" ? "Inativar negócio" : "Ativar negócio"}
                                                >
                                                    {b.status === "active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-radius-md border border-border-default bg-surface-card text-status-error hover:bg-status-error/10 transition-colors"
                                                    onClick={() => remove(b.id)}
                                                    aria-label="Excluir negócio"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td className="py-4 text-text-secondary" colSpan={5}>Sem negócios.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
