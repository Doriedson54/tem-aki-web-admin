BEGIN;

-- Proposta opcional para granular os eventos do mapa em business_events.
-- Nao execute automaticamente sem aprovacao.
-- Observacao:
-- - O codigo atual reutiliza event_type = 'map_click' com metadata.action
--   ('map_open', 'map_marker_click', 'map_route_request') para manter compatibilidade
--   com a constraint atual e evitar alterar o banco sem aprovacao.
-- - Se esta migration for aprovada e executada, o backend/frontend poderao migrar
--   para event_type dedicados no futuro.

ALTER TABLE public.business_events
  DROP CONSTRAINT IF EXISTS business_events_event_type_check;

ALTER TABLE public.business_events
  ADD CONSTRAINT business_events_event_type_check
  CHECK (
    event_type IN (
      'profile_view',
      'phone_click',
      'whatsapp_click',
      'map_click',
      'map_open',
      'map_marker_click',
      'map_route_request',
      'share',
      'favorite'
    )
  );

COMMIT;
