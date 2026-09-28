export type InstructorOption = { id: string; full_name: string | null }

/**
 * Active super admins and instructors, for the console's "Instructor" pickers.
 *
 * Browser queries can no longer filter `profiles` on `role` or `is_active`:
 * those columns are not granted to `authenticated`, and PostgREST needs the
 * privilege to filter on a column, so the old `.in("role", …)` query failed
 * with 42501 and every instructor dropdown showed only "None". The admin
 * profiles route makes the same read with the service role. Returns [] on
 * failure (the route only lists staff to super admins).
 */
export async function fetchInstructors(): Promise<InstructorOption[]> {
  try {
    const res = await fetch(
      '/api/admin/profiles?roles=super_admin,instructor&isActive=true&orderBy=full_name&pageSize=200'
    )
    if (!res.ok) {
      console.error('Failed to load instructors', res.status)
      return []
    }
    const json = await res.json()
    return ((json?.rows ?? []) as InstructorOption[]).map((r) => ({
      id: r.id,
      full_name: r.full_name,
    }))
  } catch (err) {
    console.error('Failed to load instructors', err)
    return []
  }
}
