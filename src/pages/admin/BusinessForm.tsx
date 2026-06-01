import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, Business, Category, Subcategory } from "../../types";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

type FormState = {
    name: string;
    main_product: string;
    description: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    instagram: string;
    facebook: string;
    category_id: string;
    subcategory_id: string;
    status: Business["status"];
    image_url: string;
    logo_url: string;
    latitude: string;
    longitude: string;
};

const emptyForm: FormState = {
    name: "",
    main_product: "",
    description: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    category_id: "",
    subcategory_id: "",
    status: "pending",
    image_url: "",
    logo_url: "",
    latitude: "",
    longitude: "",
};

export function BusinessForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [form, setForm] = useState<FormState>(emptyForm);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const selectedCategory = useMemo(() => form.category_id, [form.category_id]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const catsRes = await api.get<ApiResponse<Category[]>>("/categories");
                if (!cancelled && catsRes.data.success) setCategories(catsRes.data.data || []);

                if (isEdit && id) {
                    const bRes = await api.get<ApiResponse<Business>>(`/businesses/${id}`);
                    if (!cancelled && bRes.data.success) {
                        const b = bRes.data.data;
                        setForm({
                            name: b.name || "",
                            main_product: b.main_product || "",
                            description: b.description || "",
                            address: b.address || "",
                            neighborhood: b.neighborhood || "",
                            city: b.city || "",
                            state: b.state || "",
                            zip_code: b.zip_code || "",
                            phone: b.phone || "",
                            whatsapp: b.whatsapp || "",
                            email: b.email || "",
                            website: b.website || "",
                            instagram: b.instagram || "",
                            facebook: b.facebook || "",
                            category_id: b.category_id || "",
                            subcategory_id: b.subcategory_id || "",
                            status: b.status || "pending",
                            image_url: b.image_url || "",
                            logo_url: b.logo_url || "",
                            latitude: typeof b.latitude === "number" ? String(b.latitude) : "",
                            longitude: typeof b.longitude === "number" ? String(b.longitude) : "",
                        });
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, isEdit]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!selectedCategory) {
                setSubcategories([]);
                return;
            }
            const resp = await api.get<ApiResponse<Subcategory[]>>(`/subcategories?category=${encodeURIComponent(selectedCategory)}`);
            if (!cancelled && resp.data.success) setSubcategories(resp.data.data || []);
        })();
        return () => { cancelled = true; };
    }, [selectedCategory]);

    const update = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const payload: Record<string, unknown> = {
                name: form.name,
                main_product: form.main_product || null,
                description: form.description,
                address: form.address,
                neighborhood: form.neighborhood || null,
                city: form.city || null,
                state: form.state || null,
                zip_code: form.zip_code || null,
                phone: form.phone,
                whatsapp: form.whatsapp || null,
                email: form.email,
                website: form.website || null,
                instagram: form.instagram || null,
                facebook: form.facebook || null,
                category_id: form.category_id || null,
                subcategory_id: form.subcategory_id || null,
                status: form.status,
                image_url: form.image_url || null,
                logo_url: form.logo_url || null,
                latitude: form.latitude ? Number(form.latitude) : null,
                longitude: form.longitude ? Number(form.longitude) : null,
            };

            if (isEdit && id) {
                const resp = await api.put(`/businesses/${id}`, payload);
                if (!resp.data?.success) {
                    setError(resp.data?.message || "Falha ao salvar.");
                    return;
                }
                setMessage("Negócio atualizado.");
            } else {
                const resp = await api.post(`/businesses`, payload);
                if (!resp.data?.success) {
                    setError(resp.data?.message || "Falha ao salvar.");
                    return;
                }
                setMessage("Negócio criado.");
            }
            setTimeout(() => navigate("/admin/businesses"), 300);
        } catch {
            setError("Falha ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-space-6">
            <div className="flex items-center justify-between">
                <h1 className="text-text-3xl font-bold text-text-primary">{isEdit ? "Editar negócio" : "Novo negócio"}</h1>
                <Link to="/admin/businesses" className="text-action-primary hover:underline font-semibold">Voltar</Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <Card className="border-border-subtle">
                    <form onSubmit={save} className="space-y-space-4">
                        {message && (
                            <div className="bg-status-success/10 text-status-success p-space-3 rounded-radius-md text-text-sm font-medium">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="bg-status-error/10 text-status-error p-space-3 rounded-radius-md text-text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Nome</label>
                                <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Produto/Serviço principal</label>
                                <Input value={form.main_product} onChange={(e) => update("main_product", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-text-sm font-semibold text-text-secondary">Descrição</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => update("description", e.target.value)}
                                className="w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 py-3 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Endereço</label>
                                <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Bairro</label>
                                <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Cidade</label>
                                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">UF</label>
                                <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">CEP</label>
                                <Input value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Telefone</label>
                                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">WhatsApp</label>
                                <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Email</label>
                                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Categoria</label>
                                <select
                                    value={form.category_id}
                                    onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value, subcategory_id: "" }))}
                                    className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                >
                                    <option value="">Selecione</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Subcategoria</label>
                                <select
                                    value={form.subcategory_id}
                                    onChange={(e) => update("subcategory_id", e.target.value)}
                                    className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                >
                                    <option value="">Selecione</option>
                                    {subcategories.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Business["status"] }))}
                                    className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                >
                                    <option value="pending">pending</option>
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Latitude</label>
                                <Input value={form.latitude} onChange={(e) => update("latitude", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Longitude</label>
                                <Input value={form.longitude} onChange={(e) => update("longitude", e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Imagem (URL)</label>
                                <Input value={form.image_url} onChange={(e) => update("image_url", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-text-sm font-semibold text-text-secondary">Logo (URL)</label>
                                <Input value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-space-3">
                            <Button type="submit" disabled={saving}>
                                {saving ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
}
