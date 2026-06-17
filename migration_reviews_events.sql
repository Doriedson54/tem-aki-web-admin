BEGIN;

-- =========================================================
-- 0) Garantir extensao para UUID
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1) Evolucao segura da tabela public.reviews
-- Estrutura atual conhecida:
-- - id integer primary key
-- - user_id uuid references users(id)
-- - business_id uuid references businesses(id)
-- - rating integer
-- - content text
-- - created_at timestamptz default CURRENT_TIMESTAMP
-- =========================================================

-- 1.1) Novas colunas para fluxo moderado sem login
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS author_name text;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status text;

-- 1.2) Backfill para compatibilidade com registros antigos
-- Se algum registro legado existir sem status, ele vira approved
UPDATE public.reviews
SET status = 'approved'
WHERE status IS NULL;

-- 1.3) Status padrao para novos registros
ALTER TABLE public.reviews
  ALTER COLUMN status SET DEFAULT 'pending';

-- 1.4) user_id passa a ser opcional para permitir avaliacao sem login
ALTER TABLE public.reviews
  ALTER COLUMN user_id DROP NOT NULL;

-- 1.5) Restricao de nota entre 1 e 5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_rating_range_check'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_range_check
      CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;

-- 1.6) Restricao de status permitido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_status_check'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 1.7) Status obrigatorio apos backfill
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'status'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.reviews
      ALTER COLUMN status SET NOT NULL;
  END IF;
END $$;

-- 1.8) Indices uteis para listagem publica e moderacao
CREATE INDEX IF NOT EXISTS reviews_business_id_idx
  ON public.reviews (business_id);

CREATE INDEX IF NOT EXISTS reviews_status_idx
  ON public.reviews (status);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx
  ON public.reviews (created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_business_status_created_at_idx
  ON public.reviews (business_id, status, created_at DESC);

-- =========================================================
-- 2) Nova tabela public.business_events
-- Objetivo:
-- - registrar metricas futuras para monetizacao e relatorios
-- - uso via backend/API com service role
-- - sem insert publico direto
-- =========================================================

CREATE TABLE IF NOT EXISTS public.business_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'site',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.1) Restringe os tipos de evento previstos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'business_events_event_type_check'
      AND conrelid = 'public.business_events'::regclass
  ) THEN
    ALTER TABLE public.business_events
      ADD CONSTRAINT business_events_event_type_check
      CHECK (
        event_type IN (
          'profile_view',
          'phone_click',
          'whatsapp_click',
          'map_click',
          'share',
          'favorite'
        )
      );
  END IF;
END $$;

-- 2.2) Indices para consultas administrativas e futuras analises
CREATE INDEX IF NOT EXISTS business_events_business_id_idx
  ON public.business_events (business_id);

CREATE INDEX IF NOT EXISTS business_events_event_type_idx
  ON public.business_events (event_type);

CREATE INDEX IF NOT EXISTS business_events_created_at_idx
  ON public.business_events (created_at DESC);

CREATE INDEX IF NOT EXISTS business_events_business_event_created_at_idx
  ON public.business_events (business_id, event_type, created_at DESC);

-- 2.3) RLS habilitado sem policies publicas
-- Isso evita acesso direto perigoso via cliente.
-- O backend com service_role continua funcionando.
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

COMMIT;
