import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Home } from "./pages/Home";
import { Directory } from "./pages/Directory";
import { Login } from "./pages/Login";
import { About } from "./pages/About";
import { BusinessDetails } from "./pages/BusinessDetails";
import { Download } from "./pages/Download";
import { AdminLayout } from "./layouts/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { BusinessList } from "./pages/admin/BusinessList";
import { BusinessGallery } from "./pages/admin/BusinessGallery";
import { CategoryList } from "./pages/admin/CategoryList";
import { SubcategoryList } from "./pages/admin/SubcategoryList";
import { ReviewList } from "./pages/admin/ReviewList";
import { BusinessForm } from "./pages/admin/BusinessForm";
import { MyFavorites } from "./pages/MyFavorites";
import { Profile } from "./pages/Profile";
import { Geolocation } from "./pages/Geolocation";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { Card } from "./components/ui/Card";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash?.trim();
    if (hash && hash.startsWith("#")) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [location.key, location.hash]);

  return null;
}

function StaticTextPage({ title, content }: { title: string; content: string }) {
  return (
    <div className="container mx-auto px-space-4 py-space-12">
      <h1 className="text-text-3xl font-bold text-text-primary mb-space-6">{title}</h1>
      <Card className="border-border-subtle">
        <div className="whitespace-pre-wrap text-text-secondary leading-relaxed">{content}</div>
      </Card>
    </div>
  );
}

function DeveloperContactsPage() {
  return (
    <div className="container mx-auto px-space-4 py-space-12">
      <h1 className="text-text-3xl font-bold text-text-primary mb-space-6">Contatos do Desenvolvedor</h1>
      <Card className="border-border-subtle">
        <div className="space-y-space-4">
          <div className="text-text-xl font-bold text-text-primary">Doriedson Serra</div>
          <div className="space-y-space-2">
            <div className="text-text-sm text-text-muted font-semibold">Email</div>
            <a className="text-action-primary hover:underline font-semibold" href="mailto:dsdodo18@hotmail.com">
              dsdodo18@hotmail.com
            </a>
          </div>
          <div className="space-y-space-2">
            <div className="text-text-sm text-text-muted font-semibold">Telefone</div>
            <a className="text-action-primary hover:underline font-semibold" href="tel:+5598999345232">
              (98) 99934-5232
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AppRoutes() {
  const updatedAt = new Date().toLocaleDateString("pt-BR");

  const privacyPolicy = `POLÍTICA DE PRIVACIDADE
Tem Aki no Bairro

Última atualização: ${updatedAt}

Este sistema utiliza Supabase para autenticação e persistência de dados do catálogo (categorias, negócios, favoritos e leads).
Os dados são utilizados apenas para fornecer as funcionalidades do sistema.`;

  const termsOfUse = `TERMOS DE USO
Tem Aki no Bairro

Última atualização: ${updatedAt}

Ao utilizar o sistema, você concorda em fornecer dados verdadeiros e respeitar as regras de uso do catálogo.`;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="directory" element={<Directory />} />
        <Route path="business/:id" element={<BusinessDetails />} />
        <Route path="map" element={<Geolocation />} />
        <Route path="about" element={<About />} />
        <Route path="download" element={<Download />} />
        <Route path="instalar" element={<Download />} />
        <Route path="login" element={<Login />} />
        <Route path="favorites" element={<PrivateRoute><MyFavorites /></PrivateRoute>} />
        <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="owner/dashboard" element={<PrivateRoute><OwnerDashboard /></PrivateRoute>} />
        <Route path="developer-contacts" element={<DeveloperContactsPage />} />
        <Route path="privacy-policy" element={<StaticTextPage title="Política de Privacidade" content={privacyPolicy} />} />
        <Route path="politica-de-privacidade" element={<StaticTextPage title="Política de Privacidade" content={privacyPolicy} />} />
        <Route path="terms-of-use" element={<StaticTextPage title="Termos de Uso" content={termsOfUse} />} />
      </Route>

      <Route path="admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="businesses" element={<BusinessList />} />
        <Route path="businesses/new" element={<BusinessForm />} />
        <Route path="businesses/edit/:id" element={<BusinessForm />} />
        <Route path="businesses/gallery/:id" element={<BusinessGallery />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="subcategories" element={<SubcategoryList />} />
        <Route path="reviews" element={<ReviewList />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
