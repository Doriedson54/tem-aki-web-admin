# Tem Aki Web Admin

Sistema de administração web para gerenciar os negócios cadastrados no aplicativo "Tem Aki no Bairro".

## 🚀 Funcionalidades

- **Dashboard** com estatísticas e gráficos em tempo real
- **Gerenciamento de Negócios** (CRUD completo)
- **Sistema de Categorias** e subcategorias
- **Moderação e Aprovação** de negócios
- **Relatórios e Analytics**
- **Sistema de Autenticação** seguro
- **Upload de Imagens** com validação
- **Logs de Atividades** do sistema
- **Interface Responsiva** e moderna

## 📋 Pré-requisitos

- Node.js 16+ 
- NPM ou Yarn
- SQLite3

## 🔧 Instalação

1. **Clone o repositório ou navegue até a pasta do projeto:**
   ```bash
   cd "C:\Projetos\Aplicativos\Negócios do Bairro\web-admin"
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env` e ajuste as configurações conforme necessário
   - As configurações padrão já estão prontas para desenvolvimento

4. **Inicie o servidor:**
   ```bash
   # Desenvolvimento (com auto-reload)
   npm run dev
   
   # Produção
   npm start
   ```

5. **Acesse o sistema:**
   - URL: http://localhost:3000
   - Usuário padrão: `admin`
   - Senha padrão: `admin123`

## 🗂️ Estrutura do Projeto

```
web-admin/
├── app.js                 # Arquivo principal do servidor
├── package.json           # Dependências e scripts
├── .env                   # Configurações do ambiente
├── README.md              # Este arquivo
├── config/
│   └── database.js        # Configuração do banco de dados
├── middleware/
│   └── auth.js            # Middlewares de autenticação
├── routes/
│   ├── auth.js            # Rotas de autenticação
│   ├── dashboard.js       # Rotas do dashboard
│   ├── business.js        # Rotas de negócios
│   └── categories.js      # Rotas de categorias
├── views/
│   ├── layout.ejs         # Layout principal
│   ├── auth/
│   │   └── login.ejs      # Página de login
│   └── dashboard/
│       └── index.ejs      # Dashboard principal
├── public/
│   ├── css/               # Arquivos CSS customizados
│   ├── js/                # Scripts JavaScript
│   └── images/            # Imagens estáticas
└── uploads/               # Arquivos enviados pelos usuários
```

## 🔐 Segurança

- **Autenticação** com sessões seguras
- **Hash de senhas** com bcrypt
- **Proteção CSRF** implementada
- **Validação de uploads** de arquivos
- **Sanitização** de dados de entrada
- **Rate limiting** para prevenir ataques

## 📊 Banco de Dados

O sistema utiliza SQLite3 com as seguintes tabelas:

- **users** - Usuários administradores
- **categories** - Categorias de negócios
- **subcategories** - Subcategorias
- **businesses** - Negócios cadastrados
- **business_images** - Imagens dos negócios
- **activity_logs** - Logs de atividades

## 🛠️ Scripts Disponíveis

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Iniciar em modo produção
npm start

# Configuração inicial (futuro)
npm run setup

# Backup do banco de dados (futuro)
npm run backup

# Restaurar backup (futuro)
npm run restore
```

## 🎨 Interface

- **Framework CSS:** Bootstrap 5
- **Ícones:** Font Awesome 6
- **Gráficos:** Chart.js
- **Template Engine:** EJS
- **Design:** Responsivo e moderno

## 📱 Integração com o App Mobile

O sistema web está preparado para integração com o aplicativo mobile "Tem Aki no Bairro":

- **API REST** para sincronização de dados
- **Webhook endpoints** para notificações
- **Compartilhamento** do mesmo banco de dados

## 🔄 Fluxo de Trabalho

1. **Negócios** são cadastrados via app mobile
2. **Administradores** recebem notificações no painel web
3. **Moderação** é feita através da interface web
4. **Aprovação/Rejeição** é sincronizada com o app
5. **Relatórios** são gerados para análise

## 🚀 Deploy

### Desenvolvimento Local
```bash
npm run dev
```

### Produção
```bash
# Instalar dependências
npm install --production

# Configurar variáveis de ambiente
# Editar .env com configurações de produção

# Iniciar servidor
npm start
```

### Docker (Futuro)
```bash
# Build da imagem
docker build -t tem-aki-admin .

# Executar container
docker run -p 3000:3000 tem-aki-admin
```

## 📝 Logs

O sistema registra automaticamente:
- **Logins** e logouts
- **Ações de moderação**
- **Criação/edição** de dados
- **Erros** do sistema
- **Tentativas** de acesso não autorizado

## 🔧 Configurações

Principais configurações no arquivo `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DB_PATH=./tem_aki_admin.db

# Segurança
SESSION_SECRET=sua_chave_secreta_aqui
BCRYPT_ROUNDS=12

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para suporte técnico:
- **Email:** admin@temakinobairro.com.br
- **Website:** https://temakinobairro.com.br

---

**Desenvolvido para o projeto Tem Aki no Bairro** 🏪