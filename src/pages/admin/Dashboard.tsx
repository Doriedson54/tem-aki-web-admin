import { useEffect, useState } from "react";
import api from "../../services/api";
import type { ActivityItem, ApiResponse, Business } from "../../types";
import { Card } from "../../components/ui/Card";
import { Link } from "react-router-dom";
import { ExternalLink, Grid, Pencil, MessageSquare, Store, Users } from "lucide-react";

type LeadItem = {
    id: string;
    name: string;
    whatsapp: string;
    created_at: string;
};

type DashboardPayload = {
    totals: {
        businesses: number;
        categories: number;
        reviews: number;
        leads: number;
    };
    recentBusinesses: Array<Pick<Business, "id" | "name" | "status" | "neighborhood" | "city" | "created_at" | "updated_at">>;
    recentLeads: LeadItem[];
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
            <div className="flex items-end justify-between gap-space-4">
                <div>
                    <h1 className="text-text-3xl font-bold text-text-primary">Dashboard</h1>
                    <div className="text-text-sm text-text-secondary mt-space-1">Visão geral do painel administrativo</div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <div className="space-y-space-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-4">
                        <Card className="border-border-subtle p-space-4">
                            <div className="flex items-center gap-space-4">
                                <div className="h-10 w-10 rounded-radius-lg bg-action-primary/10 flex items-center justify-center">
                                    <Store className="h-5 w-5 text-action-primary" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Negócios</div>
                                    <div className="text-text-2xl font-bold text-text-primary leading-none">{data?.totals?.businesses ?? 0}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-border-subtle p-space-4">
                            <div className="flex items-center gap-space-4">
                                <div className="h-10 w-10 rounded-radius-lg bg-action-strong/10 flex items-center justify-center">
                                    <Grid className="h-5 w-5 text-action-strong" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Categorias</div>
                                    <div className="text-text-2xl font-bold text-text-primary leading-none">{data?.totals?.categories ?? 0}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-border-subtle p-space-4">
                            <div className="flex items-center gap-space-4">
                                <div className="h-10 w-10 rounded-radius-lg bg-status-warning/10 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-status-warning" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Avaliações</div>
                                    <div className="text-text-2xl font-bold text-text-primary leading-none">{data?.totals?.reviews ?? 0}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-border-subtle p-space-4">
                            <div className="flex items-center gap-space-4">
                                <div className="h-10 w-10 rounded-radius-lg bg-status-success/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-status-success" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-text-xs text-text-muted font-semibold uppercase tracking-wide">Leads</div>
                                    <div className="text-text-2xl font-bold text-text-primary leading-none">{data?.totals?.leads ?? 0}</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-6">
                        <Card className="border-border-subtle xl:col-span-2 p-space-4">
                            <div className="flex items-center justify-between gap-space-4">
                                <h2 className="text-text-lg font-bold text-text-primary">Negócios Recentes</h2>
                                <Link className="text-action-primary hover:underline font-semibold text-text-sm" to="/admin/businesses">
                                    Ver todos
                                </Link>
                            </div>
                            <div className="mt-space-4 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-text-muted">
                                            <th className="py-2 pr-4">Nome</th>
                                            <th className="py-2 pr-4">Local</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.recentBusinesses || []).map((b) => (
                                            <tr key={b.id} className="border-t border-border-subtle">
                                                <td className="py-3 pr-4 font-semibold text-text-primary">{b.name}</td>
                                                <td className="py-3 pr-4 text-text-secondary">
                                                    {(b.neighborhood || "").trim()}
                                                    {b.city ? ` - ${b.city}` : ""}
                                                </td>
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
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!data?.recentBusinesses || data.recentBusinesses.length === 0) && (
                                            <tr>
                                                <td className="py-4 text-text-secondary" colSpan={4}>
                                                    Sem dados.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <Card className="border-border-subtle p-space-4">
                            <h2 className="text-text-lg font-bold text-text-primary">Leads e Informações Recentes</h2>

                            <div className="mt-space-4">
                                <div className="text-text-xs font-semibold text-text-muted uppercase tracking-wide">Leads recentes</div>
                                <div className="mt-space-3 space-y-space-3">
                                    {(data?.recentLeads || []).slice(0, 6).map((l) => (
                                        <div key={l.id} className="flex items-start justify-between gap-space-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-text-primary truncate">{l.name}</div>
                                                <div className="text-text-xs text-text-muted">
                                                    {l.whatsapp} • {new Date(l.created_at).toLocaleDateString("pt-BR")}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data?.recentLeads || data.recentLeads.length === 0) && (
                                        <div className="text-text-secondary text-text-sm">Sem leads.</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-space-6">
                                <div className="text-text-xs font-semibold text-text-muted uppercase tracking-wide">Atividade</div>
                                <div className="mt-space-3 space-y-space-3">
                                    {(data?.activities || []).slice(0, 10).map((a) => (
                                        <div key={a.id} className="flex items-start justify-between gap-space-4">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-text-primary">{a.action}</div>
                                                <div className="text-text-sm text-text-secondary truncate">{a.title}</div>
                                                <div className="text-text-xs text-text-muted">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data?.activities || data.activities.length === 0) && (
                                        <div className="text-text-secondary text-text-sm">Sem informações.</div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
