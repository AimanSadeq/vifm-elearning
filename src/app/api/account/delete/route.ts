import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { resolveCaller } from "@/lib/api/caller";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/utils/rate-limit";

/**
 * POST /api/account/delete
 *
 * Deletes the caller's own account: every row (via `delete_own_account`, run
 * as the caller) and then every file they own in Storage.
 *
 * `delete_own_account` removes database rows only. Storage objects cannot be
 * deleted from SQL, so certificates (which carry the learner's name),
 * assignment submissions and CPE evidence stayed behind after an in-app
 * account deletion. Each of those buckets keeps a learner's files under
 * `<userId>/`, so everything under that prefix is removed here.
 *
 * Accepts a Bearer token (the mobile app) or the session cookie (the site).
 */
const USER_BUCKETS = ["certificates", "assignment-submissions", "cpe-evidence"];

async function listUnder(bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    // Folders come back without an id; recurse into them.
    if (item.id === null) out.push(...(await listUnder(bucket, path)));
    else out.push(path);
  }
  return out;
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, {
    scope: "account:delete",
    buckets: [{ limit: 3, windowMs: 60_000 }],
  });
  if (limited) return limited;

  const caller = await resolveCaller(request);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Run the RPC as the caller: it deletes `auth.uid()`, never anyone else.
  let userClient;
  if (caller.via === "bearer") {
    const token = request.headers.get("authorization")!.slice(7).trim();
    userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } else {
    userClient = await createServerSupabase();
  }

  const { error } = await userClient.rpc("delete_own_account");
  if (error) {
    console.error("[account/delete] delete_own_account failed:", error.message);
    return NextResponse.json({ error: "Could not delete the account" }, { status: 500 });
  }

  // Rows are gone; now the files. A failure here is logged, not surfaced: the
  // account itself has already been deleted.
  for (const bucket of USER_BUCKETS) {
    try {
      const paths = await listUnder(bucket, caller.id);
      for (let i = 0; i < paths.length; i += 100) {
        await supabaseAdmin.storage.from(bucket).remove(paths.slice(i, i + 100));
      }
    } catch (e) {
      console.error(`[account/delete] storage cleanup failed for ${bucket}:`, e);
    }
  }

  return NextResponse.json({ success: true });
}
