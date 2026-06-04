-- Tem Aki no Bairro - Storage bucket + policies
-- Execute após 01_schema.sql

insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do update
set public = excluded.public;

-- Observação importante:
-- Em alguns projetos do Supabase, o usuário do SQL Editor não tem permissão (OWNER)
-- sobre storage.objects. Por isso, scripts que fazem ALTER TABLE / CREATE POLICY em
-- storage.objects podem falhar com:
--   ERROR: 42501: must be owner of table objects
--
-- Para este projeto, basta o bucket existir e ser público:
-- - public=true permite servir imagens por URL pública.
-- - o upload via backend (Vercel Function) usa SUPABASE_SERVICE_ROLE_KEY e não depende
--   de policies de storage.objects.
--
-- Se você quiser políticas mais restritivas, configure pelo painel:
-- Supabase > Storage > Policies (ou use um ambiente com permissões adequadas).
