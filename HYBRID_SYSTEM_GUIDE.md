# 🔄 Guia do Sistema Híbrido SQLite/Supabase

## 📋 Visão Geral

O painel administrativo "Tem Aki no Bairro" agora suporta **dois backends diferentes**:

- **SQLite** (v1.0.0) - Banco local, ideal para desenvolvimento e pequenas instalações
- **Supabase** (v2.0.0) - Banco na nuvem, ideal para produção e escalabilidade

O sistema detecta automaticamente qual versão usar baseado na configuração `DATABASE_TYPE` no arquivo `.env`.

## 🚀 Como Usar

### Execução Automática (Recomendado)

```bash
# Inicia automaticamente baseado na configuração DATABASE_TYPE
npm start
npm run dev
```

### Execução Manual

```bash
# Forçar SQLite
npm run start:sqlite
npm run dev:sqlite

# Forçar Supabase
npm run start:supabase
npm run dev:supabase
```

### Alternar Entre Versões

```bash
# Configurar para SQLite
npm run switch:sqlite

# Configurar para Supabase
npm run switch:supabase

# Verificar configuração atual
npm run check:supabase
```

## ⚙️ Configuração

### Arquivo .env

```env
# Configuração principal
DATABASE_TYPE=sqlite    # ou 'supabase'

# Para SQLite
DB_PATH=./tem_aki_admin.db

# Para Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_STORAGE_BUCKET=business-images
```

## 📊 Comparação das Versões

| Recurso | SQLite | Supabase |
|---------|--------|----------|
| **Banco de Dados** | Local (SQLite) | Nuvem (PostgreSQL) |
| **Escalabilidade** | Limitada | Alta |
| **Backup** | Manual | Automático |
| **Colaboração** | Não | Sim |
| **Storage de Imagens** | Local | Nuvem |
| **APIs em Tempo Real** | Não | Sim |
| **Autenticação** | Básica | Avançada |
| **Custo** | Gratuito | Freemium |
| **Complexidade** | Baixa | Média |

## 🔧 Estrutura de Arquivos

```
web-admin/
├── index.js                    # 🚀 Launcher principal
├── app.js                      # 📱 Aplicação SQLite
├── app_supabase.js             # ☁️  Aplicação Supabase
├── config/
│   ├── app.js                  # ⚙️  Configurações gerais
│   ├── database.js             # 🗄️  Configuração SQLite
│   └── supabase.js             # ☁️  Configuração Supabase
├── routes/
│   ├── auth.js                 # 🔐 Autenticação SQLite
│   ├── auth_supabase.js        # 🔐 Autenticação Supabase
│   ├── dashboard.js            # 📊 Dashboard SQLite
│   ├── dashboard_supabase.js   # 📊 Dashboard Supabase
│   ├── business.js             # 🏪 Negócios SQLite
│   ├── business_supabase.js    # 🏪 Negócios Supabase
│   ├── categories.js           # 📂 Categorias SQLite
│   └── categories_supabase.js  # 📂 Categorias Supabase
└── scripts/
    └── migrate_to_supabase.js  # 🔄 Script de migração
```

## 🔄 Migração de Dados

### Do SQLite para Supabase

1. **Configure o Supabase** seguindo o `SUPABASE_SETUP_GUIDE.md`
2. **Execute a migração**:
   ```bash
   npm run migrate:supabase
   ```
3. **Altere a configuração**:
   ```bash
   npm run switch:supabase
   ```
4. **Teste a aplicação**:
   ```bash
   npm run dev
   ```

### Do Supabase para SQLite

1. **Altere a configuração**:
   ```bash
   npm run switch:sqlite
   ```
2. **Inicie a aplicação**:
   ```bash
   npm run dev
   ```

**⚠️ Nota:** A migração reversa (Supabase → SQLite) não está implementada automaticamente.

## 🛠️ Scripts Disponíveis

