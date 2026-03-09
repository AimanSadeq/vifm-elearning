-- Fix SECURITY DEFINER views to use SECURITY INVOKER instead.
-- SECURITY DEFINER bypasses RLS, running queries as the view creator.
-- SECURITY INVOKER respects RLS, running queries as the current user.
--
-- Affected views:
--   - public.v_designation_analytics
--   - public.v_cpe_compliance

-- Re-create v_designation_analytics with security_invoker
DROP VIEW IF EXISTS public.v_designation_analytics;
CREATE VIEW public.v_designation_analytics WITH (security_invoker = true) AS
SELECT
  d.id AS designation_id,
  d.name,
  d.abbreviation,
  COUNT(DISTINCT dh.id) FILTER (WHERE dh.status = 'active'::designation_status) AS active_holders,
  COUNT(DISTINCT dh.id) FILTER (WHERE dh.status = 'grace_period'::designation_status) AS grace_period_holders,
  COUNT(DISTINCT dh.id) FILTER (WHERE dh.status = 'suspended'::designation_status) AS suspended_holders,
  COUNT(DISTINCT dh.id) FILTER (WHERE dh.status = 'lapsed'::designation_status) AS lapsed_holders,
  COUNT(DISTINCT dh.id) AS total_holders_ever,
  COUNT(DISTINCT dt.id) FILTER (WHERE dt.slug = 'founding-member'::text AND dh.status = 'active'::designation_status) AS active_founding_members,
  COALESCE(SUM(dr.amount_paid) FILTER (WHERE dr.status = 'completed'::text AND dr.renewed_at >= DATE_TRUNC('year'::text, NOW())), 0::numeric) AS ytd_renewal_revenue,
  ROUND(AVG(dh.cpe_hours_completed) FILTER (WHERE dh.status = 'active'::designation_status), 1) AS avg_cpe_hours_active
FROM designations d
LEFT JOIN designation_holders dh ON d.id = dh.designation_id
LEFT JOIN designation_tiers dt ON dh.tier_id = dt.id
LEFT JOIN designation_renewals dr ON dh.id = dr.holder_id
GROUP BY d.id, d.name, d.abbreviation;

-- Re-create v_cpe_compliance with security_invoker
DROP VIEW IF EXISTS public.v_cpe_compliance;
CREATE VIEW public.v_cpe_compliance WITH (security_invoker = true) AS
SELECT
  dh.id AS holder_id,
  dh.user_id,
  p.full_name,
  p.email,
  d.abbreviation AS designation,
  dt.name AS tier_name,
  dh.status,
  dh.cpe_hours_completed,
  d.annual_cpe_required,
  (d.annual_cpe_required::numeric - dh.cpe_hours_completed) AS hours_remaining,
  dh.current_period_end,
  CASE
    WHEN dh.cpe_hours_completed >= d.annual_cpe_required::numeric THEN 'compliant'::text
    WHEN dh.cpe_hours_completed >= (d.annual_cpe_required::numeric * 0.5) THEN 'on_track'::text
    ELSE 'at_risk'::text
  END AS compliance_status
FROM designation_holders dh
JOIN profiles p ON dh.user_id = p.id
JOIN designations d ON dh.designation_id = d.id
LEFT JOIN designation_tiers dt ON dh.tier_id = dt.id
WHERE dh.status = ANY (ARRAY['active'::designation_status, 'grace_period'::designation_status]);
