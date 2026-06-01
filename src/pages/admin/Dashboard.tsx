import { useEffect, useState } from "react";
import api from "../../services/api";
import type { ActivityItem, ApiResponse, Business } from "../../types";
import { Card } from "../../components/ui/Card";
import { Link } from "react-router-dom";

type DashboardPayload = {
    recentBusinesses: Array<Pick<Business, "id" | "name" | "status" | "neighborhood" | "city" | "created_at" | "updated_at">>;
    activities: ActivityItem[];
};

export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardPayload | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const resp = await api.get<ApiResponse<DashboardPayload>>("/dashboard/recent");
                if (!cancelled && resp.data.success) setData(resp.data.data);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="space-y-space-6">
            <h1 className="text-text-3xl font-bold text-text-primary">Dashboard</h1>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
                    <Card className="border-border-subtle">
                        <h2 className="text-text-xl font-bold text-text-primary mb-space-4">Negócios recentes</h2>
                        <div className="space-y-space-3">
                            {(data?.recentBusinesses || []).map((b) => (
                                <div key={b.id} className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-text-primary">{b.name}</div>
                                        <div className="text-text-xs text-text-muted">{b.neighborhood || ""} {b.city ? `- ${b.city}` : ""}</div>
                                    </div>
                                    <Link className="text-action-primary hover:underline font-semibold text-text-sm" to={`/admin/businesses/edit/${b.id}`}>
                                        Editar
                                    </Link>
                                </div>
                            ))}
                            {(!data?.recentBusinesses || data.recentBusinesses.length === 0) && (
                                <div className="text-text-secondary">Sem dados.</div>
                            )}
                        </div>
                    </Card>

                    <Card className="border-border-subtle">
                        <h2 className="text-text-xl font-bold text-text-primary mb-space-4">Atividades</h2>
                        <div className="space-y-space-3">
                            {(data?.activities || []).map((a) => (
                                <div key={a.id} className="flex items-start justify-between gap-space-4">
                                    <div>
                                        <div className="font-semibold text-text-primary">{a.action}</div>
                                        <div className="text-text-sm text-text-secondary">{a.title}</div>
                                        <div className="text-text-xs text-text-muted">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                                    </div>
                                </div>
                            ))}
                            {(!data?.activities || data.activities.length === 0) && (
                                <div className="text-text-secondary">Sem atividades.</div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
