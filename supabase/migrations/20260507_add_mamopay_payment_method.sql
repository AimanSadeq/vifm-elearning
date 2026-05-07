-- Add 'mamopay' to the payment_method enum so the MamoPay checkout/subscription
-- routes can insert into payments.payment_method without a type error.
--
-- The original enum (001_initial_schema.sql) shipped before MamoPay was
-- integrated. Idempotent: re-running is a no-op.

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mamopay';