| Script | Descrição |
|--------|----------|
| `npm start` | Inicia automaticamente (baseado em DATABASE_TYPE) |
| `npm run dev` | Desenvolvimento automático |
| `npm run start:sqlite` | Força SQLite |
| `npm run dev:sqlite` | Desenvolvimento SQLite |
| `npm run start:supabase` | Força Supabase |
| `npm run dev:supabase` | Desenvolvimento Supabase |
| `npm run switch:sqlite` | Configura para SQLite |
| `npm run switch:supabase` | Configura para Supabase |
| `npm run check:supabase` | Verifica configuração Supabase |
| `npm run migrate:supabase` | Migra dados SQLite → Supabase |

## 🔍 Detecção Automática

O arquivo `index.js` funciona como um **launcher inteligente** que:

1. ✅ Lê a configuração `DATABASE_TYPE` do `.env`
2. ✅ Valida as variáveis de ambiente necessárias
3. ✅ Exibe informações da versão sendo executada
4. ✅ Carrega a aplicação apropriada (`app.js` ou `app_supabase.js`)
5. ✅ Trata erros de configuração e dependências

## 🚨 Troubleshooting

### Problema: "Arquivo da aplicação não encontrado"
```bash
❌ Erro: Arquivo da aplicação não encontrado: ./app_supabase.js
```
**Solução:** Verifique se todos os arquivos foram criados corretamente.

### Problema: "Variáveis de ambiente não configuradas"
```bash
❌ Erro: Variáveis de ambiente do Supabase não configuradas:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
```
**Solução:** Configure as variáveis no `.env` seguindo o `SUPABASE_SETUP_GUIDE.md`.

### Problema: "MODULE_NOT_FOUND"
```bash
❌ Erro ao iniciar a aplicação: Cannot find module '@supabase/supabase-js'
```
**Solução:** Execute `npm install` para instalar as dependências.

### Verificar Status
```bash
# Verificar configuração atual
node -e "console.log('DATABASE_TYPE:', process.env.DATABASE_TYPE || 'não definido')"

# Verificar Supabase
npm run check:supabase

# Verificar arquivos
ls -la app*.js
```

## 🎯 Cenários de Uso

### 🏠 Desenvolvimento Local
```bash
# Use SQLite para desenvolvimento rápido
npm run switch:sqlite
npm run dev
```

### 🌐 Produção/Staging
```bash
# Use Supabase para produção
npm run switch:supabase
npm start
```

### 🔄 Teste de Migração
```bash
# 1. Desenvolva com SQLite
npm run switch:sqlite
npm run dev

# 2. Migre para Supabase
npm run migrate:supabase
npm run switch:supabase
npm run dev

# 3. Compare funcionalidades
```

### 👥 Equipe Distribuída
```bash
# Cada desenvolvedor pode usar SQLite localmente
npm run switch:sqlite
npm run dev

# Deploy usa Supabase
DATABASE_TYPE=supabase npm start
```

## 📚 Documentação Relacionada

- **[README_SUPABASE.md](./README_SUPABASE.md)** - Guia completo da versão Supabase
- **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)** - Configuração passo a passo
- **[SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)** - Detalhes técnicos da migração
- **[README.md](./README.md)** - Documentação da versão SQLite

## 🔮 Próximos Passos

### Funcionalidades Planejadas
- [ ] **Sincronização bidirecional** SQLite ↔ Supabase
- [ ] **Modo híbrido** (cache local + sincronização)
- [ ] **Interface de administração** para alternar versões
- [ ] **Backup automático** entre versões
- [ ] **Testes automatizados** para ambas as versões

### Melhorias Técnicas
- [ ] **Docker containers** para cada versão
- [ ] **CI/CD pipeline** com testes em ambas as versões
- [ ] **Monitoramento unificado**
- [ ] **Logs centralizados**

---

**💡 Dica:** Use `npm run switch:sqlite` para desenvolvimento local e `npm run switch:supabase` para produção. O sistema se adapta automaticamente!

**🎯 Objetivo:** Máxima flexibilidade com mínima complexidade para o desenvolvedor.