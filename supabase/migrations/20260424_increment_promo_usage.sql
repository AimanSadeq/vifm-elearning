-- Atomic increment for promo_codes.current_uses.
-- Used by every payment-success path (Stripe / PayTabs / MamoPay / bank-transfer
-- webhooks + admin confirm). Avoids the read-modify-write race when two
-- payments redeem the same promo concurrently.

CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = promo_id;
END;
$$;

REVOKE ALL ON FUNCTION increment_promo_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_promo_usage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_promo_usage(UUID) TO authenticated;
