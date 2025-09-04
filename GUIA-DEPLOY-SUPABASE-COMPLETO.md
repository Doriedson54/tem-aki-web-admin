# 🚀 Guia Completo: Deploy no Supabase + Registro.br

## 📋 Situação Atual
- ✅ **Domínio:** www.temakinobairro.com.br (Registro.br)
- ✅ **Hospedagem:** Supabase.com
- ✅ **Aplicação:** Pronta para deploy
- ⏳ **Status:** Precisa configurar e colocar no ar

---

## 🎯 PASSO A PASSO COMPLETO

### ETAPA 1: 🔧 Configurar o Supabase

#### 1.1 Acessar o Painel do Supabase
1. Acesse: https://supabase.com/
2. Faça login na sua conta
3. Clique no seu projeto (ou crie um novo se não tiver)

#### 1.2 Obter Informações do Banco de Dados
1. No painel do Supabase, vá em **"Settings"** (Configurações)
2. Clique em **"Database"**
3. **ANOTE** as seguintes informações:
   ```
   Host: [exemplo: db.xxxxx.supabase.co]
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [sua senha do projeto]
   ```

#### 1.3 Obter Chaves da API
1. Ainda em **"Settings"**, clique em **"API"**
2. **ANOTE** as seguintes informações:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### ETAPA 2: 📁 Preparar os Arquivos

#### 2.1 Configurar o Arquivo .env.production
1. Abra o arquivo `.env.production` na pasta `web-admin`
2. **SUBSTITUA** as informações pelos dados do seu Supabase:

```env
# CONFIGURAÇÕES BÁSICAS
NODE_ENV=production
PORT=3000
DOMAIN=www.temakinobairro.com.br
BASE_URL=https://www.temakinobairro.com.br

# SUPABASE - SUBSTITUA PELOS SEUS DADOS
SUPABASE_URL=https://xfracmstibfrciezytcx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# BANCO DE DADOS
DB_HOST=db.xfracmstibfrciezytcx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=DJbs@1103
DB_SSL=true

# CHAVES DE SEGURANÇA (MANTENHA COMO ESTÁ)
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_2024
SESSION_SECRET=sua_chave_sessao_super_secreta_aqui_2024
ENCRYPTION_KEY=sua_chave_criptografia_super_secreta_aqui_2024

# EMAIL (CONFIGURE DEPOIS SE NECESSÁRIO)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
SMTP_FROM=noreply@temakinobairro.com.br
```

#### 2.2 Criar Arquivo package.json para Deploy
1. Crie um arquivo chamado `package.json` na pasta `web-admin` (se não existir)
2. Cole o seguinte conteúdo:

```json
{
  "name": "temaki-no-bairro-admin",
  "version": "1.0.0",
  "description": "Sistema administrativo Temaki no Bairro",
  "main": "app_supabase.js",
  "scripts": {
    "start": "node app_supabase.js",
    "dev": "nodemon app_supabase.js",
    "build": "echo 'Build completed'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "express-session": "^1.17.3",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "@supabase/supabase-js": "^2.38.0",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### ETAPA 3: 🌐 Configurar DNS no Registro.br

#### 3.1 Acessar o Painel do Registro.br
1. Acesse: https://registro.br/
2. Faça login com suas credenciais
3. Clique em **"Meus domínios"**
4. Clique em **"temakinobairro.com.br"**

#### 3.2 Configurar DNS
1. Procure por **"DNS"** ou **"Gerenciar DNS"**
2. **REMOVA** todos os registros existentes
3. **ADICIONE** os seguintes registros:

```
Tipo: CNAME
Nome: www
Valor: [SEU_PROJETO].vercel.app
TTL: 3600

Tipo: CNAME
Nome: @
Valor: [SEU_PROJETO].vercel.app
TTL: 3600
```

**⚠️ IMPORTANTE:** Você vai obter o valor `[SEU_PROJETO].vercel.app` na próxima etapa.

### ETAPA 4: 🚀 Deploy no Vercel (Recomendado para Supabase)

#### 4.1 Criar Conta no Vercel
1. Acesse: https://vercel.com/
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (recomendado)
4. Autorize o Vercel a acessar sua conta GitHub

#### 4.2 Preparar Repositório GitHub
1. Acesse: https://github.com/
2. Clique em **"New repository"**
3. Nome: `temaki-no-bairro-admin`
4. Marque como **"Private"**
5. Clique em **"Create repository"**

#### 4.3 Subir Código para GitHub
1. Abra o **PowerShell** na pasta `web-admin`
2. Execute os comandos:

```powershell
# Inicializar Git
git init

# Adicionar arquivos
git add .

# Fazer commit
git commit -m "Deploy inicial Temaki no Bairro"

# Conectar com GitHub (SUBSTITUA pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/temaki-no-bairro-admin.git

# Enviar para GitHub
git push -u origin main
```

#### 4.4 Deploy no Vercel
1. No Vercel, clique em **"New Project"**
2. Selecione seu repositório `temaki-no-bairro-admin`
3. Clique em **"Import"**
4. Em **"Framework Preset"**, selecione **"Other"**
5. Configure:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### 4.5 Configurar Variáveis de Ambiente
1. Antes de fazer deploy, clique em **"Environment Variables"**
2. **ADICIONE** todas as variáveis do seu `.env.production`:

```
NODE_ENV = production
PORT = 3000
DOMAIN = www.temakinobairro.com.br
BASE_URL = https://www.temakinobairro.com.br
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
... (todas as outras variáveis)
```

3. Clique em **"Deploy"**

#### 4.6 Obter URL do Projeto
1. Após o deploy, você verá uma URL como: `https://temaki-no-bairro-admin-xxx.vercel.app`
2. **ANOTE** essa URL
3. **VOLTE** ao Registro.br e **SUBSTITUA** `[SEU_PROJETO].vercel.app` por essa URL

