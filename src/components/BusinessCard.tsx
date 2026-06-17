import { Link } from "react-router-dom";
import { MapPin, Star, ChevronRight, Heart } from "lucide-react";
import type { Business } from "../types";

interface BusinessCardProps {
    business: Business;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
    detailsPathPrefix?: string;
    showFavorite?: boolean;
}

function joinPath(prefix: string | undefined, path: string) {
    const safePrefix = String(prefix || "").trim().replace(/\/+$/, "");
    const safePath = String(path || "").trim().replace(/^\/+/, "");
    if (!safePrefix) return `/${safePath}`;
    return `${safePrefix}/${safePath}`;
}

export function BusinessCard({ business, isFavorite, onToggleFavorite, detailsPathPrefix, showFavorite = true }: BusinessCardProps) {
    const reviewCount = typeof business.review_count === "number" ? business.review_count : 0;
    const hasReviews = (typeof business.rating === "number" && business.rating > 0) || reviewCount > 0;
    const reviewsLabel = reviewCount === 1 ? "avaliação" : "avaliações";

    return (
        <Link to={joinPath(detailsPathPrefix, `business/${business.id}`)} className="group relative block h-full cursor-pointer">
            <article className="bg-surface-card rounded-radius-2xl border border-border-subtle shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle">
                    <img
                        src={business.image_url || "https://placehold.co/400x300/e2e8f0/94a3b8?text=Imagem"}
                        alt={business.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-space-4 left-space-4">
                        <span className="bg-surface-card/95 backdrop-blur-sm px-space-2.5 py-space-1 rounded-radius-md text-[10px] font-bold text-text-muted uppercase tracking-wider border border-border-subtle shadow-sm leading-none flex items-center h-5">
                            {business.category?.name || 'Geral'}
                        </span>
                    </div>
                    {showFavorite && (
                        <button
                            onClick={onToggleFavorite}
                            className="absolute top-space-4 right-space-4 p-space-2 rounded-radius-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-all z-10 hover:scale-110 active:scale-95 group/heart"
                        >
                            <Heart className={`h-space-4 w-space-4 transition-colors ${isFavorite ? "fill-status-error text-status-error" : "text-text-muted group-hover/heart:text-status-error"}`} />
                        </button>
                    )}
                </div>

                <div className="p-space-6 flex flex-col flex-1">
                    {hasReviews ? (
                        <div className="flex items-center justify-between gap-space-2 mb-space-3">
                            <div className="flex items-center gap-space-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= Math.round(business.rating || 0)
                                                ? "fill-status-warning text-status-warning"
                                                : "text-border-default"
                                            }`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-baseline gap-space-2">
                                <span className="text-text-xl font-bold text-text-primary">
                                    {typeof business.rating === "number" ? Number(business.rating).toFixed(1) : "0,0"}
                                </span>
                                {reviewCount > 0 && (
                                    <span className="text-text-sm text-text-muted">
                                        ({reviewCount} {reviewsLabel})
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-space-2 mb-space-3">
                            <span className="text-text-sm text-text-muted">Sem avaliações</span>
                        </div>
                    )}

                    <div className="flex-1">
                        <h3 className="text-text-xl font-bold text-text-primary mb-space-2 line-clamp-1 group-hover:text-action-primary transition-colors leading-tight">
                            {business.name}
                        </h3>
                        {business.main_product && (
                            <div className="text-text-secondary text-text-sm font-medium line-clamp-1 mb-space-2">
                                Produto/Serviço: {business.main_product}
                            </div>
                        )}
                        <div className="flex items-start gap-space-2 text-text-secondary text-text-sm">
                            <MapPin className="h-space-4 w-space-4 shrink-0 mt-0.5 text-text-muted" />
                            <span className="line-clamp-2 leading-relaxed">{business.address}, {business.neighborhood}</span>
                        </div>
                    </div>

                    <div className="mt-space-6 pt-space-4 border-t border-border-default flex justify-between items-center text-text-sm font-semibold text-action-primary group-hover:translate-x-0.5 transition-transform duration-300">
                        <span className="flex items-center gap-1">
                            Ver mais
                            <ChevronRight className="h-space-3.5 w-space-3.5" />
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
