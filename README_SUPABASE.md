# Tem Aki Admin - Versão Supabase

## 🚀 Visão Geral

Esta é a versão migrada do painel administrativo "Tem Aki no Bairro" que utiliza **Supabase** como backend, substituindo o SQLite local por um banco de dados PostgreSQL na nuvem com recursos avançados de autenticação, storage e APIs em tempo real.

## 🆕 Novidades da Versão Supabase

### ✨ Recursos Principais
- **Banco PostgreSQL na nuvem** - Escalável e confiável
- **Storage de arquivos** - Upload de imagens direto para o Supabase
- **APIs RESTful automáticas** - Geradas automaticamente pelo Supabase
- **Autenticação robusta** - Sistema de auth integrado
- **Políticas RLS** - Row Level Security para máxima segurança
- **Backup automático** - Gerenciado pelo Supabase
- **Monitoramento** - Dashboard de métricas e logs

### 🔄 Diferenças da Versão SQLite
- Banco de dados na nuvem (PostgreSQL vs SQLite local)
- Upload de imagens para Supabase Storage
- Melhor performance e escalabilidade
- Recursos de colaboração em tempo real
- Backup e recuperação automáticos

## 📋 Pré-requisitos

- Node.js 16+ 
- Conta no [Supabase](https://supabase.com)
- NPM ou Yarn

## 🛠️ Instalação e Configuração

### 1. Clonar e Instalar Dependências

```bash
cd web-admin
npm install
```

### 2. Configurar Supabase

Siga o guia detalhado: **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)**

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
# Configurações do Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Configurações do Storage
SUPABASE_STORAGE_BUCKET=business-images
SUPABASE_STORAGE_URL=https://your-project-ref.supabase.co/storage/v1/object/public/
```

### 4. Executar Schema do Banco

1. Acesse o **SQL Editor** no painel do Supabase
2. Execute o conteúdo do arquivo `supabase_schema.sql`
3. Verifique se todas as tabelas foram criadas

## 🚀 Executando a Aplicação

### Desenvolvimento
```bash
npm run dev:supabase
```

### Produção
```bash
npm run start:supabase
```

### Verificar Configuração
```bash
npm run check:supabase
```

## 📊 Migração de Dados

Se você já tem dados no SQLite e quer migrá-los:

```bash
npm run migrate:supabase
```

**Nota:** As imagens precisarão ser re-uploadadas manualmente para o Supabase Storage.

## 📁 Estrutura do Projeto

```
web-admin/
├── app_supabase.js              # Aplicação principal (Supabase)
├── config/
│   ├── supabase.js              # Configuração do Supabase
│   └── database.js              # Configuração SQLite (legado)
├── routes/
│   ├── auth_supabase.js         # Rotas de autenticação
│   ├── dashboard_supabase.js    # Rotas do dashboard
│   ├── business_supabase.js     # Rotas de negócios
│   ├── categories_supabase.js   # Rotas de categorias
│   └── *.js                     # Rotas originais (SQLite)
├── scripts/
│   └── migrate_to_supabase.js   # Script de migração
├── supabase_schema.sql          # Schema do banco PostgreSQL
├── SUPABASE_SETUP_GUIDE.md      # Guia de configuração
└── SUPABASE_MIGRATION.md        # Documentação da migração
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|----------|
| `npm run dev:supabase` | Executar em modo desenvolvimento |
| `npm run start:supabase` | Executar em produção |
| `npm run check:supabase` | Verificar configuração |
| `npm run migrate:supabase` | Migrar dados do SQLite |

## 🔐 Segurança

### Políticas RLS (Row Level Security)

O Supabase utiliza políticas RLS para controlar acesso aos dados:

- **Usuários**: Apenas admins podem gerenciar
- **Negócios**: Controle baseado em status e permissões
- **Imagens**: Upload restrito a usuários autenticados
- **Logs**: Apenas leitura para auditoria

### Variáveis Sensíveis

⚠️ **NUNCA** commite as seguintes variáveis:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `JWT_SECRET`

## 📊 Monitoramento

### Dashboard do Supabase
Acesse o painel do Supabase para:
- Monitorar performance do banco
- Visualizar logs de API
- Gerenciar usuários
- Configurar alertas

### Logs da Aplicação
```bash
# Ver logs em tempo real
tail -f logs/app.log

# Verificar status da aplicação
curl http://localhost:3000/health
```

## 🔄 Backup e Recuperação

### Backup Automático
O Supabase faz backup automático dos dados. Configure:
1. Acesse **Settings** > **Database**
2. Configure **Point-in-time Recovery**
3. Defina período de retenção

### Backup Manual
```bash
# Exportar dados via API
node scripts/export_data.js

# Backup do storage
node scripts/backup_storage.js
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Erro de Conexão
```
❌ Error: Invalid API key
```
**Solução:** Verifique as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`

#### Erro de Permissão
```
❌ Error: Row Level Security policy violation
```
**Solução:** Verifique as políticas RLS no painel do Supabase

#### Erro de Upload
```
❌ Error: Storage bucket not found
```
**Solução:** Crie o bucket `business-images` no Supabase Storage

### Logs de Debug

Para debug detalhado:
```bash
LOG_LEVEL=debug npm run dev:supabase
```

## 🔗 Links Úteis

- [Documentação Supabase](https://docs.supabase.com)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 📞 Suporte

### Documentação
- `SUPABASE_SETUP_GUIDE.md` - Configuração inicial
- `SUPABASE_MIGRATION.md` - Detalhes da migração
- `supabase_schema.sql` - Estrutura do banco

### Comunidade
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)

## 🎯 Próximos Passos

### Funcionalidades Planejadas
- [ ] Autenticação via OAuth (Google, Facebook)
- [ ] Notificações em tempo real
- [ ] API pública para o app mobile
- [ ] Dashboard de analytics avançado
- [ ] Sistema de comentários e avaliações
- [ ] Integração com mapas
- [ ] Exportação de relatórios

### Melhorias Técnicas
- [ ] Implementar cache Redis
- [ ] Adicionar testes automatizados
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento com Sentry
- [ ] Otimização de performance

## 📄 Licença

Este projeto é licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Versão:** 2.0.0 (Supabase)  
**Última atualização:** Janeiro 2025  
**Compatibilidade:** Node.js 16+, Supabase 2.x