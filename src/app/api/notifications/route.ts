import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Notifications are written by an admin and rendered into another user's
// feed (often as anchor href + body HTML). Without validation an admin
// account compromise would let the attacker plant `<script>` payloads or
// `javascript:` URLs into every user's feed. Validate strictly:
//   - title/body are length-capped plain strings
//   - action_url is either a relative path (must start with "/") or an
//     https URL on the same app origin
//   - channel is whitelisted
import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
const notificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  titleAr: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().min(1).max(2000),
  bodyAr: z.string().trim().max(2000).optional().nullable(),
  channel: z.enum(["in_app", "email", "whatsapp", "sms"]).optional(),
  actionUrl: z
    .string()
    .max(2048)
    .refine(
      (val) => {
        if (!val) return true;
        // Reject any non-https scheme outright (defends against javascript:,
        // data:, vbscript: etc.).
        if (val.startsWith("/")) return !val.startsWith("//");
        if (val.startsWith("https://")) {
          try {
            const u = new URL(val);
            const appUrl = process.env.NEXT_PUBLIC_APP_URL;
            if (!appUrl) return false;
            return u.origin === new URL(appUrl).origin;
          } catch {
            return false;
          }
        }
        return false;
      },
      {
        message:
          "actionUrl must be a relative path or an https URL on this app's origin",
      }
    )
    .optional()
    .nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = page * pageSize;
  const { data, count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count, page, pageSize });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if admin
  const profile = { role: await getOwnRole(supabase) };

  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = notificationSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Confirm target user exists; without this we'd pollute the table with
  // rows for non-existent UUIDs.
  const { data: targetExists } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (!targetExists) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 }
    );
  }

  // Writing a notification for another user is privileged; the super_admin
  // check above authorises it, and `authenticated` no longer holds INSERT.
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: parsed.data.userId,
      title: parsed.data.title,
      title_ar: parsed.data.titleAr || null,
      body: parsed.data.body,
      body_ar: parsed.data.bodyAr || null,
      channel: parsed.data.channel || "in_app",
      action_url: parsed.data.actionUrl || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
