# tem-aki-web-admin

Painel web oficial do sistema Tem Aki no Bairro (React + TypeScript + Vite) com API Serverless em `/api` compatível com Vercel e integração com Supabase.

## Requisitos

- Node.js 20+

## Rodar localmente

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: build para produção (Vercel)
- `npm run preview`: prévia do build
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript (projeto composto)

## Vercel

- Front-end: Vite SPA (rota fallback para `/index.html`)
- API: Function Node em `api/[...path].ts`
- Configuração: [vercel.json](file:///c:/Projetos/Tem_Aki_no_Bairro/vercel.json)

Variáveis de ambiente necessárias (Project Settings > Environment Variables):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (opcional, padrão: `business-images`)
- `BOOTSTRAP_ADMIN_TOKEN` (opcional, usado para criação inicial de admin via endpoint)

Exemplo: [.env.vercel.example](file:///c:/Projetos/Tem_Aki_no_Bairro/.env.vercel.example)

## Supabase

1) Crie um projeto no Supabase.
2) No SQL Editor, execute na ordem:
- [01_schema.sql](file:///c:/Projetos/Tem_Aki_no_Bairro/supabase/01_schema.sql)
- [02_storage.sql](file:///c:/Projetos/Tem_Aki_no_Bairro/supabase/02_storage.sql)
- (opcional) [03_admin_user.sql](file:///c:/Projetos/Tem_Aki_no_Bairro/supabase/03_admin_user.sql)

## Endpoints principais (API)

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `PUT /api/auth/profile`
- `GET /api/categories`
- `GET /api/subcategories`
- `GET /api/businesses`
- `GET /api/dashboard/recent` (admin)

