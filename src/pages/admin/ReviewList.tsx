import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import type { ApiResponse, Review } from "../../types";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

type ReviewAdminItem = Review & {
    business?: { id: string; name: string };
    user?: { id: string; username?: string; name?: string };
};

export function ReviewList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ReviewAdminItem[]>([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((r) => {
            const businessName = r.business?.name || "";
            const userLabel = r.user?.username || r.user?.name || "";
            const text = `${businessName} ${userLabel} ${r.content || ""}`.toLowerCase();
            return text.includes(q);
        });
    }, [items, query]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                setError("");
                const resp = await api.get<ApiResponse<ReviewAdminItem[]>>("/reviews?limit=200");
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

    const remove = async (id: string | number) => {
        const ok = window.confirm("Excluir esta avaliação?");
        if (!ok) return;

        setError("");
        try {
            await api.delete(`/reviews/${id}`);
            setItems((prev) => prev.filter((r) => String(r.id) !== String(id)));
        } catch {
            setError("Falha ao excluir.");
        }
    };

    return (
        <div className="space-y-space-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-space-4">
                <div>
                    <h1 className="text-text-3xl font-bold text-text-primary">Moderador de Avaliações</h1>
                    <div className="text-text-sm text-text-secondary mt-space-1">Gerencie e remova avaliações quando necessário</div>
                </div>
                <div className="w-full md:w-80">
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por negócio, usuário ou texto..." />
                </div>
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
                            {filtered.length} de {items.length} avaliações
                        </div>
                    </div>
                    <div className="mt-space-4 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted">
                                    <th className="py-2 pr-4">Data</th>
                                    <th className="py-2 pr-4">Negócio</th>
                                    <th className="py-2 pr-4">Usuário</th>
                                    <th className="py-2 pr-4">Nota</th>
                                    <th className="py-2 pr-4">Comentário</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id} className="border-t border-border-subtle align-top">
                                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="py-3 pr-4 font-semibold text-text-primary whitespace-nowrap">
                                            {r.business?.name || r.business_id}
                                        </td>
                                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                                            {r.user?.username || r.user?.name || r.user_id}
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
                                            <button className="text-status-error hover:underline font-semibold" onClick={() => remove(r.id)}>
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td className="py-4 text-text-secondary" colSpan={6}>
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
