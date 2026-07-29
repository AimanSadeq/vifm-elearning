import { redirect } from "next/navigation";
import { CertificateEditor } from "@/components/admin/cert-editor/CertificateEditor";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/services/role";
import type { CertLayout } from "@/lib/cert-layout/types";

import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * Server-side gate. The editor renders the layout JSON and lets users save
 * + upload .pptx files — both privileged actions, so we deliberately load
 * data with the service role *after* verifying the requester is a super
 * admin. The previous client-only fetch leaked rows to any logged-in user.
 */
export default async function EditCertificateTemplatePage({ params }: PageProps) {
  const { locale, id } = await params;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/admin/certificates/templates/${id}/edit`);
  }

  let allowed = isSuperAdmin(user);
  if (!allowed) {
    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };
    allowed = profile?.role === "super_admin";
  }
  if (!allowed) {
    redirect(`/${locale}/admin/dashboard`);
  }

  // Single round-trip — both the layout / pptx_path columns are guaranteed
  // by the migrations bundled with this feature. Returns null cleanly if
  // either column is unset for this row.
  const { data: row } = await supabaseAdmin
    .from("certificate_templates")
    .select("id, name, organization_name, layout, pptx_path, updated_at")
    .eq("id", id)
    .single();

  if (!row) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Template not found.
      </div>
    );
  }

  // Build the public URL of the uploaded .pptx with a cache-buster pinned
  // to the row's `updated_at`. Without it the iframe (Office Online) can
  // serve a stale render even after the admin replaces the file out of
  // band — the URL itself is otherwise stable.
  let pptxPublicUrl: string | null = null;
  const pptxPath = (row as { pptx_path?: string | null }).pptx_path ?? null;
  const updatedAt = (row as { updated_at?: string | null }).updated_at ?? "";
  if (pptxPath) {
    const { data: pub } = supabaseAdmin.storage
      .from("certificates")
      .getPublicUrl(pptxPath);
    if (pub?.publicUrl) {
      const v = encodeURIComponent(updatedAt || String(Date.now()));
      pptxPublicUrl = `${pub.publicUrl}?v=${v}`;
    }
  }

  return (
    <CertificateEditor
      templateId={row.id as string}
      templateName={row.name as string}
      initialLayout={
        ((row as { layout?: CertLayout | null }).layout) ?? null
      }
      initialPptxPath={pptxPath}
      initialPptxPublicUrl={pptxPublicUrl}
      organizationName={row.organization_name as string}
      locale={locale}
    />
  );
}
