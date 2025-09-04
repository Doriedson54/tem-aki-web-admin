# Guia de Configuração do Supabase - Tem Aki no Bairro

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Clique em "New Project"
4. Escolha sua organização
5. Configure o projeto:
   - **Name**: `tem-aki-no-bairro`
   - **Database Password**: Crie uma senha forte (anote-a!)
   - **Region**: Escolha a região mais próxima (ex: South America)
6. Clique em "Create new project"
7. Aguarde a criação do projeto (pode levar alguns minutos)

## Passo 2: Obter Chaves de API

1. No painel do projeto, vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public**: Chave pública para operações básicas
   - **service_role**: Chave privada para operações administrativas (⚠️ MANTENHA SECRETA!)

## Passo 3: Configurar Variáveis de Ambiente

1. Abra o arquivo `.env` no diretório `web-admin`
2. Substitua os valores das variáveis do Supabase:

```env
# Configurações do Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Configurações do Storage do Supabase
SUPABASE_STORAGE_BUCKET=business-images
SUPABASE_STORAGE_URL=https://your-project-ref.supabase.co/storage/v1/object/public/
```

## Passo 4: Executar Script de Criação do Schema

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `supabase_schema.sql`
4. Cole no editor SQL
5. Clique em "Run" para executar o script
6. Verifique se todas as tabelas foram criadas em **Database** > **Tables**

## Passo 5: Configurar Storage para Imagens

1. No painel do Supabase, vá para **Storage**
2. Clique em "Create a new bucket"
3. Configure o bucket:
   - **Name**: `business-images`
   - **Public bucket**: ✅ Marque esta opção
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`
4. Clique em "Create bucket"

## Passo 6: Configurar Políticas de Segurança (RLS)

### Para o bucket de imagens:
1. Vá para **Storage** > **Policies**
2. Clique em "New policy" para o bucket `business-images`
3. Crie as seguintes políticas:

**Política de Upload (INSERT):**
```sql
-- Permitir upload de imagens para usuários autenticados
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-images');
```

**Política de Leitura (SELECT):**
```sql
-- Permitir leitura pública de imagens
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'business-images');
```

**Política de Atualização (UPDATE):**
```sql
-- Permitir atualização para usuários autenticados
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'business-images');
```

**Política de Exclusão (DELETE):**
```sql
-- Permitir exclusão para usuários autenticados
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'business-images');
```

## Passo 7: Configurar Autenticação

1. Vá para **Authentication** > **Settings**
2. Configure as opções:
   - **Enable email confirmations**: Desabilite para desenvolvimento
   - **Enable phone confirmations**: Desabilite
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

## Passo 8: Testar Conexão

1. Reinicie o servidor web-admin:
   ```bash
   npm run dev
   ```

2. Verifique os logs para confirmar que a conexão foi estabelecida

3. Teste as funcionalidades básicas:
   - Login no painel admin
   - Visualização do dashboard
   - Criação de categorias
   - Cadastro de negócios

## Passo 9: Migrar Dados Existentes (Opcional)

Se você já tem dados no SQLite e quer migrá-los:

1. Use o script de migração (será criado separadamente)
2. Ou exporte os dados do SQLite e importe manualmente

## Verificações Finais

✅ **Projeto criado no Supabase**
✅ **Variáveis de ambiente configuradas**
✅ **Schema do banco criado**
✅ **Storage configurado**
✅ **Políticas RLS ativas**
✅ **Autenticação configurada**
✅ **Conexão testada**

## Troubleshooting

### Erro de Conexão
- Verifique se as URLs e chaves estão corretas
- Confirme que o projeto está ativo no Supabase
- Verifique se não há espaços extras nas variáveis de ambiente

### Erro de Permissão
- Verifique se as políticas RLS estão configuradas corretamente
- Confirme que está usando a chave service_role para operações administrativas

### Erro de Upload
- Verifique se o bucket foi criado corretamente
- Confirme que as políticas de storage estão ativas
- Verifique os tipos de arquivo permitidos

## Próximos Passos

Após a configuração:
1. Migrar as rotas da API para usar Supabase
2. Atualizar o frontend para usar as novas APIs
3. Testar todas as funcionalidades
4. Configurar backup e monitoramento

## Suporte

Para dúvidas:
- Documentação oficial: [docs.supabase.com](https://docs.supabase.com)
- Comunidade: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)