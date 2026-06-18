import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo-transparent.png";

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, user } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
    const defaultRedirect = useMemo(() => {
        if (from && from !== "/" && from !== "/login") return from;
        if (user?.role === "admin" || user?.role === "operador") return "/admin";
        return "/";
    }, [from, user?.role]);

    useEffect(() => {
        if (!isAuthenticated) return;
        navigate(defaultRedirect, { replace: true });
    }, [defaultRedirect, isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const resp = await api.post("/auth/login", { email, password });
            const token = resp.data?.data?.token || resp.data?.token;
            const user = resp.data?.data?.user;
            if (!token || !user) {
                setError("Resposta inválida do servidor.");
                return;
            }
            login(token, user);
            if (from && from !== "/" && from !== "/login") {
                navigate(from, { replace: true });
                return;
            }
            const target = user.role === "admin" || user.role === "operador" ? "/admin" : "/";
            navigate(target, { replace: true });
        } catch {
            setError("Credenciais inválidas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-space-4 py-space-12">
            <div className="max-w-md mx-auto">
                <div className="mb-space-6 flex flex-col items-center gap-space-3 text-center">
                    <img src={logo} alt="Tem Aki no Bairro" className="h-20 w-auto max-w-[280px] object-contain" />
                    <h1 className="text-text-3xl font-bold text-text-primary">Área Restrita</h1>
                </div>
                <Card className="border-border-subtle">
                    <form onSubmit={handleSubmit} className="space-y-space-4">
                        {error && (
                            <div className="bg-status-error/10 text-status-error p-space-3 rounded-radius-md text-text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-text-sm font-semibold text-text-secondary">Email</label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-text-sm font-semibold text-text-secondary">Senha</label>
                            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
