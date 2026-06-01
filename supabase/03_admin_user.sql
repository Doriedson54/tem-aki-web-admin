-- Tem Aki no Bairro - Promover usuário para admin
-- Pré-requisito: usuário já criado em Authentication > Users

-- 1) Descobrir usuário pelo email (opcional)
-- select id, email from auth.users order by created_at desc;

-- 2) Promover para admin
-- Substitua <USER_ID_UUID> pelo UUID real do usuário.
insert into public.profiles (id, role)
values ('<USER_ID_UUID>', 'admin')
on conflict (id) do update
set role = excluded.role;

-- 3) Verificar
-- select id, username, role from public.profiles where id = '<USER_ID_UUID>';
