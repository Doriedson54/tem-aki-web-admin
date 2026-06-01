import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { X, Trophy, MessageSquare } from "lucide-react";
import api from "../services/api";

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    searchTerm?: string;
}

export function LeadCaptureModal({ isOpen, onClose, onSuccess, searchTerm }: LeadCaptureModalProps) {
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !whatsapp) {
            setError("Por favor, preencha nome e WhatsApp.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/leads", {
                name,
                whatsapp,
                searchTerm
            });

            localStorage.setItem("temaki_lead_captured", "true");
            localStorage.setItem("temaki_lead_name", name);

            onSuccess();
            onClose();
        } catch {
            setError("Ocorreu um erro ao salvar seus dados. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-space-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-space-4 right-space-4 text-text-muted hover:text-text-primary transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="bg-action-primary p-space-6 text-text-on-brand text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-space-4">
                        <Trophy className="h-8 w-8" />
                    </div>
                    <h2 className="text-text-2xl font-bold mb-space-2">Acesse as melhores ofertas!</h2>
                    <p className="opacity-90 text-text-sm">
                        Cadastre-se rapidamente para ver todos os negócios e serviços da Nova Terra.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-space-8 flex flex-col gap-space-4">
                    {error && (
                        <div className="bg-status-error/10 text-status-error p-space-3 rounded-radius-md text-text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">Nome Completo</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Como quer ser chamado?"
                            className="bg-surface-subtle"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-text-sm font-semibold text-text-secondary">WhatsApp</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <Input
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="(99) 99999-9999"
                                className="pl-10 bg-surface-subtle"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-space-4 h-12 text-text-lg"
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : "Ver Resultados Agora"}
                    </Button>

                    <p className="text-center text-[10px] text-text-muted mt-space-2">
                        Ao clicar em Ver Resultados, você concorda em ser contatado para ofertas exclusivas no seu bairro.
                    </p>
                </form>
            </Card>
        </div>
    );
}
