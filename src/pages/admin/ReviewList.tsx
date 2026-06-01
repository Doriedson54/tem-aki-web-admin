import { useEffect, useState } from "react";
import api from "../../services/api";
import type { ApiResponse, Review } from "../../types";
import { Card } from "../../components/ui/Card";

export function ReviewList() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Review[]>([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const resp = await api.get<ApiResponse<Review[]>>("/reviews");
                if (!cancelled && resp.data.success) setItems(resp.data.data || []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="space-y-space-6">
            <h1 className="text-text-3xl font-bold text-text-primary">Avaliações</h1>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle">
                    {items.length ? (
                        <div className="space-y-space-4">
                            {items.map((r) => (
                                <div key={r.id} className="border-b border-border-subtle pb-space-4 last:border-b-0 last:pb-0">
                                    <div className="font-semibold text-text-primary">Nota: {r.rating}</div>
                                    <div className="text-text-secondary whitespace-pre-wrap">{r.content}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-text-secondary">Sem avaliações.</div>
                    )}
                </Card>
            )}
        </div>
    );
}
