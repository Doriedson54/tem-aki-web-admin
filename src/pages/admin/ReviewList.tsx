import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import type { ApiResponse, Review, ReviewStatus } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type ReviewFilter = "all" | ReviewStatus;

const FILTER_OPTIONS: Array<{ value: ReviewFilter; label: string }> = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "approved", label: "Aprovados" },
    { value: "rejected", label: "Rejeitados" },
];

function getStatusLabel(status?: ReviewStatus) {
    if (status === "approved") return "Aprovada";
    if (status === "rejected") return "Rejeitada";
    return "Pendente";
}

function getStatusClassName(status?: ReviewStatus) {
    if (status === "approved") {
        return "border-status-success/30 bg-status-success/10 text-status-success";
    }
    if (status === "rejected") {
        return "border-status-error/30 bg-status-error/10 text-status-error";
    }
    return "border-status-warning/30 bg-status-warning/10 text-status-warning";
}

export function ReviewList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Review[]>([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ReviewFilter>("all");
    const [busyId, setBusyId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((r) => {
            const businessName = r.business?.name || "";
            const userLabel = r.author_name || r.user?.username || r.user?.name || "";
            const text = `${businessName} ${userLabel} ${r.content || ""} ${r.status || ""}`.toLowerCase();
            return text.includes(q);
        });
    }, [items, query]);

    const visibleItems = useMemo(() => {
        if (statusFilter === "all") return filtered;
        return filtered.filter((item) => item.status === statusFilter);
    }, [filtered, statusFilter]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                setError("");
                const resp = await api.get<ApiResponse<Review[]>>("/reviews?limit=200");
                if (!cancelled && resp.data.success) setItems(resp.data.data || []);
                if (!cancelled && !resp.data.success) setError(resp.data.message || "Falha ao carregar.");
            } catch {
                if (!cancelled) setError("Falha ao carregar.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const updateStatus = async (id: string | number, status: ReviewStatus) => {
        const reviewId = String(id);
        setBusyId(reviewId);
        setError("");
        try {
            const resp = await api.patch<ApiResponse<Review>>(`/reviews/${id}`, { status });
            if (!resp.data.success || !resp.data.data) {
                setError(resp.data.message || "Falha ao atualizar o status.");
                return;
            }
            setItems((prev) => prev.map((item) => String(item.id) === reviewId ? resp.data.data : item));
        } catch {
            setError("Falha ao atualizar o status.");
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (id: string | number) => {
        const ok = window.confirm("Excluir esta avaliação?");
        if (!ok) return;

        const reviewId = String(id);
        setBusyId(reviewId);
        setError("");
        try {
            await api.delete(`/reviews/${id}`);
            setItems((prev) => prev.filter((r) => String(r.id) !== String(id)));
        } catch {
            setError("Falha ao excluir.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-space-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-space-4">
                <div>
                    <h1 className="text-text-3xl font-bold text-text-primary">Moderador de Avaliações</h1>
                    <div className="text-text-sm text-text-secondary mt-space-1">Aprove, rejeite ou exclua avaliações antes da publicação</div>
                </div>
                <div className="w-full md:w-80">
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por negócio, autor ou texto..." />
                </div>
            </div>

            <div className="flex flex-wrap gap-space-2">
                {FILTER_OPTIONS.map((option) => (
                    <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={statusFilter === option.value ? "primary" : "secondary"}
                        onClick={() => setStatusFilter(option.value)}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>

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
                    <div className="flex items-center justify-between gap-space-4">
                        <div className="text-text-sm text-text-secondary">
                            {visibleItems.length} de {items.length} avaliações
                        </div>
                    </div>
                    <div className="mt-space-4 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted">
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Data</th>
                                    <th className="py-2 pr-4">Negócio</th>
                                    <th className="py-2 pr-4">Autor</th>
                                    <th className="py-2 pr-4">Nota</th>
                                    <th className="py-2 pr-4">Comentário</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((r) => {
                                    const isBusy = busyId === String(r.id);
                                    return (
                                    <tr key={r.id} className="border-t border-border-subtle align-top">
                                        <td className="py-3 pr-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-radius-full border px-2 py-1 text-text-xs font-semibold ${getStatusClassName(r.status)}`}>
                                                {getStatusLabel(r.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="py-3 pr-4 font-semibold text-text-primary whitespace-nowrap">
                                            {r.business?.name || r.business_id}
                                        </td>
                                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                                            {r.author_name || r.user?.username || r.user?.name || "Anônimo"}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="inline-flex items-center rounded-radius-full border border-border-default px-2 py-1 text-text-xs font-semibold text-text-secondary bg-surface-subtle">
                                                {r.rating}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-text-secondary">
                                            <div className="line-clamp-3 whitespace-pre-wrap">{r.content}</div>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div className="flex flex-wrap gap-space-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={isBusy || r.status === "approved"}
                                                    onClick={() => updateStatus(r.id, "approved")}
                                                >
                                                    Aprovar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={isBusy || r.status === "rejected"}
                                                    onClick={() => updateStatus(r.id, "rejected")}
                                                >
                                                    Rejeitar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-status-error"
                                                    disabled={isBusy}
                                                    onClick={() => remove(r.id)}
                                                >
                                                    Excluir
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                                {visibleItems.length === 0 && (
                                    <tr>
                                        <td className="py-4 text-text-secondary" colSpan={7}>
                                            Sem avaliações.
                                        </td>
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
