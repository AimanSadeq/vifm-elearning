-- =============================================================================
-- EMAIL-BOUND VOUCHERS
-- Lets a voucher be locked to a single recipient email so it cannot be shared,
-- and adds an idempotency key for external (OpsSys) voucher creation so the
-- same delegate+course never gets two different codes.
-- =============================================================================

-- The email this voucher is reserved for. When set, redemption is only allowed
-- for an authenticated user whose account email matches (case-insensitive).
-- NULL keeps the legacy "any authenticated user" behaviour.
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS assigned_email TEXT;

-- Stable external reference (e.g. "opssys:<courseId>:<attendeeId>") used by the
-- external creation endpoint to stay idempotent across retries / re-sends.
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS external_ref TEXT;

-- One voucher per external reference.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_external_ref
    ON vouchers(external_ref)
    WHERE external_ref IS NOT NULL;

-- Lookups by assigned email.
CREATE INDEX IF NOT EXISTS idx_vouchers_assigned_email
    ON vouchers(lower(assigned_email))
    WHERE assigned_email IS NOT NULL;
