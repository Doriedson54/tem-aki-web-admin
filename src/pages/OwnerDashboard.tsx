import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import api from "../services/api";
import type { ApiResponse, Business } from "../types";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function OwnerDashboard() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const resp = await api.get<ApiResponse<Business[]>>("/businesses?limit=50");
                if (!cancelled && resp.data.success) setBusinesses(resp.data.data || []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="container mx-auto px-space-4 py-space-10">
            <div className="flex items-center justify-between mb-space-6">
                <h1 className="text-text-3xl font-bold text-text-primary">Meus Negócios</h1>
                <Link to="/admin/businesses/new">
                    <Button>Cadastrar</Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6">
                    {businesses.map((b) => (
                        <Card key={b.id} className="border-border-subtle">
                            <div className="font-bold text-text-primary mb-space-2">{b.name}</div>
                            <div className="text-text-sm text-text-muted mb-space-4">{b.neighborhood || ""}</div>
                            <div className="flex gap-space-2">
                                <Link to={`/business/${b.id}`} className="text-action-primary hover:underline font-semibold text-text-sm">
                                    Ver
                                </Link>
                                <Link to={`/admin/businesses/edit/${b.id}`} className="text-action-primary hover:underline font-semibold text-text-sm">
                                    Editar
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
