## Tem Aki no Bairro – Produção (Supabase + Vercel)
### 1) Supabase (Banco + Auth)
Crie um projeto no Supabase e execute no **SQL Editor** nesta ordem:
1. `supabase/01_schema.sql`
2. `supabase/02_storage.sql`
3. `supabase/03_admin_user.sql` (depois de criar o usuário no Auth)

### 2) Usuário admin
- Crie um usuário via Supabase Auth (email/senha).
- Depois, marque ele como admin:
```sql
insert into public.profiles (id, role)
values ('<USER_ID_DO_AUTH>', 'admin')
on conflict (id) do update set role = excluded.role;
```

### 3) Vercel (tem-aki-front-adm) - passo a passo didático
1. Crie/abra o projeto no Vercel e confirme:
- Root Directory: `tem-aki-front-adm`
- Build Command: `npm run build` (não use textos do tipo “or vite command”)
- Output Directory: `dist`
2. Em **Settings > Environment Variables**, crie:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET=business-images`
3. Aplique as variáveis em:
- Production
- Preview
4. Domínios:
- `temakinobairro.com.br` como **Primary**
- `www.temakinobairro.com.br` como **Redirect to Primary**
5. DNS (Registro.br):
- Nameservers do domínio apontando para Vercel (já em uso no seu caso)
- Aguarde propagação e em Vercel clique em **Refresh** até ficar **Valid Configuration**
6. Deploy:
- Garanta que o deploy está usando o último commit da `main`
- Se necessário, clique em **Redeploy**

Storage (upload de imagens):
- Crie um bucket público chamado `business-images` no Supabase Storage

### 4) Rotas de API no mesmo domínio
Este projeto expõe rotas serverless em `/api/*` (Vercel Functions) para:
- `/api/health`
- `/api/auth/login`
- `/api/auth/verify`
- `/api/auth/refresh`
- `/api/auth/profile`
- `/api/categories`
- `/api/businesses`
- `/api/favorites`

### 5) Smoke test pós-deploy
1. Infra:
- `GET https://temakinobairro.com.br/api/health` deve retornar `success: true`
2. Auth:
- Login deve retornar `token` e dados de usuário
3. CRUD:
- Listar categorias/negócios
- Criar/editar negócio (admin)
- Upload de imagem para o bucket
4. Cliente:
- `www.temakinobairro.com.br` deve redirecionar para `https://temakinobairro.com.br`
