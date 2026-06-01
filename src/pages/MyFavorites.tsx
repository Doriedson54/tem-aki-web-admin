import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { favoritesService, type FavoriteItem } from "../services/favorites";
import { BusinessCard } from "../components/BusinessCard";

export function MyFavorites() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const resp = await favoritesService.getAll();
            setFavorites(resp.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const remove = async (businessId: string) => {
        await favoritesService.remove(businessId);
        await load();
    };

    return (
        <div className="container mx-auto px-space-4 py-space-10">
            <div className="mb-space-6">
                <Link to="/" className="inline-flex items-center gap-space-2 text-action-primary hover:underline font-semibold">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Link>
            </div>

            <div className="flex items-center justify-between mb-space-6">
                <h1 className="text-text-3xl font-bold text-text-primary flex items-center gap-space-2">
                    <Heart className="h-7 w-7 text-status-error" /> Meus Favoritos
                </h1>
                <Button variant="ghost" onClick={load} className="text-action-primary">Atualizar</Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : favorites.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6">
                    {favorites.map((f) => (
                        <div key={f.id} className="relative">
                            <BusinessCard
                                business={f.business}
                                isFavorite
                                onToggleFavorite={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void remove(f.business_id);
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="border-border-subtle">
                    <div className="text-text-secondary">Você ainda não tem favoritos.</div>
                </Card>
            )}
        </div>
    );
}
