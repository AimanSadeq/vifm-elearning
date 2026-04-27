import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin } from "@/lib/services/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  // Storage path within the course-videos bucket (e.g. "webinars/<id>/<file>").
  // Files are uploaded directly to Storage from the browser via the upload-url
  // endpoint; this route only links the resulting path to the webinar.
  path: z
    .string()
    .min(1)
    .max(500)
    // Lock the path prefix so an admin can't make a webinar serve a course
    // video. The upload-url endpoint always emits webinars/<webinarId>/...
    .regex(
      /^webinars\/[0-9a-f-]{36}\//i,
      "Path must be under webinars/<webinar-id>/"
    ),
  is_public: z.boolean().optional().default(false),
  // Optional: also flip the parent webinar's status. Webinar status is
  // independent of recording presence in the data model, but admins almost
  // always want both updated together.
  mark_completed: z.boolean().optional().default(true),
});

/**
 * GET — fetch the current recording row (admin-only, used by the edit panel).
 * PUT — upsert the recording URL + visibility.
 * DELETE — remove the recording row (the parent webinar's status is left alone).
 *
 * Both writers update the linked `webinars.status` to `completed` when
 * `mark_completed` is true (default). The recording-fetch endpoint requires
 * status === 'completed' before serving the URL, so without this most admins
 * would set the URL and then wonder why the page still says "not available".
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
  }
  if (auth.admin.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: webinar } = await supabaseAdmin
    .from("webinars")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const { data: recording } = await supabaseAdmin
    .from("webinar_recordings")
    .select("url, is_public, updated_at")
    .eq("webinar_id", id)
    .maybeSingle();

  return NextResponse.json({
    data: {
      status: webinar.status,
      recording: recording ?? null,
    },
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
  }
  if (auth.admin.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Confirm the webinar exists before writing the child row.
  const { data: webinar } = await supabaseAdmin
    .from("webinars")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  // The path must be scoped to this specific webinar — defence-in-depth so a
  // crafted PUT can't link recording from another webinar's folder.
  const expectedPrefix = `webinars/${id}/`;
  if (!parsed.data.path.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: `Path must start with ${expectedPrefix}` },
      { status: 400 }
    );
  }

  const { error: upsertError } = await supabaseAdmin
    .from("webinar_recordings")
    .upsert(
      {
        webinar_id: id,
        url: parsed.data.path, // stored as a Storage path; signed on demand at fetch time
        is_public: parsed.data.is_public,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "webinar_id" }
    );

  if (upsertError) {
    console.error("[recording] upsert error:", upsertError);
    return NextResponse.json(
      { error: `Could not save recording: ${upsertError.message}` },
      { status: 500 }
    );
  }

  if (parsed.data.mark_completed) {
    const { error: statusError } = await supabaseAdmin
      .from("webinars")
      .update({ status: "completed" })
      .eq("id", id);
    if (statusError) {
      // Recording saved but status didn't flip — surface a soft error so the
      // admin knows the page won't open the recording until they fix it.
      console.error("[recording] status update error:", statusError);
      return NextResponse.json(
        {
          warning: `Recording saved, but couldn't flip status to completed: ${statusError.message}`,
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
  }
  if (auth.admin.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read the row first so we can clean up the Storage object too. Legacy
  // entries may store an absolute URL (https://…) instead of a path — only
  // delete from Storage when it looks like one of our paths.
  const { data: existing } = await supabaseAdmin
    .from("webinar_recordings")
    .select("url")
    .eq("webinar_id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("webinar_recordings")
    .delete()
    .eq("webinar_id", id);
  if (error) {
    return NextResponse.json(
      { error: `Could not delete recording: ${error.message}` },
      { status: 500 }
    );
  }

  if (existing?.url && existing.url.startsWith(`webinars/${id}/`)) {
    const { error: storageError } = await supabaseAdmin.storage
      .from("course-videos")
      .remove([existing.url]);
    if (storageError) {
      // The DB row is gone; surfacing this as a soft warning lets the admin
      // know they may want to clean Storage manually but doesn't block the UI.
      console.error("[recording] storage delete error:", storageError);
      return NextResponse.json(
        {
          warning: `Recording row removed, but the file in Storage couldn't be deleted: ${storageError.message}`,
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