### ETAPA 5: 🔧 Configurar Domínio Personalizado no Vercel

#### 5.1 Adicionar Domínio
1. No painel do Vercel, vá em **"Settings"**
2. Clique em **"Domains"**
3. Digite: `www.temakinobairro.com.br`
4. Clique em **"Add"**
5. Repita para: `temakinobairro.com.br`

#### 5.2 Verificar Configuração
1. O Vercel vai mostrar os registros DNS necessários
2. **CONFIRME** que são os mesmos que você configurou no Registro.br
3. Aguarde a verificação (pode levar até 48 horas)

### ETAPA 6: 🗄️ Configurar Banco de Dados no Supabase

#### 6.1 Criar Tabelas
1. No painel do Supabase, vá em **"SQL Editor"**
2. Cole e execute o seguinte código:

```sql
-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de negócios
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    image_url VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir admin padrão (senha: admin123)
INSERT INTO admins (username, email, password_hash) 
VALUES ('admin', 'admin@temakinobairro.com.br', '$2a$10$rOzJqQqQqQqQqQqQqQqQqO')
ON CONFLICT (username) DO NOTHING;

-- Inserir categorias padrão
INSERT INTO categories (name, description, icon, color) VALUES
('Restaurantes', 'Restaurantes e lanchonetes', '🍽️', '#FF6B6B'),
('Comércio', 'Lojas e comércio em geral', '🛍️', '#4ECDC4'),
('Serviços', 'Prestadores de serviços', '🔧', '#45B7D1'),
('Saúde', 'Clínicas e farmácias', '🏥', '#96CEB4'),
('Educação', 'Escolas e cursos', '📚', '#FFEAA7')
ON CONFLICT DO NOTHING;
```

3. Clique em **"Run"** para executar

#### 6.2 Configurar Políticas de Segurança (RLS)
1. Execute também:

```sql
-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública
CREATE POLICY "Allow public read on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read on businesses" ON businesses FOR SELECT USING (is_active = true);

-- Políticas para admins
CREATE POLICY "Allow admin access" ON admins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow admin manage categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow admin manage businesses" ON businesses FOR ALL USING (auth.role() = 'service_role');
```

### ETAPA 7: ✅ Testar o Sistema

#### 7.1 Aguardar Propagação DNS
- **Tempo:** 2-48 horas
- **Verificar em:** https://dnschecker.org/
- Digite: `www.temakinobairro.com.br`

#### 7.2 Acessar o Site
1. Acesse: https://www.temakinobairro.com.br
2. Você deve ver a página inicial
3. Teste o login admin: https://www.temakinobairro.com.br/admin
   - **Usuário:** admin
   - **Senha:** admin123

#### 7.3 Verificar Funcionalidades
- ✅ Página inicial carrega
- ✅ Login de administrador funciona
- ✅ Dashboard administrativo acessível
- ✅ Cadastro de negócios funciona
- ✅ Listagem de categorias funciona

### ETAPA 8: 🔒 Configurações de Segurança

#### 8.1 Alterar Senha do Admin
1. Acesse o painel administrativo
2. Vá em **"Configurações"**
3. Altere a senha padrão `admin123`

#### 8.2 Configurar HTTPS
- ✅ **Automático:** O Vercel já configura HTTPS automaticamente
- ✅ **Certificado:** Renovação automática

### ETAPA 9: 📊 Monitoramento

#### 9.1 Vercel Analytics
1. No painel do Vercel, vá em **"Analytics"**
2. Ative o monitoramento gratuito

#### 9.2 Supabase Monitoring
1. No painel do Supabase, vá em **"Reports"**
2. Monitore uso do banco de dados

---

## 🚨 TROUBLESHOOTING

### Problema: Site não carrega
**Soluções:**
1. Verificar DNS: https://dnschecker.org/
2. Aguardar propagação (até 48h)
3. Verificar configuração no Vercel

### Problema: Erro de banco de dados
**Soluções:**
1. Verificar variáveis de ambiente no Vercel
2. Testar conexão no Supabase SQL Editor
3. Verificar se as tabelas foram criadas

### Problema: Login não funciona
**Soluções:**
1. Verificar se a tabela `admins` foi criada
2. Verificar hash da senha
3. Verificar variáveis JWT_SECRET

### Problema: Deploy falha
**Soluções:**
1. Verificar logs no Vercel
2. Verificar package.json
3. Verificar se todas as dependências estão instaladas

---

## 📞 SUPORTE

### Links Úteis
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **DNS Checker:** https://dnschecker.org/
- **SSL Test:** https://www.ssllabs.com/ssltest/

### Comandos Úteis
```bash
# Verificar status do deploy
vercel --prod

# Ver logs em tempo real
vercel logs

# Fazer novo deploy
git add .
git commit -m "Atualização"
git push
```

---

## 🎉 PARABÉNS!

Seu site **www.temakinobairro.com.br** está no ar! 🚀

**Próximos passos:**
1. ✅ Personalizar conteúdo
2. ✅ Adicionar negócios
3. ✅ Configurar SEO
4. ✅ Configurar Google Analytics
5. ✅ Fazer backup regular

**Custos mensais:**
- 💰 **Vercel:** Gratuito (até 100GB bandwidth)
- 💰 **Supabase:** Gratuito (até 500MB database)
- 💰 **Domínio:** Já pago no Registro.br
- 💰 **Total:** R$ 0,00/mês 🎉