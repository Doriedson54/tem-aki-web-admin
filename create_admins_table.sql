-- Criar tabela 'admins' no Supabase
-- Execute este SQL no painel do Supabase: SQL Editor

-- 1. Criar a tabela admins
CREATE TABLE IF NOT EXISTS public.admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_super_admin BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS
-- Política para permitir que admins vejam todos os registros
CREATE POLICY "Admins can view all admins" ON public.admins
  FOR SELECT USING (true);

-- Política para permitir que admins insiram novos registros
CREATE POLICY "Admins can insert admins" ON public.admins
  FOR INSERT WITH CHECK (true);

-- Política para permitir que admins atualizem registros
CREATE POLICY "Admins can update admins" ON public.admins
  FOR UPDATE USING (true);

-- Política para permitir que admins deletem registros
CREATE POLICY "Admins can delete admins" ON public.admins
  FOR DELETE USING (true);

-- 4. Inserir admin padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO public.admins (username, email, password_hash, full_name, is_super_admin)
VALUES (
  'admin',
  'admin@temakinobairro.com.br',
  '$2b$12$LQv3c1yqBwEHxPiLnPZOQOsA3PQ7khFHFx6hxIrOHqHQVQhHrm6Mi',
  'Administrador do Sistema',
  true
)
ON CONFLICT (username) DO NOTHING;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- 6. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'admins'
ORDER BY ordinal_position;