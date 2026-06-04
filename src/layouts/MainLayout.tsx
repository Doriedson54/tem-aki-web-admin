import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Outlet } from "react-router-dom";

export function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-surface-page">
            <Header />
            <main className="flex-1 pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
