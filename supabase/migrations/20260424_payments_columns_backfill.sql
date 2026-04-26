-- ============================================================
-- payments table: bring tracked schema in line with what the live DB
-- already has.
--
-- The original schema (001_initial_schema.sql) shipped with `method` and
-- `transaction_id` / `gateway_response`. Over time the live DB was modified
-- ad-hoc to use `payment_method`, gateway-specific reference columns,
-- `payment_type`, and structured invoice fields — but no migration was
-- committed. Anyone running a fresh setup from `supabase/migrations/`
-- ended up with a schema that didn't match the application code.
--
-- This migration is fully idempotent (`ADD COLUMN IF NOT EXISTS`) — safe to
-- apply repeatedly. On the live DB it's a no-op; on a fresh DB it brings
-- the table in line with the columns referenced from /src/lib/services/
-- enrollment-service.ts and the payment route handlers.
-- ============================================================

-- New gateway-aware columns
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method        TEXT,
  ADD COLUMN IF NOT EXISTS payment_type          TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paytabs_transaction_ref  TEXT,
  ADD COLUMN IF NOT EXISTS bank_reference        TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number        TEXT,
  ADD COLUMN IF NOT EXISTS invoice_url           TEXT,
  ADD COLUMN IF NOT EXISTS organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Backfill payment_method from the legacy `method` column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'method'
  ) THEN
    UPDATE payments
       SET payment_method = method
     WHERE payment_method IS NULL AND method IS NOT NULL;
  END IF;
END $$;

-- Default payment_type for any pre-existing rows so application code can
-- branch reliably on it.
UPDATE payments
   SET payment_type = 'course_purchase'
 WHERE payment_type IS NULL AND course_id IS NOT NULL;

-- Helpful indexes for the gateway lookups in the webhook handlers
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id
  ON payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_paytabs_transaction_ref
  ON payments(paytabs_transaction_ref) WHERE paytabs_transaction_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_bank_reference
  ON payments(bank_reference) WHERE bank_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_payment_type
  ON payments(payment_type);

-- The legacy `method`, `transaction_id`, `gateway_response` columns are
-- intentionally NOT dropped here — keeping them around means an older
-- environment can still read existing data. Drop in a follow-up once
-- you've confirmed nothing reads them anymore.
