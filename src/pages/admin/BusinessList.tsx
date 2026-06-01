import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, Business } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function BusinessList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Business[]>([]);
    const [error, setError] = useState("");

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
        setError("");
        try {
            await api.delete(`/businesses/${id}`);
            await load();
        } catch {
            setError("Falha ao excluir.");
        }
    };

    return (
        <div className="space-y-space-6">
            <div className="flex items-center justify-between">
                <h1 className="text-text-3xl font-bold text-text-primary">Negócios</h1>
                <Link to="/admin/businesses/new">
                    <Button>Novo</Button>
                </Link>
            </div>

            {error && (
                <Card className="border-border-subtle">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted">
                                    <th className="py-2 pr-4">Nome</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Bairro</th>
                                    <th className="py-2 pr-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((b) => (
                                    <tr key={b.id} className="border-t border-border-subtle">
                                        <td className="py-3 pr-4 font-semibold text-text-primary">{b.name}</td>
                                        <td className="py-3 pr-4">{b.status}</td>
                                        <td className="py-3 pr-4">{b.neighborhood || ""}</td>
                                        <td className="py-3 pr-4">
                                            <div className="flex gap-space-3">
                                                <Link className="text-action-primary hover:underline font-semibold" to={`/admin/businesses/edit/${b.id}`}>Editar</Link>
                                                <Link className="text-action-primary hover:underline font-semibold" to={`/admin/businesses/gallery/${b.id}`}>Galeria</Link>
                                                <button className="text-status-error hover:underline font-semibold" onClick={() => remove(b.id)}>Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
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
