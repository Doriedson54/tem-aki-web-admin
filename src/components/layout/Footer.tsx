import { Instagram, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer className="bg-action-strong text-text-on-dark pt-space-12 pb-space-8">
            <div className="container mx-auto px-space-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-space-8 mb-space-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-text-2xl font-bold text-white mb-space-4">Tem Aki no Bairro</h3>
                        <p className="text-text-muted max-w-sm">
                            Conectando você aos melhores negócios, serviços e oportunidades do seu bairro. Valorize o comércio local.
                        </p>
                        <div className="flex gap-space-4 mt-space-4">
                            <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-space-4">Navegação</h4>
                        <ul className="space-y-space-2">
                            <li><Link to="/" className="text-text-muted hover:text-white transition-colors">Início</Link></li>
                            <li><Link to="/directory" className="text-text-muted hover:text-white transition-colors">Categorias</Link></li>
                            <li><Link to="/admin" className="text-text-muted hover:text-white transition-colors">Cadastrar Empresa</Link></li>
                        </ul>

                        <h4 className="font-semibold text-white mt-space-6 mb-space-4">Informações</h4>
                        <ul className="space-y-space-2">
                            <li><Link to="/politica-de-privacidade" className="text-text-muted hover:text-white transition-colors">Política de Privacidade</Link></li>
                            <li><Link to="/terms-of-use" className="text-text-muted hover:text-white transition-colors">Termos de Uso</Link></li>
                            <li><Link to="/about" className="text-text-muted hover:text-white transition-colors">Sobre o Aplicativo</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-space-4">Contatos do Desenvolvedor</h4>
                        <ul className="space-y-space-2">
                            <li className="text-text-muted font-semibold">Doriedson Serra</li>
                            <li>
                                <a className="text-text-muted hover:text-white transition-colors" href="mailto:dsdodo18@hotmail.com">
                                    dsdodo18@hotmail.com
                                </a>
                            </li>
                            <li>
                                <a className="text-text-muted hover:text-white transition-colors" href="tel:+5598999345232">
                                    (98) 99934-5232
                                </a>
                            </li>
                            <li className="pt-space-2">
                                <Link to="/developer-contacts" className="text-text-muted hover:text-white transition-colors">
                                    Ver detalhes
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-space-8 text-center text-text-muted text-text-sm">
                    &copy; {new Date().getFullYear()} Tem Aki no Bairro. Todos os direitos reservados.
                </div>
            </div>
        </footer>
    );
}
