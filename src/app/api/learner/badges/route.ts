import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { badgesClient, isBadgesEnabled } from "@/lib/services/badges-client";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isBadgesEnabled()) {
      return NextResponse.json({ data: [], enabled: false });
    }

    const result = await badgesClient.listBadgesForDelegate(user.id);
    if (!result.ok) {
      // External service down — degrade silently so the profile page
      // still loads. Surface the error so the UI can show a banner.
      return NextResponse.json({ data: [], enabled: true, error: result.error });
    }

    const badges = result.data?.data ?? [];
    return NextResponse.json({ data: badges, enabled: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
