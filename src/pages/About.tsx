import { Target, Users, Rocket, MapPin, Store } from "lucide-react";
import heroBg from "../assets/hero-bg.jpg";

export function About() {
    return (
        <div className="flex flex-col gap-space-12 pb-space-16">
            <section className="relative py-space-16 text-text-on-brand overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={heroBg} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2b1a12]/90 via-[#3a2419]/80 to-black/80"></div>
                <div className="container mx-auto px-space-4 relative z-10 text-center">
                    <h1 className="text-text-4xl md:text-text-5xl font-bold mb-space-4 drop-shadow-md">
                        Sobre o Aplicativo
                    </h1>
                    <p className="text-text-lg md:text-text-xl opacity-90 max-w-2xl mx-auto">
                        Conectando moradores, comerciantes e serviços em um único ecossistema digital.
                    </p>
                </div>
            </section>

            <section className="container mx-auto px-space-4">
                <div className="max-w-4xl mx-auto text-center md:text-left">
                    <h2 className="text-text-3xl font-bold text-text-primary mb-space-6 text-center">
                        O que é o Tem Aki no Bairro?
                    </h2>
                    <p className="text-text-base text-text-secondary leading-relaxed mb-space-6 text-justify">
                        O <strong className="text-text-primary">Tem Aki no Bairro</strong> é uma plataforma digital criada para conectar moradores, comerciantes e prestadores de serviço dentro de uma mesma região. Seu principal objetivo é facilitar a busca por produtos e serviços locais, valorizando o comércio do bairro e promovendo praticidade no dia a dia da comunidade.
                    </p>
                    <p className="text-text-base text-text-secondary leading-relaxed text-justify">
                        Através do aplicativo, os usuários podem localizar empresas por cidade, bairro e até rua, visualizar informações detalhadas, entrar em contato rapidamente e descobrir o que está disponível perto de onde estão. Já os empreendedores locais ganham um espaço estratégico para divulgar seus negócios, ampliar sua visibilidade e atrair novos clientes de forma simples e acessível.
                    </p>
                </div>
            </section>

            <section className="bg-surface-section py-space-12">
                <div className="container mx-auto px-space-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-8">
                        <div className="bg-surface-card p-space-8 rounded-radius-xl shadow-md flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                            <div className="p-space-4 bg-surface-subtle rounded-full mb-space-4 text-action-primary">
                                <Target className="h-space-8 w-space-8" />
                            </div>
                            <h3 className="text-text-xl font-bold text-text-primary mb-space-2">Objetivo</h3>
                            <p className="text-text-secondary text-text-sm">
                                Fortalecer a economia local, aproximar consumidores e comerciantes e tornar mais fácil encontrar “o que tem aqui no bairro”.
                            </p>
                        </div>
                        <div className="bg-surface-card p-space-8 rounded-radius-xl shadow-md flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                            <div className="p-space-4 bg-status-success/10 rounded-full mb-space-4 text-status-success">
                                <Users className="h-space-8 w-space-8" />
                            </div>
                            <h3 className="text-text-xl font-bold text-text-primary mb-space-2">Público-Alvo</h3>
                            <ul className="text-text-secondary text-text-sm list-none space-y-space-2">
                                <li>Moradores que buscam praticidade</li>
                                <li>Pequenos e médios empreendedores</li>
                                <li>Prestadores de serviço locais</li>
                            </ul>
                        </div>
                        <div className="bg-surface-card p-space-8 rounded-radius-xl shadow-md flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                            <div className="p-space-4 bg-action-primary/10 rounded-full mb-space-4 text-action-primary">
                                <Rocket className="h-space-8 w-space-8" />
                            </div>
                            <h3 className="text-text-xl font-bold text-text-primary mb-space-2">Missão</h3>
                            <p className="text-text-secondary text-text-sm">
                                Transformar o bairro em um verdadeiro ecossistema digital, conectando oportunidades e fortalecendo relações locais.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-space-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-space-8">
                    <div className="flex-1">
                        <h2 className="text-text-3xl font-bold text-text-primary mb-space-4">Como funciona?</h2>
                        <p className="text-text-secondary leading-relaxed mb-space-4">
                            O aplicativo funciona como um catálogo digital inteligente, organizado por categorias e localização, permitindo pesquisas rápidas e direcionadas.
                        </p>
                        <div className="flex items-start gap-3 mb-3">
                            <MapPin className="text-action-primary mt-1 shrink-0" />
                            <span className="text-text-secondary">Localize empresas por cidade, bairro e rua.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Store className="text-action-primary mt-1 shrink-0" />
                            <span className="text-text-secondary">Área administrativa para gerenciamento completo dos cadastros.</span>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="bg-surface-subtle p-space-8 rounded-radius-2xl border border-border-default shadow-sm w-full max-w-sm text-center">
                            <h4 className="font-bold text-text-primary text-text-lg mb-2">Conectividade Local</h4>
                            <p className="text-text-muted text-text-sm">Uma rede viva de negócios e vizinhos.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
