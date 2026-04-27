import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/services/access";
import { isSuperAdmin } from "@/lib/services/role";

/**
 * Return the current user's plan-level feature flags. Used by the marketing
 * pages to decide what to gate ("Watch replay" vs "Upgrade to view").
 *
 * Anonymous users get an empty feature map.
 * super_admin bypasses the plan gate — admins shouldn't see "Upgrade plan"
 * prompts on their own platform. Instructors are NOT bypassed here: they
 * only have elevated access to the courses/webinars they author, not a
 * blanket entitlement to consume paid features.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({
      data: {
        authenticated: false,
        hasActiveSubscription: false,
        planType: null,
        features: {},
      },
    });

  if (isSuperAdmin(user)) {
    // Admins get every feature flag granted. Keep this in sync with the
    // recording-fetch endpoint, which short-circuits the same way.
    return NextResponse.json({
      data: {
        authenticated: true,
        hasActiveSubscription: false,
        planType: "admin",
        features: {
          webinars: true,
          courses: true,
          certificates: true,
          downloads: true,
        },
      },
    });
  }

  const sub = await getActiveSubscription(user.id, supabase);
  const plan = (sub as { plan?: { plan_type?: string; metadata?: { features?: Record<string, boolean> } } | null } | null)?.plan ?? null;

  return NextResponse.json({
    data: {
      authenticated: true,
      hasActiveSubscription: Boolean(sub),
      planType: plan?.plan_type ?? null,
      features: plan?.metadata?.features ?? {},
    },
  });
}
