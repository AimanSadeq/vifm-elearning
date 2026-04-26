import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/services/access";

/**
 * Return the current user's plan-level feature flags. Used by the marketing
 * pages to decide what to gate ("Watch replay" vs "Upgrade to view").
 *
 * Anonymous users get an empty feature map.
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
