import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, Business } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ExternalLink, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export function BusinessList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Business[]>([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

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
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr key={b.id} className="border-t border-border-subtle hover:bg-surface-subtle/60">
                                        <td className="py-3 pr-4 font-semibold text-text-primary">{b.name}</td>
                                        <td className="py-3 pr-4 text-text-secondary">{b.category?.name || "-"}</td>
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
                                        <td className="py-4 text-text-secondary" colSpan={4}>Sem negócios.</td>
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
