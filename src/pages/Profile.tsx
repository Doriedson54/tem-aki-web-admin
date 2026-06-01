import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export function Profile() {
    const { user } = useAuth();
    const [username, setUsername] = useState(user?.username || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setUsername(user?.username || "");
    }, [user?.username]);

    const save = async () => {
        setError("");
        setMessage("");
        setLoading(true);
        try {
            const resp = await api.put("/auth/profile", { username });
            if (!resp.data?.success) {
                setError(resp.data?.message || "Falha ao salvar.");
                return;
            }
            const stored = localStorage.getItem("tem-aki-user");
            if (stored) {
                const parsed = JSON.parse(stored) as Record<string, unknown>;
                parsed.username = resp.data?.data?.username || username;
                localStorage.setItem("tem-aki-user", JSON.stringify(parsed));
            }
            setMessage("Perfil atualizado.");
        } catch {
            setError("Não foi possível atualizar o perfil.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-space-4 py-space-10">
                <Card className="border-border-subtle">
                    <div className="text-text-secondary">Você precisa estar logado.</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-space-4 py-space-10">
            <h1 className="text-text-3xl font-bold text-text-primary mb-space-6">Meu Perfil</h1>
            <Card className="border-border-subtle">
                <div className="space-y-space-4">
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
                            <label className="text-text-sm font-semibold text-text-secondary">Email</label>
                            <Input value={user.email} disabled />
                        </div>
                        <div className="space-y-1">
                            <label className="text-text-sm font-semibold text-text-secondary">Papel</label>
                            <Input value={user.role} disabled />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Usuário</label>
                        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu nome de usuário" />
                    </div>
                    <Button onClick={save} disabled={loading} className="h-11">
                        {loading ? "Salvando..." : "Salvar"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
