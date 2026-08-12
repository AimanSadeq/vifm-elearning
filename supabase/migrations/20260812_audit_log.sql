-- ============================================================================
-- Audit log
--
-- The admin user-management routes and the corporate self-service routes have
-- inserted into audit_log since they were written, but the table was never
-- created, so every insert silently failed. This creates it.
--
-- Service-role only: written by API routes after their own authorization
-- checks; not readable or writable by authenticated users (no policies).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.audit_log IS
  'Admin and corporate console action trail. Written with the service role by API routes; RLS enabled with no policies so clients cannot read or write it.';
