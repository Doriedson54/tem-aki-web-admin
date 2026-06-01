import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, BusinessImage } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function BusinessGallery() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<BusinessImage[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        if (!id) return;
        setError("");
        setLoading(true);
        try {
            const resp = await api.get<ApiResponse<BusinessImage[]>>(`/business-images/${id}`);
            if (resp.data.success) setItems(resp.data.data || []);
        } catch {
            setError("Falha ao carregar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    const add = async () => {
        if (!id) return;
        setError("");
        try {
            const resp = await api.post(`/business-images/${id}`, { business_id: id, image_url: imageUrl, is_primary: false });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao adicionar.");
                return;
            }
            setImageUrl("");
            await load();
        } catch {
            setError("Falha ao adicionar.");
        }
    };

    const remove = async (imageId: number) => {
        setError("");
        try {
            const resp = await api.delete(`/business-images/${imageId}`);
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao excluir.");
                return;
            }
            await load();
        } catch {
            setError("Falha ao excluir.");
        }
    };

    return (
        <div className="space-y-space-6">
            <div className="flex items-center justify-between">
                <h1 className="text-text-3xl font-bold text-text-primary">Galeria</h1>
                <Link to="/admin/businesses" className="text-action-primary hover:underline font-semibold">Voltar</Link>
            </div>

            {error && (
                <Card className="border-border-subtle">
                    <div className="text-status-error font-semibold">{error}</div>
                </Card>
            )}

            <Card className="border-border-subtle">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-space-4 items-end">
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Imagem (URL)</label>
                        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <Button onClick={add} disabled={!imageUrl.trim()} className="h-11">Adicionar</Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
                    {items.map((img) => (
                        <Card key={img.id} className="border-border-subtle">
                            <img src={img.image_url} alt="" className="w-full rounded-radius-lg aspect-[4/3] object-cover bg-surface-subtle" />
                            <div className="mt-space-3 flex justify-end">
                                <button className="text-status-error hover:underline font-semibold text-text-sm" onClick={() => remove(img.id)}>Excluir</button>
                            </div>
                        </Card>
                    ))}
                    {items.length === 0 && (
                        <Card className="border-border-subtle">
                            <div className="text-text-secondary">Sem imagens.</div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
