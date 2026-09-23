-- ============================================================================
-- Restore read grants on lessons and profiles
--
-- The authenticated role lost SELECT on public.lessons, and public.profiles was
-- narrowed to column-level grants that exclude full_name. Every client read of
-- lessons (course editor, course player) and of instructor names failed with
-- 42501 "permission denied for table". RLS policies still decide which rows
-- each user can see; these grants only let the queries reach them.
--
-- profiles keeps column-level grants so sensitive columns stay hidden; add
-- columns here as the client needs them.
-- ============================================================================

GRANT SELECT ON public.lessons TO authenticated;

GRANT SELECT (id, full_name, full_name_ar, avatar_url, role, is_active)
    ON public.profiles TO authenticated;
