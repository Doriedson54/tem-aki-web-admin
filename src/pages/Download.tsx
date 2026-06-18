import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    BadgeCheck,
    BookOpen,
    Church,
    Compass,
    Download as DownloadIcon,
    ExternalLink,
    GraduationCap,
    HelpCircle,
    Landmark,
    MapPin,
    MessageCircle,
    Monitor,
    QrCode,
    Store,
    Smartphone,
    Users,
    Wrench,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import logo from "../assets/logo-transparent.png";
import heroBg from "../assets/hero-bg.jpg";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void> | void;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorStandalone = Navigator & { standalone?: boolean };

function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        const updateStandalone = () => {
            const standalone =
                window.matchMedia?.("(display-mode: standalone)")?.matches ||
                (window.navigator as NavigatorStandalone)?.standalone === true;
            setIsStandalone(Boolean(standalone));
        };

        const updateIos = () => {
            setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
        };

        updateStandalone();
        updateIos();

        const onBeforeInstallPrompt = (e: Event) => {
            const ev = e as BeforeInstallPromptEvent;
            ev.preventDefault();
            setDeferredPrompt(ev);
        };

        const onAppInstalled = () => {
            setDeferredPrompt(null);
            updateStandalone();
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);
        window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", updateStandalone);

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onAppInstalled);
            window.matchMedia?.("(display-mode: standalone)")?.removeEventListener?.("change", updateStandalone);
        };
    }, []);

    const canPrompt = Boolean(deferredPrompt);

    const promptInstall = async () => {
        if (!deferredPrompt) return { outcome: "unavailable" as const };
        try {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            return { outcome: choice.outcome as "accepted" | "dismissed" };
        } catch {
            setDeferredPrompt(null);
            return { outcome: "dismissed" as const };
        }
    };

    return { canPrompt, isIos, isStandalone, promptInstall };
}

