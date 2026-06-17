-- Add 'free' and 'voucher' to the payment_method enum.
--
-- Zero-total enrollments record a completed $0 payment so the success page and
-- admin reports have a row to point at:
--   * 'voucher'  — a discount/full-access voucher fully covers the price
--                  (/api/vouchers/redeem and the Mamo checkout free path)
--   * 'free'     — a $0 total with no voucher (e.g. a price-0 course)
--
-- The original enum (001_initial_schema.sql) only had the gateway methods, so
-- inserting these failed with "invalid input value for enum payment_method".
-- Idempotent: re-running is a no-op.

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'voucher';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'free';
