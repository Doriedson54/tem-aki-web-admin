import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Link } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Home } from "./pages/Home";
import { Directory } from "./pages/Directory";
import { Login } from "./pages/Login";
import { About } from "./pages/About";
import { BusinessDetails } from "./pages/BusinessDetails";
import { Download } from "./pages/Download";
import { AppDirectory } from "./pages/AppDirectory";
import { AppBusinessDetails } from "./pages/AppBusinessDetails";
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
import logo from "./assets/logo.jpg";

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

function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] pointer-events-none">
      <div className="mx-auto max-w-2xl rounded-radius-xl border border-amber-300 bg-amber-50 px-space-4 py-space-3 text-text-sm text-amber-900 shadow-lg">
        Você está sem internet. O aplicativo continua disponível no modo offline, mas buscas e dados em tempo real podem não carregar até a conexão voltar.
      </div>
    </div>
  );
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

function UserAppLayout() {
  return (
    <div className="min-h-[100dvh] bg-surface-page">
      <header className="sticky top-0 z-50 bg-surface-section border-b border-border-default shadow-sm">
        <div className="container mx-auto px-space-4 h-14 flex items-center">
          <Link to="/app" className="flex items-center gap-space-3">
            <img src={logo} alt="Tem Aki no Bairro" className="h-9 w-9 rounded-radius-lg border border-border-subtle object-cover bg-surface-card" />
            <div className="leading-tight">
              <div className="text-text-sm font-bold text-text-primary">Tem Aki no Bairro</div>
              <div className="text-text-xs text-text-muted">Consulta rápida</div>
            </div>
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  const updatedAt = new Date().toLocaleDateString("pt-BR");

  const privacyPolicy = `POLÍTICA DE PRIVACIDADE
Tem Aki no Bairro

Última atualização: ${updatedAt}

1. Introdução

O Tem Aki no Bairro valoriza a privacidade dos usuários e trata os dados pessoais com responsabilidade, transparência e respeito à legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).

Esta Política de Privacidade explica como os dados são coletados, utilizados, armazenados e protegidos ao utilizar a plataforma Tem Aki no Bairro, incluindo o site, o aplicativo instalado como PWA e áreas de cadastro e autenticação.

2. Dados coletados

Podemos coletar e tratar os seguintes dados, conforme a utilização da plataforma:

- Nome
- E-mail
- Telefone
- Dados de negócios cadastrados
- Informações fornecidas voluntariamente pelo usuário

Os dados de negócios cadastrados podem incluir, por exemplo, nome do estabelecimento, descrição, endereço, categoria, subcategoria, horário de funcionamento, meios de contato, imagens, redes sociais e outras informações inseridas pelo próprio usuário responsável pelo cadastro.

3. Finalidade do uso dos dados

Os dados coletados são utilizados para as seguintes finalidades:

- Autenticação de usuários e acesso a áreas restritas
- Cadastro de empresas, comércios, serviços e instituições na plataforma
- Exibição de informações públicas para consulta pelos moradores e visitantes
- Contato entre usuários e negócios, incluindo acesso a telefone, WhatsApp, endereço e outros meios de contato disponibilizados
- Melhoria da plataforma, de suas funcionalidades, desempenho, organização das informações e experiência de uso

4. Compartilhamento de dados

O Tem Aki no Bairro não comercializa dados pessoais dos usuários.

O compartilhamento de dados ocorre apenas quando necessário para o funcionamento do sistema, hospedagem, autenticação, armazenamento ou prestação dos serviços oferecidos pela própria plataforma, sempre dentro de limites compatíveis com a finalidade do serviço.

Informações de negócios cadastrados podem ser exibidas publicamente quando essa for a finalidade natural do serviço, permitindo que moradores encontrem estabelecimentos, serviços e instituições locais.

5. Armazenamento e segurança

Os dados são armazenados com utilização do Supabase, plataforma empregada para autenticação, banco de dados e recursos relacionados ao funcionamento do sistema.

Adotamos medidas razoáveis de segurança, administrativas e técnicas, para proteger os dados contra acesso não autorizado, uso indevido, alteração, divulgação ou destruição indevida. Ainda assim, nenhum sistema é totalmente isento de riscos, razão pela qual recomendamos que os usuários também adotem boas práticas de segurança.

6. Direitos do usuário

Nos termos da LGPD, o usuário pode solicitar, observadas as obrigações legais e regulatórias aplicáveis:

- Atualização de seus dados
- Correção de dados incompletos, inexatos ou desatualizados
- Exclusão de dados pessoais, quando cabível

Solicitações relacionadas aos dados podem ser feitas pelos canais de contato informados nesta política.

7. Cookies e tecnologias semelhantes

O Tem Aki no Bairro pode utilizar cookies e tecnologias semelhantes para autenticação, manutenção de sessão, funcionamento do sistema, melhoria de desempenho e recursos essenciais da plataforma.

Esses recursos ajudam a reconhecer sessões ativas, manter preferências básicas de navegação e garantir o funcionamento adequado de áreas restritas e funcionalidades do serviço.

8. Contato

Para dúvidas, solicitações relacionadas à privacidade ou exercício de direitos previstos na LGPD, entre em contato:

Nome: Doriedson Serra
E-mail: dsdodo18@hotmail.com
Telefone: (98) 99934-5232

9. Atualização da política

Esta Política de Privacidade pode ser alterada periodicamente para refletir melhorias da plataforma, mudanças operacionais, atualizações legais ou regulatórias. Recomendamos a consulta periódica desta página para ciência da versão mais atual.`;

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

      <Route path="app" element={<UserAppLayout />}>
        <Route index element={<AppDirectory />} />
        <Route path="business/:id" element={<AppBusinessDetails />} />
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
        <OfflineNotice />
        <ScrollToTop />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
