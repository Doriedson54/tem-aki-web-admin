import { useEffect, useState } from "react";
import api from "../../services/api";
import type { ApiResponse, Category } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function CategoryList() {
    const [items, setItems] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        setError("");
        setLoading(true);
        try {
            const resp = await api.get<ApiResponse<Category[]>>("/categories");
            if (resp.data.success) setItems(resp.data.data || []);
        } catch {
            setError("Falha ao carregar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const create = async () => {
        setError("");
        try {
            const resp = await api.post("/categories", { name, icon: icon || null });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao criar.");
                return;
            }
            setName("");
            setIcon("");
            await load();
        } catch {
            setError("Falha ao criar.");
        }
    };

    const remove = async (id: string) => {
        setError("");
        try {
            await api.delete(`/categories/${id}`);
            await load();
        } catch {
            setError("Falha ao excluir.");
        }
    };

    return (
        <div className="space-y-space-6">
            <h1 className="text-text-3xl font-bold text-text-primary">Categorias</h1>

            {error && (
                <Card className="border-border-subtle">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            <Card className="border-border-subtle">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 items-end">
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-text-sm font-semibold text-text-secondary">Nome</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Comércio" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Ícone</label>
                        <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Ex: 🛍️" />
                    </div>
                </div>
                <div className="mt-space-4 flex justify-end">
                    <Button onClick={create} disabled={!name.trim()}>Adicionar</Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle">
                    <div className="space-y-space-3">
                        {items.map((c) => (
                            <div key={c.id} className="flex items-center justify-between border-b border-border-subtle pb-space-3 last:border-b-0 last:pb-0">
                                <div className="font-semibold text-text-primary">{c.icon ? `${c.icon} ` : ""}{c.name}</div>
                                <button className="text-status-error hover:underline font-semibold text-text-sm" onClick={() => remove(c.id)}>Excluir</button>
                            </div>
                        ))}
                        {items.length === 0 && <div className="text-text-secondary">Sem categorias.</div>}
                    </div>
                </Card>
            )}
        </div>
    );
}
