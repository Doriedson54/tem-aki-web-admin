# Negócios do Bairro

Sistema completo para conectar negócios locais com a comunidade, desenvolvido com React Native (Expo), Node.js e painel administrativo web.

## 📱 Funcionalidades

### Aplicativo Móvel
- **Offline-First**: Funciona sem internet com sincronização automática
- **Cache Inteligente**: Armazenamento local otimizado
- **Busca Avançada**: Encontre negócios por categoria, localização e serviços
- **Perfis Completos**: Informações detalhadas dos estabelecimentos
- **Interface Intuitiva**: Design moderno e responsivo

### Painel Administrativo Web
- **Gestão de Negócios**: CRUD completo de estabelecimentos
- **Categorização**: Organização por categorias e subcategorias
- **Relatórios**: Analytics e estatísticas de uso
- **Autenticação Segura**: Sistema de login protegido
- **Interface Responsiva**: Acesso via desktop e mobile

### Backend API
- **RESTful API**: Endpoints padronizados
- **Segurança**: Rate limiting, CORS, validações
- **Performance**: Cache e otimizações
- **Monitoramento**: Health checks e logs

## 🚀 Tecnologias

- **Frontend Mobile**: React Native + Expo
- **Frontend Web**: Node.js + EJS + Bootstrap
- **Backend**: Node.js + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Docker + Docker Compose
- **Cache**: AsyncStorage (mobile) + Memory Cache (backend)

## 📋 Pré-requisitos

- Node.js 18+
- npm 8+
- Docker e Docker Compose (para produção)
- Expo CLI (para desenvolvimento mobile)

## 🛠️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd negocios-do-bairro
```

### 2. Configuração de Ambiente

#### Backend
```bash
cd backend
cp .env.example .env
# Configure as variáveis de ambiente
npm install
```

#### Web Admin
```bash
cd web-admin
cp .env.example .env
# Configure as variáveis de ambiente
npm install
```

#### Aplicativo Móvel
```bash
# Na raiz do projeto
cp .env.example .env
# Configure as variáveis de ambiente
npm install
```

### 3. Desenvolvimento

#### Iniciar Backend
```bash
cd backend
npm run dev
```

#### Iniciar Web Admin
```bash
cd web-admin
npm run dev
```

#### Iniciar Aplicativo Móvel
```bash
# Na raiz do projeto
npm start
```

## 🐳 Deploy com Docker

### Produção Completa
```bash
# Configure os arquivos .env.production
./deploy.sh
```

### Serviços Individuais
```bash
# Backend
cd backend
docker build -t negocios-backend .
docker run -p 3000:3000 negocios-backend

# Web Admin
cd web-admin
docker build -t negocios-admin .
docker run -p 3001:3001 negocios-admin
```

## 📱 Build do Aplicativo Móvel

### Preview Build
```bash
npm run build:preview
```

### Production Build
```bash
npm run build:production
```

### Publicar nas Lojas
```bash
# Android
npm run submit:android

# iOS
npm run submit:ios
```

## 🔧 Configuração de Produção

### Variáveis de Ambiente Obrigatórias

#### Backend (.env.production)
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=your-database-url
```

#### Web Admin (.env.production)
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
```

#### Mobile (.env.production)
```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

## 📊 Monitoramento

### Health Checks
- Backend: `http://localhost:3000/health`
- Web Admin: `http://localhost:3001/health`

### Logs
```bash
# Docker logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f web-admin
```

## 🔒 Segurança

- **HTTPS**: Configuração SSL/TLS
- **Rate Limiting**: Proteção contra ataques
- **CORS**: Controle de origem
- **Helmet**: Headers de segurança
- **Validação**: Sanitização de dados
- **Autenticação**: JWT tokens

## 📈 Performance

- **Cache**: Múltiplas camadas de cache
- **Compressão**: Gzip para produção
- **Otimização**: Bundle splitting
- **CDN**: Assets estáticos
- **Database**: Índices otimizados

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Web Admin
cd web-admin
npm test

# Mobile
npm test
```

## 📚 Documentação Adicional

- [Guia de Deploy](./docs/deploy.md)
- [API Documentation](./docs/api.md)
- [Configuração de Domínio](./web-admin/DOMAIN_SETUP_GUIDE.md)
- [Configuração Vercel](./web-admin/VERCEL_SETUP.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- Email: suporte@negociosdobairro.com
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🎯 Roadmap

- [ ] Notificações push
- [ ] Geolocalização avançada
- [ ] Sistema de avaliações
- [ ] Chat entre usuários
- [ ] Marketplace integrado
- [ ] Analytics avançados

---

Desenvolvido com ❤️ para fortalecer a economia local.