export function Download() {
    const { canPrompt, isIos, isStandalone, promptInstall } = usePwaInstall();
    const iosRef = useRef<HTMLDivElement>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const installLabel = useMemo(() => {
        if (isStandalone) return "Já instalado";
        if (isIos) return "Como instalar no iPhone";
        return "Instalar agora";
    }, [isIos, isStandalone]);

    const handleInstall = async () => {
        setNotice(null);
        if (isStandalone) {
            setNotice("O Tem Aki no Bairro já está instalado neste dispositivo.");
            return;
        }

        if (isIos) {
            iosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            setNotice("No iPhone, a instalação é manual pelo Safari. Veja o passo a passo abaixo.");
            return;
        }

        if (canPrompt) {
            const res = await promptInstall();
            if (res.outcome === "accepted") setNotice("Instalação iniciada. Se aparecer um aviso, confirme para concluir.");
            if (res.outcome === "dismissed") setNotice("Instalação cancelada. Você pode tentar novamente quando quiser.");
            return;
        }

        setNotice("Instalação não disponível agora. Use Chrome/Edge e procure por “Instalar app” ou “Adicionar à tela inicial”.");
    };

    const features = [
        { title: "Comércios locais", icon: Store, desc: "Encontre lojas, mercados e negócios do bairro." },
        { title: "Serviços", icon: Wrench, desc: "Mecânica, beleza, manutenção, informática e mais." },
        { title: "Escolas", icon: GraduationCap, desc: "Informações de escolas e educação." },
        { title: "Instituições públicas", icon: Landmark, desc: "Serviços e locais públicos importantes." },
        { title: "Instituições comunitárias", icon: Users, desc: "Associações e iniciativas locais." },
        { title: "Instituições religiosas", icon: Church, desc: "Igrejas e comunidades de fé." },
        { title: "Contato por WhatsApp", icon: MessageCircle, desc: "Fale direto com estabelecimentos e prestadores." },
        { title: "Localização e mapa", icon: MapPin, desc: "Veja onde fica e como chegar." },
    ];

    return (
        <div className="space-y-space-12">
            <section className="relative overflow-hidden rounded-radius-2xl border border-border-subtle bg-surface-card shadow-card">
                <div
                    className="absolute inset-0 opacity-25"
                    style={{
                        backgroundImage: `url(${heroBg})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-action-primary/20 via-surface-page/60 to-surface-page/90" />
                <div className="relative p-space-6 md:p-space-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-8 items-center">
                        <div className="space-y-space-6">
                            <div className="flex items-center gap-space-3">
                                <img src={logo} alt="Tem Aki no Bairro" className="h-14 w-auto max-w-[220px] object-contain" />
                            </div>
                            <div>
                                <h1 className="text-text-4xl md:text-text-5xl font-bold text-text-primary leading-tight">
                                    Baixe o Tem Aki no Bairro
                                </h1>
                                <p className="mt-space-3 text-text-lg text-text-secondary">
                                    Tenha os comércios, serviços e instituições do Nova Terra na palma da mão.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-space-3">
                                <Button className="h-12 px-6 shadow-button-primary" onClick={handleInstall} disabled={isStandalone}>
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    {installLabel}
                                </Button>
                                <Link to="/">
                                    <Button variant="secondary" className="h-12 px-6">
                                        <ExternalLink className="h-5 w-5 mr-2" />
                                        Abrir no navegador
                                    </Button>
                                </Link>
                            </div>
                            {notice && (
                                <Card className="border-border-subtle p-space-4 bg-surface-subtle/60">
                                    <div className="flex items-start gap-space-3">
                                        <BadgeCheck className="h-5 w-5 text-action-primary mt-0.5" />
                                        <div className="text-text-sm text-text-secondary">{notice}</div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div className="hidden lg:block">
                            <Card className="border-border-subtle p-space-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-text-lg font-bold text-text-primary">Instale como app (PWA)</div>
                                    <Smartphone className="h-5 w-5 text-action-primary" />
                                </div>
                                <div className="mt-space-4 grid grid-cols-2 gap-space-4">
                                    <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle/60 p-space-4">
                                        <div className="text-text-sm font-semibold text-text-primary">Acesso rápido</div>
                                        <div className="mt-space-1 text-text-xs text-text-muted">Ícone na tela inicial</div>
                                    </div>
                                    <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle/60 p-space-4">
                                        <div className="text-text-sm font-semibold text-text-primary">Experiência leve</div>
                                        <div className="mt-space-1 text-text-xs text-text-muted">Rápido e responsivo</div>
                                    </div>
                                    <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle/60 p-space-4">
                                        <div className="text-text-sm font-semibold text-text-primary">Notificações</div>
                                        <div className="mt-space-1 text-text-xs text-text-muted">Quando disponível</div>
                                    </div>
                                    <div className="rounded-radius-lg border border-border-subtle bg-surface-subtle/60 p-space-4">
                                        <div className="text-text-sm font-semibold text-text-primary">Atalho de busca</div>
                                        <div className="mt-space-1 text-text-xs text-text-muted">Encontre serviços</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-space-6">
                <div className="flex items-center gap-space-3">
                    <BookOpen className="h-6 w-6 text-action-primary" />
                    <h2 className="text-text-2xl font-bold text-text-primary">Como instalar</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
                    <Card className="border-border-subtle p-space-6">
                        <div className="flex items-center gap-space-3">
                            <Smartphone className="h-6 w-6 text-action-primary" />
                            <div className="text-text-lg font-bold text-text-primary">Android (Chrome/Edge)</div>
                        </div>
                        <ol className="mt-space-4 space-y-space-2 text-text-sm text-text-secondary list-decimal list-inside">
                            <li>Toque em “Instalar agora”, se aparecer.</li>
                            <li>Ou toque nos três pontinhos do navegador.</li>
                            <li>Escolha “Adicionar à tela inicial” ou “Instalar app”.</li>
                            <li>Confirme a instalação.</li>
                        </ol>
                    </Card>

                    <Card className="border-border-subtle p-space-6" ref={iosRef}>
                        <div className="flex items-center gap-space-3">
                            <Smartphone className="h-6 w-6 text-action-primary" />
                            <div className="text-text-lg font-bold text-text-primary">iPhone (Safari)</div>
                        </div>
                        <div className="mt-space-3 text-text-sm text-text-secondary">
                            No iPhone, a instalação é manual pelo Safari.
                        </div>
                        <ol className="mt-space-4 space-y-space-2 text-text-sm text-text-secondary list-decimal list-inside">
                            <li>Abra o site no Safari.</li>
                            <li>Toque no botão Compartilhar.</li>
                            <li>Escolha “Adicionar à Tela de Início”.</li>
                            <li>Toque em “Adicionar”.</li>
                        </ol>
                    </Card>

                    <Card className="border-border-subtle p-space-6">
                        <div className="flex items-center gap-space-3">
                            <Monitor className="h-6 w-6 text-action-primary" />
                            <div className="text-text-lg font-bold text-text-primary">Computador</div>
                        </div>
                        <ol className="mt-space-4 space-y-space-2 text-text-sm text-text-secondary list-decimal list-inside">
                            <li>Abra o site no Chrome ou Edge.</li>
                            <li>Clique no ícone de instalação na barra de endereço, se aparecer.</li>
                            <li>Ou use o site no navegador normalmente.</li>
                        </ol>
                    </Card>
                </div>
            </section>

            <section className="space-y-space-6">
                <div className="flex items-center gap-space-3">
                    <Compass className="h-6 w-6 text-action-primary" />
                    <h2 className="text-text-2xl font-bold text-text-primary">O que você encontra no app</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
                    {features.map((f) => {
                        const Icon = f.icon;
                        return (
                            <Card key={f.title} className="border-border-subtle p-space-5">
                                <div className="flex items-start gap-space-3">
                                    <div className="h-10 w-10 rounded-radius-lg bg-action-primary/10 flex items-center justify-center">
                                        <Icon className="h-5 w-5 text-action-primary" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-text-primary">{f.title}</div>
                                        <div className="mt-space-1 text-text-sm text-text-secondary">{f.desc}</div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
                <Card className="border-border-subtle p-space-6">
                    <div className="text-text-xl font-bold text-text-primary">Para moradores</div>
                    <ul className="mt-space-4 space-y-space-2 text-text-sm text-text-secondary list-disc list-inside">
                        <li>Buscar negócios do bairro</li>
                        <li>Encontrar telefone/WhatsApp</li>
                        <li>Ver endereço e informações</li>
                        <li>Avaliar estabelecimentos</li>
                        <li>Salvar favoritos</li>
                    </ul>
                </Card>
                <Card className="border-border-subtle p-space-6">
                    <div className="text-text-xl font-bold text-text-primary">Para comerciantes e prestadores</div>
                    <ul className="mt-space-4 space-y-space-2 text-text-sm text-text-secondary list-disc list-inside">
                        <li>Ter perfil gratuito no app</li>
                        <li>Aparecer nas buscas</li>
                        <li>Receber contatos pelo WhatsApp</li>
                        <li>Divulgar fotos, horários, endereço e serviços</li>
                        <li>Ter mais visibilidade na comunidade</li>
                    </ul>
                </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
                <Card className="border-border-subtle p-space-6">
                    <div className="flex items-center gap-space-3">
                        <QrCode className="h-6 w-6 text-action-primary" />
                        <div className="text-text-xl font-bold text-text-primary">QR Code</div>
                    </div>
                    <div className="mt-space-4 grid grid-cols-1 sm:grid-cols-2 gap-space-4 items-center">
                        <div className="rounded-radius-xl border border-dashed border-border-default bg-surface-subtle/40 p-space-6 flex items-center justify-center min-h-[180px]">
                            <div className="text-center">
                                <div className="text-text-sm font-semibold text-text-primary">Aponte a câmera do celular para o QR Code</div>
                                <div className="mt-space-2 text-text-xs text-text-muted">Placeholder para QR Code</div>
                            </div>
                        </div>
                        <div className="text-text-sm text-text-secondary">
                            <div className="font-semibold text-text-primary">Compartilhe</div>
                            <div className="mt-space-2">
                                Compartilhe este QR Code com vizinhos, clientes e comerciantes.
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-border-subtle p-space-6">
                    <div className="flex items-center gap-space-3">
                        <HelpCircle className="h-6 w-6 text-action-primary" />
                        <div className="text-text-xl font-bold text-text-primary">Dúvidas rápidas</div>
                    </div>
                    <div className="mt-space-4 space-y-space-3">
                        <details className="rounded-radius-lg border border-border-subtle bg-surface-subtle/40 p-space-4">
                            <summary className="cursor-pointer font-semibold text-text-primary">Preciso baixar pela Play Store?</summary>
                            <div className="mt-space-2 text-text-sm text-text-secondary">
                                Não. O app funciona como PWA e pode ser instalado pelo navegador.
                            </div>
                        </details>
                        <details className="rounded-radius-lg border border-border-subtle bg-surface-subtle/40 p-space-4">
                            <summary className="cursor-pointer font-semibold text-text-primary">Funciona no iPhone?</summary>
                            <div className="mt-space-2 text-text-sm text-text-secondary">
                                Sim, adicionando à tela de início pelo Safari.
                            </div>
                        </details>
                        <details className="rounded-radius-lg border border-border-subtle bg-surface-subtle/40 p-space-4">
                            <summary className="cursor-pointer font-semibold text-text-primary">Preciso pagar para usar?</summary>
                            <div className="mt-space-2 text-text-sm text-text-secondary">
                                Moradores usam gratuitamente.
                            </div>
                        </details>
                        <details className="rounded-radius-lg border border-border-subtle bg-surface-subtle/40 p-space-4">
                            <summary className="cursor-pointer font-semibold text-text-primary">Como cadastrar meu negócio?</summary>
                            <div className="mt-space-2 text-text-sm text-text-secondary">
                                Clique em “Fale Conosco” ou acesse a área de cadastro/orientação.
                            </div>
                        </details>
                        <details className="rounded-radius-lg border border-border-subtle bg-surface-subtle/40 p-space-4">
                            <summary className="cursor-pointer font-semibold text-text-primary">O app funciona sem internet?</summary>
                            <div className="mt-space-2 text-text-sm text-text-secondary">
                                Algumas partes podem carregar mais rápido após o primeiro acesso, mas a busca atualizada depende da internet.
                            </div>
                        </details>
                    </div>
                </Card>
            </section>

            <section className="rounded-radius-2xl border border-border-subtle bg-surface-card shadow-card p-space-6 md:p-space-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-6">
                    <div>
                        <div className="text-text-2xl md:text-text-3xl font-bold text-text-primary">Comece agora</div>
                        <div className="mt-space-2 text-text-sm text-text-secondary">
                            Instale o app, pesquise negócios ou fale com a equipe para cadastrar seu negócio.
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-space-3">
                        <Button className="h-12 px-6 shadow-button-primary" onClick={handleInstall} disabled={isStandalone}>
                            <DownloadIcon className="h-5 w-5 mr-2" />
                            Instalar o app
                        </Button>
                        <Link to="/directory">
                            <Button variant="secondary" className="h-12 px-6">
                                <Store className="h-5 w-5 mr-2" />
                                Buscar negócios
                            </Button>
                        </Link>
                        <a
                            href="https://wa.me/5511999999999?text=Olá,%20quero%20cadastrar%20meu%20negócio%20no%20Tem%20Aki%20no%20Bairro"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="ghost" className="h-12 px-6 border border-border-subtle">
                                <MessageCircle className="h-5 w-5 mr-2" />
                                Cadastrar meu negócio
                            </Button>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
