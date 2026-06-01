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
                api.get<ApiResponse<Category[]>>("/categories"),
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
            <h1 className="text-text-3xl font-bold text-text-primary">Subcategorias</h1>

            {error && (
                <Card className="border-border-subtle">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            <Card className="border-border-subtle">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4 items-end">
                    <div className="space-y-1">
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
                    <div className="space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Nome</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alimentação e Bebidas" />
                    </div>
                </div>
                <div className="mt-space-4 flex justify-end">
                    <Button onClick={create} disabled={!categoryId || !name.trim()}>Adicionar</Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle">
                    <div className="space-y-space-3">
                        {items.map((s) => (
                            <div key={s.id} className="flex items-center justify-between border-b border-border-subtle pb-space-3 last:border-b-0 last:pb-0">
                                <div className="font-semibold text-text-primary">{s.name}</div>
                                <button className="text-status-error hover:underline font-semibold text-text-sm" onClick={() => remove(s.id)}>Excluir</button>
                            </div>
                        ))}
                        {items.length === 0 && <div className="text-text-secondary">Sem subcategorias.</div>}
                    </div>
                </Card>
            )}
        </div>
    );
}
