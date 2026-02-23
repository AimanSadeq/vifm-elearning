-- Fix is_admin() to use JWT app_metadata claims instead of querying profiles table.
-- This is more reliable and consistent with the profiles admin RLS policy.
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
END;
$$;
