import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, Business } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ExternalLink, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

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
    distance_to_nova_terra_km?: number | null;
    message?: string | null;
};

type GeocodeBatchReport = {
    mode: "dry-run" | "apply";
    processed: number;
    total: number | null;
    found: GeocodeBatchEntry[];
    not_found: GeocodeBatchEntry[];
    dubious: GeocodeBatchEntry[];
    updated: Array<{ id: string; name: string; latitude: number; longitude: number }>;
};

type GeocodeBatchResponse = {
    mode: "dry-run" | "apply";
    processed: number;
    totalRemaining: number;
    found: GeocodeBatchEntry[];
    not_found: GeocodeBatchEntry[];
    dubious: GeocodeBatchEntry[];
    updated: Array<{ id: string; name: string; latitude: number; longitude: number }>;
    nextOffset: number | null;
    hasMore: boolean;
};

type GeocodeProgressState = {
    processed: number;
    total: number | null;
    mode: "dry-run" | "apply";
};

const GEOCODE_BATCH_SIZE = 3;

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

export function BusinessList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Business[]>([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [geocodeRunning, setGeocodeRunning] = useState(false);
    const [geocodeReport, setGeocodeReport] = useState<GeocodeBatchReport | null>(null);
    const [geocodeProgress, setGeocodeProgress] = useState<GeocodeProgressState | null>(null);
    const cancelGeocodeRef = useRef(false);
    const geocodeSuccessRate = useMemo(() => {
        if (!geocodeReport?.processed) return 0;
        const successful = geocodeReport.found.length + geocodeReport.dubious.length;
        return (successful / geocodeReport.processed) * 100;
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
        setGeocodeProgress({ processed: 0, total: null, mode });

        let aggregate: GeocodeBatchReport = {
            mode,
            processed: 0,
            total: null,
            found: [],
            not_found: [],
            dubious: [],
            updated: [],
        };
        setGeocodeReport(aggregate);

        let offset = 0;
        let completed = false;

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
                });

                if (!resp.data.success || !resp.data.data) {
                    setError(resp.data.message || "Falha ao atualizar coordenadas.");
                    break;
                }

                const batch = resp.data.data;
                const total = aggregate.processed + batch.processed + batch.totalRemaining;

                aggregate = {
                    mode,
                    processed: aggregate.processed + batch.processed,
                    total,
                    found: mergeUniqueById(aggregate.found, batch.found),
                    dubious: mergeUniqueById(aggregate.dubious, batch.dubious),
                    not_found: mergeUniqueById(aggregate.not_found, batch.not_found),
                    updated: mergeUniqueById(aggregate.updated, batch.updated),
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
                        <div className="grid grid-cols-2 gap-space-3 md:grid-cols-6">
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
                                <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Sucesso</div>
                                <div className="mt-space-1 text-text-base font-bold text-action-primary">
                                    {geocodeSuccessRate.toFixed(1).replace(".", ",")}%
                                </div>
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

                        {geocodeReport.found.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Encontrados com boa confiança</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.found.slice(0, 10).map((item) => (
                                        <div key={item.id} className="rounded-radius-lg border border-border-subtle bg-surface-card p-space-3 text-text-sm">
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
                                            {item.display_name && <div className="text-text-muted text-text-xs mt-space-2">{item.display_name}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {geocodeReport.dubious.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Resultados duvidosos</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.dubious.slice(0, 10).map((item) => (
                                        <div key={item.id} className="rounded-radius-lg border border-status-warning/30 bg-status-warning/10 p-space-3 text-text-sm">
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
                                            {item.display_name && <div className="text-text-muted text-text-xs mt-space-2">{item.display_name}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {geocodeReport.not_found.length > 0 && (
                            <div>
                                <div className="text-text-sm font-semibold text-text-primary">Não encontrados</div>
                                <div className="mt-space-2 space-y-space-2">
                                    {geocodeReport.not_found.slice(0, 10).map((item) => (
                                        <div key={item.id} className="rounded-radius-lg border border-status-error/20 bg-status-error/10 p-space-3 text-text-sm">
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
                                            {typeof item.confidence_score === "number" && (
                                                <>
                                                    <div className="mt-space-2 text-text-xs font-semibold uppercase tracking-wide text-text-muted">Confiança</div>
                                                    <div className="text-text-secondary">{item.confidence_score.toFixed(2)}</div>
                                                </>
                                            )}
                                            {item.display_name && <div className="text-text-muted text-text-xs mt-space-2">{item.display_name}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

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
