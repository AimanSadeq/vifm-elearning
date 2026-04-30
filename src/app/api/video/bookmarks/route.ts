import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

const BOOKMARK_TYPES = ["note", "highlight", "question", "important"] as const;
const BOOKMARK_COLORS = [
  "yellow",
  "red",
  "green",
  "blue",
  "purple",
  "orange",
] as const;

// Length and enum caps so a malicious or buggy client can't dump multi-MB
// notes / arbitrary type strings into the table — both would later be
// rendered into admin / lesson UIs.
const createBookmarkSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  timestampSeconds: z.number().int().min(0).max(86_400).optional(),
  note: z.string().max(1000).optional(),
  bookmarkType: z.enum(BOOKMARK_TYPES).optional(),
  color: z.enum(BOOKMARK_COLORS).optional(),
});

const updateBookmarkSchema = z.object({
  id: z.string().uuid(),
  note: z.string().max(1000).optional(),
  bookmarkType: z.enum(BOOKMARK_TYPES).optional(),
  color: z.enum(BOOKMARK_COLORS).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId || !isUuid(lessonId)) {
      return NextResponse.json(
        { error: "Valid lessonId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("lesson_bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .order("timestamp_seconds", { ascending: true });

    if (error) {
      console.error("bookmarks list failed", error);
      return NextResponse.json(
        { error: "Could not load bookmarks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = createBookmarkSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { lessonId, courseId, timestampSeconds, note, bookmarkType, color } =
      parsed.data;

    const { data, error } = await supabase
      .from("lesson_bookmarks")
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        timestamp_seconds: timestampSeconds ?? 0,
        note: note ?? "",
        bookmark_type: bookmarkType ?? "note",
        color: color ?? "yellow",
      })
      .select()
      .single();

    if (error) {
      console.error("bookmark create failed", error);
      return NextResponse.json(
        { error: "Could not create bookmark" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = updateBookmarkSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { id, note, bookmarkType, color } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (note !== undefined) updateData.note = note;
    if (bookmarkType !== undefined) updateData.bookmark_type = bookmarkType;
    if (color !== undefined) updateData.color = color;

    const { data, error } = await supabase
      .from("lesson_bookmarks")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("bookmark update failed", error);
      return NextResponse.json(
        { error: "Could not update bookmark" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !isUuid(id)) {
      return NextResponse.json(
        { error: "Valid id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("lesson_bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("bookmark delete failed", error);
      return NextResponse.json(
        { error: "Could not delete bookmark" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
