import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, Grid, MessageSquare, LogOut, Menu, X, ListTree } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";

export function AdminLayout() {
    const { pathname } = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/businesses", label: "Negócios", icon: Store },
        { path: "/admin/categories", label: "Categorias", icon: Grid },
        { path: "/admin/subcategories", label: "Subcategorias", icon: ListTree },
        { path: "/admin/reviews", label: "Avaliações", icon: MessageSquare },
    ];

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="flex h-screen bg-gray-100">
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleMenu}></div>
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <Link to="/" className="text-xl font-bold text-action-primary">Tem Aki Admin</Link>
                        <button onClick={toggleMenu} className="md:hidden text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.path === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? "bg-action-primary/10 text-action-primary font-medium"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
                            onClick={() => {
                                localStorage.removeItem('tem-aki-token');
                                window.location.href = '/login';
                            }}
                        >
                            <LogOut className="h-5 w-5" />
                            Sair
                        </Button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <header className="md:hidden bg-white shadow-sm p-4 flex items-center gap-4">
                    <button onClick={toggleMenu} className="text-gray-500">
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-semibold text-gray-900">Painel Administrativo</span>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
