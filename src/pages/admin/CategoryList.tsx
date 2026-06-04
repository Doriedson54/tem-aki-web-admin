import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import type { ApiResponse, Category } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function CategoryList() {
    const [items, setItems] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [working, setWorking] = useState(false);

    const standardCategories = useMemo(
        () => [
            { name: "Serviços", icon: "🛠️" },
            { name: "Comércio", icon: "🛍️" },
            { name: "Escolar", icon: "🎓" },
            { name: "Instituições Públicas", icon: "🏛️" },
            { name: "Instituições Comunitárias", icon: "🤝" },
            { name: "Instituições Religiosas", icon: "⛪" },
        ],
        []
    );

    const normalizeName = (value: string) => value.trim().toLowerCase();

    const byName = useMemo(() => {
        const map = new Map<string, Category>();
        for (const c of items) {
            const key = normalizeName(c.name || "");
            if (!map.has(key)) map.set(key, c);
        }
        return map;
    }, [items]);

    const rows = useMemo(() => {
        return standardCategories.map((s) => {
            const found = byName.get(normalizeName(s.name));
            return { standard: s, found };
        });
    }, [byName, standardCategories]);

    const load = async () => {
        setError("");
        setLoading(true);
        try {
            const resp = await api.get<ApiResponse<Category[]>>("/categories?standard=1");
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

    const createMissing = async () => {
        setError("");
        setWorking(true);
        try {
            const resp = await api.post("/categories/standardize", { action: "create-missing" });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao criar ausentes.");
                return;
            }
            await load();
        } catch {
            setError("Falha ao criar ausentes.");
        } finally {
            setWorking(false);
        }
    };

    const deleteNonStandard = async () => {
        const ok = window.confirm("Excluir categorias não padronizadas? Isso pode remover dados antigos/duplicados.");
        if (!ok) return;

        setError("");
        setWorking(true);
        try {
            const resp = await api.post("/categories/standardize", { action: "delete-nonstandard" });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao excluir não padrão.");
                return;
            }
            await load();
        } catch {
            setError("Falha ao excluir não padrão.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="space-y-space-6">
            <div>
                <h1 className="text-text-3xl font-bold text-text-primary">Gerenciar Categorias</h1>
                <div className="text-text-sm text-text-secondary mt-space-1">Categorias padronizadas do sistema</div>
            </div>

            {error && (
                <Card className="border-border-subtle p-space-4">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            <Card className="border-border-subtle p-space-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-space-4">
                    <div className="text-text-sm text-text-secondary leading-relaxed">
                        <div className="font-semibold text-text-primary">Categorias padronizadas</div>
                        <div className="mt-space-1">
                            Este painel trabalha com um conjunto fixo de 6 categorias para evitar duplicidade e manter a navegação consistente.
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-space-3">
                        <Button onClick={createMissing} disabled={working || loading} variant="secondary">
                            Criar ausentes
                        </Button>
                        <Button onClick={deleteNonStandard} disabled={working || loading} variant="ghost">
                            Excluir não padrão
                        </Button>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle p-space-4">
                    <div className="mt-space-4 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted">
                                    <th className="py-2 pr-4">Categoria</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ standard, found }) => (
                                    <tr key={standard.name} className="border-t border-border-subtle hover:bg-surface-subtle/60">
                                        <td className="py-3 pr-4 font-semibold text-text-primary">
                                            {found?.icon ? `${found.icon} ` : `${standard.icon} `}
                                            {standard.name}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {found ? (
                                                <span className="inline-flex items-center rounded-radius-full border border-border-default px-2 py-1 text-text-xs font-semibold text-text-secondary bg-surface-subtle">
                                                    OK
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-radius-full border border-border-default px-2 py-1 text-text-xs font-semibold text-text-secondary bg-surface-subtle">
                                                    Ausente
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4 text-text-secondary">—</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
