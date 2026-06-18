import { Button } from "../ui/Button";
import { Menu, X, User as UserIcon, LogOut, Heart, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo-transparent.png";

type NavigatorStandalone = Navigator & { standalone?: boolean };

export function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = () => {
        logout();
        setIsProfileOpen(false);
        navigate("/login");
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const updateStandalone = () => {
            const standalone =
                window.matchMedia?.("(display-mode: standalone)")?.matches ||
                (window.navigator as NavigatorStandalone)?.standalone === true;
            setIsStandalone(Boolean(standalone));
        };

        updateStandalone();

        const onAppInstalled = () => {
            updateStandalone();
        };

        window.addEventListener("appinstalled", onAppInstalled);
        window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", updateStandalone);

        return () => {
            window.removeEventListener("appinstalled", onAppInstalled);
            window.matchMedia?.("(display-mode: standalone)")?.removeEventListener?.("change", updateStandalone);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-surface-section border-b border-border-default shadow-sm text-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 h-full text-action-primary hover:opacity-90 transition-opacity">
                    <img src={logo} alt="Tem Aki no Bairro" className="h-10 md:h-11 w-auto max-w-[210px] object-contain" />
                </Link>

                <nav className="hidden md:flex items-center gap-space-6">
                    <Link to="/" className="text-text-secondary hover:text-action-primary font-medium transition-colors">Início</Link>
                    <Link to="/directory" className="text-text-secondary hover:text-action-primary font-medium transition-colors">Buscar Negócios</Link>
                    <Link to="/map" className="text-text-secondary hover:text-action-primary font-medium transition-colors">Mapa</Link>
                    <Link to="/about" className="text-text-secondary hover:text-action-primary font-medium transition-colors">Sobre</Link>
                    {!isStandalone && (
                        <Link to="/download">
                            <Button size="sm" variant="ghost" className="text-action-primary hover:bg-surface-subtle font-bold border border-border-subtle">
                                Instalar
                            </Button>
                        </Link>
                    )}

                    {!user ? (
                        <>
                            <a href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20Tem%20Aki%20no%20Bairro" target="_blank" rel="noopener noreferrer">
                                <Button size="sm">Fale Conosco</Button>
                            </a>
                            <Link to="/login">
                                <Button variant="ghost" size="sm" className="text-action-primary hover:bg-surface-subtle font-bold border border-border-subtle">Área Restrita</Button>
                            </Link>
                        </>
                    ) : (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 focus:outline-none hover:bg-gray-50 p-1.5 rounded-full transition-colors border border-transparent hover:border-gray-200"
                            >
                                <img
                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username || user.name || 'User'}&background=random`}
                                    alt={user.username || user.name || 'User'}
                                    className="h-9 w-9 rounded-full object-cover border border-gray-200"
                                />
                                <span className="text-text-sm font-medium text-text-secondary max-w-[100px] truncate">{(user.username || user.name || 'User').split(' ')[0]}</span>
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-space-2 w-56 bg-surface-card rounded-radius-xl shadow-lg border border-border-subtle py-space-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-space-4 py-space-2 border-b border-surface-subtle mb-space-1">
                                        <p className="text-text-sm font-bold text-text-primary">{user.username || user.name || 'User'}</p>
                                        <p className="text-text-xs text-text-muted truncate">{user.email}</p>
                                    </div>

                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="flex items-center gap-space-2 px-space-4 py-space-2 text-text-sm text-text-secondary hover:bg-surface-subtle hover:text-action-primary" onClick={() => setIsProfileOpen(false)}>
                                            <LayoutDashboard className="h-space-4 w-space-4" /> Painel Admin
                                        </Link>
                                    )}

                                    <Link to="/profile" className="flex items-center gap-space-2 px-space-4 py-space-2 text-text-sm text-text-secondary hover:bg-surface-subtle hover:text-action-primary" onClick={() => setIsProfileOpen(false)}>
                                        <UserIcon className="h-space-4 w-space-4" /> Meu Perfil
                                    </Link>
                                    <Link to="/favorites" className="flex items-center gap-space-2 px-space-4 py-space-2 text-text-sm text-text-secondary hover:bg-surface-subtle hover:text-action-primary" onClick={() => setIsProfileOpen(false)}>
                                        <Heart className="h-space-4 w-space-4" /> Meus Favoritos
                                    </Link>

                                    <div className="border-t border-surface-subtle mt-space-1 pt-space-1">
                                        <Link
                                            to="/owner/dashboard"
                                            className="flex items-center gap-space-2 px-space-4 py-space-2 text-text-sm text-text-secondary hover:bg-surface-subtle hover:text-action-primary"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <LayoutDashboard className="h-space-4 w-space-4" /> Meus Negócios
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-space-2 px-space-4 py-space-2 text-text-sm text-status-error hover:bg-surface-subtle"
                                        >
                                            <LogOut className="h-space-4 w-space-4" /> Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                <button className="md:hidden text-gray-700 hover:text-blue-600" onClick={toggleMenu}>
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-surface-card border-b border-border-default shadow-lg p-space-4 flex flex-col gap-space-4 animate-in slide-in-from-top-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
                    {!isStandalone && (
                        <Link to="/download" onClick={toggleMenu}>
                            <Button className="w-full shadow-button-primary">
                                Instalar no celular
                            </Button>
                        </Link>
                    )}
                    {user && (
                        <div className="flex items-center gap-space-3 p-space-3 bg-surface-subtle rounded-radius-lg mb-space-2">
                            <img
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username || user.name || 'User'}&background=random`}
                                alt={user.username || user.name || 'User'}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-bold text-text-primary">{user.username || user.name || 'User'}</p>
                                <p className="text-text-xs text-text-muted">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <Link to="/" className="text-text-secondary hover:text-action-primary font-medium p-space-2 border-b border-surface-subtle" onClick={toggleMenu}>Início</Link>
                    <Link to="/directory" className="text-text-secondary hover:text-action-primary font-medium p-space-2 border-b border-surface-subtle" onClick={toggleMenu}>Buscar Negócios</Link>

                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="flex items-center gap-space-2 text-text-secondary hover:text-action-primary font-medium p-space-2" onClick={toggleMenu}>
                                    <LayoutDashboard className="h-space-4 w-space-4" /> Painel Admin
                                </Link>
                            )}
                            <Link to="/profile" className="flex items-center gap-space-2 text-text-secondary hover:text-action-primary font-medium p-space-2" onClick={toggleMenu}>
                                <UserIcon className="h-space-4 w-space-4" /> Meu Perfil
                            </Link>
                            <Link to="/favorites" className="flex items-center gap-space-2 text-text-secondary hover:text-action-primary font-medium p-space-2" onClick={toggleMenu}>
                                <Heart className="h-space-4 w-space-4" /> Meus Favoritos
                            </Link>
                            <Link to="/owner/dashboard" className="flex items-center gap-space-2 text-text-secondary hover:text-action-primary font-medium p-space-2" onClick={toggleMenu}>
                                <LayoutDashboard className="h-space-4 w-space-4" /> Meus Negócios
                            </Link>
                            <button
                                onClick={() => { handleLogout(); toggleMenu(); }}
                                className="flex items-center gap-space-2 text-status-error hover:text-red-700 font-medium p-space-2 mt-space-2"
                            >
                                <LogOut className="h-space-4 w-space-4" /> Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20Tem%20Aki%20no%20Bairro" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-action-primary font-medium p-space-2" onClick={toggleMenu}>
                                Fale Conosco
                            </a>
                            <Link to="/login" onClick={toggleMenu}>
                                <Button className="w-full">Entrar / Cadastrar</Button>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
