import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import type { ApiResponse, Category, Subcategory } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function SubcategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Subcategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryId, setCategoryId] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const categoryById = useMemo(() => {
        const map = new Map<string, Category>();
        for (const c of categories) map.set(c.id, c);
        return map;
    }, [categories]);

    const query = useMemo(() => {
        const qs = new URLSearchParams();
        if (categoryId) qs.set("category", categoryId);
        const s = qs.toString();
        return s ? `?${s}` : "";
    }, [categoryId]);

    const load = async () => {
        setError("");
        setLoading(true);
        try {
            const [catsRes, subsRes] = await Promise.all([
                api.get<ApiResponse<Category[]>>("/categories?standard=1"),
                api.get<ApiResponse<Subcategory[]>>(`/subcategories${query}`),
            ]);
            if (catsRes.data.success) setCategories(catsRes.data.data || []);
            if (subsRes.data.success) setItems(subsRes.data.data || []);
        } catch {
            setError("Falha ao carregar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [query]);

    const create = async () => {
        setError("");
        try {
            const resp = await api.post(`/subcategories`, { name, category_id: categoryId });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao criar.");
                return;
            }
            setName("");
            await load();
        } catch {
            setError("Falha ao criar.");
        }
    };

    const remove = async (id: string) => {
        setError("");
        try {
            await api.delete(`/subcategories/${id}`);
            await load();
        } catch {
            setError("Falha ao excluir.");
        }
    };

    return (
        <div className="space-y-space-6">
            <div>
                <h1 className="text-text-3xl font-bold text-text-primary">Gerenciar Subcategorias</h1>
                <div className="text-text-sm text-text-secondary mt-space-1">Crie subcategorias vinculadas a uma categoria</div>
            </div>

            {error && (
                <Card className="border-border-subtle p-space-4">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            <Card className="border-border-subtle p-space-4">
                <div className="flex flex-col md:flex-row md:items-end gap-space-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Categoria</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                        >
                            <option value="">Selecione</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Nome</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alimentação e Bebidas" />
                    </div>
                    <div className="md:pb-[2px]">
                        <Button onClick={create} disabled={!categoryId || !name.trim()}>Adicionar</Button>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle p-space-4">
                    <div className="text-text-sm text-text-secondary">{items.length} subcategorias</div>
                    <div className="mt-space-4 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted">
                                    <th className="py-2 pr-4">Subcategoria</th>
                                    <th className="py-2 pr-4">Categoria</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((s) => (
                                    <tr key={s.id} className="border-t border-border-subtle hover:bg-surface-subtle/60">
                                        <td className="py-3 pr-4 font-semibold text-text-primary">{s.name}</td>
                                        <td className="py-3 pr-4 text-text-secondary">
                                            {s.category?.name || categoryById.get(s.category_id)?.name || "-"}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <button className="text-status-error hover:underline font-semibold" onClick={() => remove(s.id)}>Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td className="py-4 text-text-secondary" colSpan={3}>Sem subcategorias.</td>
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
