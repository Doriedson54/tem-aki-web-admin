import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import type { ApiResponse, Business, BusinessImage, Category, Subcategory } from "../../types";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { MapComponent } from "../../components/MapComponent";
import { NOVA_TERRA_CENTER, NOVA_TERRA_DEFAULT_ZOOM } from "../../config/geo";

type GeocodeResolveResponse = {
    status: "found" | "dubious" | "not_found" | "invalid";
    message: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    candidate?: {
        display_name?: string | null;
        confidence?: "high" | "medium" | "low" | null;
    } | null;
};

type FormState = {
    name: string;
    main_product: string;
    description: string;
    delivery: "true" | "false";
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
    other_social: string;
    opening_hours: string;
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
    delivery: "false",
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
    other_social: "",
    opening_hours: "",
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
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [galleryItems, setGalleryItems] = useState<BusinessImage[]>([]);
    const [geocoding, setGeocoding] = useState(false);
    const [geoMessage, setGeoMessage] = useState("");
    const [showMapPicker, setShowMapPicker] = useState(false);

    const selectedCategory = useMemo(() => form.category_id, [form.category_id]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const catsRes = await api.get<ApiResponse<Category[]>>("/categories?standard=1");
                if (!cancelled && catsRes.data.success) setCategories(catsRes.data.data || []);

                if (isEdit && id) {
                    const bRes = await api.get<ApiResponse<Business>>(`/businesses/${id}`);
                    if (!cancelled && bRes.data.success) {
                        const b = bRes.data.data;
                        setForm({
                            name: b.name || "",
                            main_product: b.main_product || "",
                            description: b.description || "",
                            delivery: b.delivery ? "true" : "false",
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
                            other_social: (b as unknown as { other_social?: string; otherSocial?: string }).other_social || (b as unknown as { other_social?: string; otherSocial?: string }).otherSocial || "",
                            opening_hours:
                                typeof b.opening_hours === "string"
                                    ? b.opening_hours
                                    : (b.opening_hours as { description?: string } | null)?.description || "",
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

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isEdit || !id) return;
            setGalleryLoading(true);
            try {
                const resp = await api.get<ApiResponse<BusinessImage[]>>(`/business-images/${id}`);
                if (!cancelled && resp.data.success) setGalleryItems(resp.data.data || []);
            } finally {
                if (!cancelled) setGalleryLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, isEdit]);

    const update = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const mapCenter = useMemo<[number, number]>(() => {
        const lat = Number(form.latitude);
        const lng = Number(form.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return NOVA_TERRA_CENTER;
    }, [form.latitude, form.longitude]);

    const mapZoom = useMemo(() => {
        const lat = Number(form.latitude);
        const lng = Number(form.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng) ? 16 : NOVA_TERRA_DEFAULT_ZOOM;
    }, [form.latitude, form.longitude]);

    const handleResolveCoordinates = async () => {
        setError("");
        setMessage("");
        setGeoMessage("");
        setGeocoding(true);
        try {
            const resp = await api.post<ApiResponse<GeocodeResolveResponse>>("/businesses/geocode/resolve", {
                address: form.address,
                neighborhood: form.neighborhood,
                city: form.city,
                state: form.state,
                zip_code: form.zip_code,
            });
            if (!resp.data.success || !resp.data.data) {
                setError(resp.data.message || "Falha ao obter coordenadas.");
                return;
            }

            const result = resp.data.data;
            if (typeof result.latitude === "number" && typeof result.longitude === "number" && result.status === "found") {
                setForm((prev) => ({
                    ...prev,
                    latitude: String(result.latitude),
                    longitude: String(result.longitude),
                }));
            }

            const confidenceLabel = result.candidate?.confidence ? ` Confiança: ${result.candidate.confidence}.` : "";
            setGeoMessage(`${result.message}${confidenceLabel}${result.candidate?.display_name ? ` Resultado: ${result.candidate.display_name}` : ""}`);
        } catch {
            setError("Falha ao obter coordenadas.");
        } finally {
            setGeocoding(false);
        }
    };

    const uploadFile = async (file: File, businessId?: string) => {
        const fd = new FormData();
        if (businessId) fd.append("businessId", businessId);
        fd.append("file", file);
        const resp = await api.post<ApiResponse<{ url: string; path: string }>>("/upload/image", fd);
        if (!resp.data?.success) throw new Error(resp.data?.message || "Falha no upload.");
        const url = (resp.data.data as { url?: string }).url;
        if (!url) throw new Error("Resposta inválida do servidor.");
        return url;
    };

    const onUploadMainImage = async (file: File | null) => {
        if (!file) return;
        setError("");
        setUploadingImage(true);
        try {
            const url = await uploadFile(file, id || "misc");
            update("image_url", url);
        } catch {
            setError("Falha ao enviar imagem.");
        } finally {
            setUploadingImage(false);
        }
    };

    const onUploadLogo = async (file: File | null) => {
        if (!file) return;
        setError("");
        setUploadingLogo(true);
        try {
            const url = await uploadFile(file, id || "misc");
            update("logo_url", url);
        } catch {
            setError("Falha ao enviar logo.");
        } finally {
            setUploadingLogo(false);
        }
    };

    const onUploadGalleryFiles = async (files: FileList | null) => {
        if (!files || !files.length) return;
        if (!id) return;
        setError("");
        setGalleryUploading(true);
        try {
            const remainingSlots = Math.max(0, 10 - galleryItems.length);
            const selected = Array.from(files).slice(0, remainingSlots);
            for (const file of selected) {
                if (file.size > 5 * 1024 * 1024) {
                    setError("Uma das imagens excede 5MB.");
                    break;
                }
                const url = await uploadFile(file, id);
                const resp = await api.post(`/business-images/${id}`, { business_id: id, image_url: url, is_primary: false });
                if (!resp.data?.success) {
                    setError(resp.data?.message || "Falha ao salvar imagem.");
                    break;
                }
            }
            const reload = await api.get<ApiResponse<BusinessImage[]>>(`/business-images/${id}`);
            if (reload.data.success) setGalleryItems(reload.data.data || []);
        } catch {
            setError("Falha ao enviar imagens.");
        } finally {
            setGalleryUploading(false);
        }
    };

    const removeGalleryImage = async (imageId: number | string) => {
        if (!id) return;
        const ok = window.confirm("Excluir esta imagem?");
        if (!ok) return;
        setError("");
        try {
            const resp = await api.delete(`/business-images/${imageId}`);
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao excluir.");
                return;
            }
            setGalleryItems((prev) => prev.filter((img) => String(img.id) !== String(imageId)));
        } catch {
            setError("Falha ao excluir.");
        }
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
                delivery: form.delivery === "true",
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
                other_social: form.other_social || null,
                opening_hours: form.opening_hours || null,
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
            <div className="flex items-center justify-between gap-space-4">
                <div className="flex items-center gap-space-3">
                    <Link to="/admin/businesses" className="text-action-primary hover:underline font-semibold">
                        Voltar
                    </Link>
                    <h1 className="text-text-2xl md:text-text-3xl font-bold text-text-primary">
                        {isEdit ? "Editar Negócio" : "Cadastrar Novo Negócio"}
                    </h1>
                </div>
                {isEdit && id && (
                    <Link to={`/business/${id}`} target="_blank" rel="noreferrer" className="text-action-primary hover:underline font-semibold">
                        Abrir no site
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-space-12 text-action-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-action-primary"></div>
                </div>
            ) : (
                <form onSubmit={save} className="space-y-space-6">
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
                        <div className="space-y-space-6 lg:col-span-2">
                            <Card className="border-border-subtle p-space-4">
                                <div className="flex items-center gap-space-3">
                                    <div className="h-6 w-1 rounded-radius-full bg-action-primary" />
                                    <h2 className="text-text-lg font-bold text-text-primary">Informações Básicas</h2>
                                </div>

                                <div className="mt-space-4 grid grid-cols-1 md:grid-cols-2 gap-space-4">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-text-sm font-semibold text-text-secondary">Nome do Negócio</label>
                                        <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Padaria do Zé" required />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Categoria</label>
                                        <select
                                            value={form.category_id}
                                            onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value, subcategory_id: "" }))}
                                            className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                            required
                                        >
                                            <option value="">Selecione uma categoria</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Subcategoria</label>
                                        <select
                                            value={form.subcategory_id}
                                            onChange={(e) => update("subcategory_id", e.target.value)}
                                            className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                            disabled={!form.category_id}
                                        >
                                            <option value="">Selecione uma subcategoria</option>
                                            {subcategories.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Produto/Serviço Principal</label>
                                        <Input
                                            value={form.main_product}
                                            onChange={(e) => update("main_product", e.target.value)}
                                            placeholder="Ex: Venda e conserto de bicicletas"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Delivery</label>
                                        <select
                                            value={form.delivery}
                                            onChange={(e) => setForm((prev) => ({ ...prev, delivery: e.target.value as FormState["delivery"] }))}
                                            className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                        >
                                            <option value="false">Não</option>
                                            <option value="true">Sim</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-text-sm font-semibold text-text-secondary">Descrição</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => update("description", e.target.value)}
                                            className="w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 py-3 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                            rows={4}
                                            placeholder="Descreva o negócio e os serviços..."
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-border-subtle p-space-4">
                                <div className="flex items-center gap-space-3">
                                    <div className="h-6 w-1 rounded-radius-full bg-status-success" />
                                    <h2 className="text-text-lg font-bold text-text-primary">Localização</h2>
                                </div>

                                <div className="mt-space-4 grid grid-cols-1 md:grid-cols-2 gap-space-4">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-text-sm font-semibold text-text-secondary">Endereço</label>
                                        <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, Número" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Bairro</label>
                                        <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} placeholder="Bairro" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">CEP</label>
                                        <Input value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} placeholder="00000-000" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Cidade</label>
                                        <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Cidade" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Estado</label>
                                        <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Estado" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Latitude</label>
                                        <Input value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="-2.1234" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Longitude</label>
                                        <Input value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="-44.1234" />
                                    </div>
                                </div>

                                <div className="mt-space-4 flex flex-wrap gap-space-3">
                                    <Button type="button" variant="secondary" onClick={handleResolveCoordinates} disabled={geocoding}>
                                        {geocoding ? "Consultando..." : "Obter coordenadas pelo endereço"}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setShowMapPicker((prev) => !prev)}>
                                        {showMapPicker ? "Fechar mapa" : "Escolher ponto no mapa"}
                                    </Button>
                                </div>

                                {geoMessage && (
                                    <div className="mt-space-3 rounded-radius-md bg-action-primary/10 p-space-3 text-text-sm text-action-primary">
                                        {geoMessage}
                                    </div>
                                )}

                                {showMapPicker && (
                                    <div className="mt-space-4 space-y-space-3">
                                        <div className="text-text-sm text-text-secondary">
                                            Toque no mapa para posicionar o negócio. As coordenadas serão preenchidas automaticamente e você ainda poderá ajustar manualmente depois.
                                        </div>
                                        <MapComponent
                                            center={mapCenter}
                                            zoom={mapZoom}
                                            onMapClick={(position) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    latitude: position[0].toFixed(6),
                                                    longitude: position[1].toFixed(6),
                                                }));
                                            }}
                                            highlightPoint={{
                                                position: mapCenter,
                                                label: "Ponto selecionado",
                                                popupContent: (
                                                    <div className="text-text-xs text-text-muted">
                                                        {form.latitude && form.longitude
                                                            ? `${form.latitude}, ${form.longitude}`
                                                            : "Toque no mapa para marcar."}
                                                    </div>
                                                ),
                                            }}
                                            className="h-[360px] w-full"
                                        />
                                    </div>
                                )}
                            </Card>

                            <Card className="border-border-subtle p-space-4">
                                <div className="flex items-center gap-space-3">
                                    <div className="h-6 w-1 rounded-radius-full bg-action-strong" />
                                    <h2 className="text-text-lg font-bold text-text-primary">Contato e Redes Sociais</h2>
                                </div>

                                <div className="mt-space-4 grid grid-cols-1 md:grid-cols-2 gap-space-4">
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Telefone</label>
                                        <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 00000-0000" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">WhatsApp</label>
                                        <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Email</label>
                                        <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Site</label>
                                        <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://www.site.com" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Instagram</label>
                                        <Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@usuario" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Facebook</label>
                                        <Input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="facebook.com/pagina" />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-text-sm font-semibold text-text-secondary">Outra rede social</label>
                                        <Input value={form.other_social} onChange={(e) => update("other_social", e.target.value)} placeholder="@usuario ou https://..." />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-space-6">
                            <Card className="border-border-subtle p-space-4">
                                <h2 className="text-text-lg font-bold text-text-primary">Mídia e Horários</h2>

                                <div className="mt-space-4 space-y-space-6">
                                    <div className="space-y-space-3">
                                        <div className="text-text-sm font-semibold text-text-secondary">Uploads (Topo)</div>
                                        <div className="space-y-space-4">
                                            <div className="space-y-1">
                                                <label className="text-text-sm font-semibold text-text-secondary">Upload de imagem de capa</label>
                                                <Input type="file" accept="image/*" onChange={(e) => onUploadMainImage(e.target.files?.[0] || null)} disabled={uploadingImage} />
                                                <div className="text-text-xs text-text-muted">Selecione uma imagem do seu dispositivo.</div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-text-sm font-semibold text-text-secondary">Upload do computador (Logo)</label>
                                                <Input type="file" accept="image/*" onChange={(e) => onUploadLogo(e.target.files?.[0] || null)} disabled={uploadingLogo} />
                                                <div className="text-text-xs text-text-muted">Selecione a logo do seu dispositivo.</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-space-3">
                                        <div className="text-text-sm font-semibold text-text-secondary">Campos de URLs</div>
                                        <div className="space-y-space-3">
                                            <div className="space-y-1">
                                                <label className="text-text-sm font-semibold text-text-secondary">URL da Imagem de Capa</label>
                                                <Input value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-text-sm font-semibold text-text-secondary">URL do Logo</label>
                                                <Input value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} placeholder="https://..." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Horário de Funcionamento (Texto)</label>
                                        <textarea
                                            value={form.opening_hours}
                                            onChange={(e) => update("opening_hours", e.target.value)}
                                            className="w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 py-3 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                            rows={4}
                                            placeholder="Ex: Segunda à Sexta: 09:00 - 18:00 | Sábado: 09:00 - 13:00"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-text-sm font-semibold text-text-secondary">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Business["status"] }))}
                                            className="h-11 w-full rounded-radius-lg border border-border-default/60 bg-surface-card px-4 text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30 focus-visible:border-border-focus transition-all"
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                            <option value="pending">Pendente</option>
                                        </select>
                                    </div>

                                    <div className="space-y-space-3">
                                        <div className="text-text-sm font-semibold text-text-secondary">Fotos de Galeria (até 10 imagens)</div>
                                        <div className="rounded-radius-lg border border-dashed border-border-default bg-surface-subtle/40 p-space-4">
                                            {!id ? (
                                                <div className="text-text-sm text-text-secondary">Imagens da galeria serão carregadas após salvar o negócio.</div>
                                            ) : (
                                                <div className="space-y-space-4">
                                                    <div className="space-y-1">
                                                        <label className="text-text-sm font-semibold text-text-secondary">Upload de fotos</label>
                                                        <Input type="file" accept="image/*" multiple onChange={(e) => onUploadGalleryFiles(e.target.files)} disabled={galleryUploading} />
                                                        <div className="text-text-xs text-text-muted">Formatos: JPG, PNG, WebP. Tamanho máximo: 5MB cada.</div>
                                                    </div>
                                                    <div className="text-text-sm text-text-secondary">
                                                        {galleryUploading ? "Enviando..." : galleryLoading ? "Carregando..." : `${galleryItems.length} / 10 imagens`}
                                                    </div>

                                                    {galleryItems.length ? (
                                                        <div className="grid grid-cols-2 gap-space-3">
                                                            {galleryItems.map((img) => (
                                                                <div key={String(img.id)} className="rounded-radius-lg border border-border-subtle bg-surface-card p-space-2">
                                                                    <img src={img.image_url} alt="" className="w-full rounded-radius-lg aspect-[4/3] object-cover bg-surface-subtle" />
                                                                    <div className="mt-space-2 flex justify-end">
                                                                        <button
                                                                            className="text-status-error hover:underline font-semibold text-text-sm"
                                                                            type="button"
                                                                            onClick={() => removeGalleryImage(img.id)}
                                                                        >
                                                                            Excluir
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-text-secondary text-text-sm">Sem imagens.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end gap-space-3">
                        <Button type="button" variant="secondary" onClick={() => navigate("/admin/businesses")}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar Negócio"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
