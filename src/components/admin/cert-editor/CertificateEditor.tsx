"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CertificateCanvas } from "./CertificateCanvas";
import { PlaceholdersPanel } from "./PlaceholdersPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { Button } from "@/components/ui/button";
import { DEFAULT_LAYOUT } from "@/lib/cert-layout/default-layout";
import type { CertElement, CertLayout, TextElement } from "@/lib/cert-layout/types";

interface CertificateEditorProps {
  templateId: string;
  templateName: string;
  initialLayout: CertLayout | null;
  initialPptxPath: string | null;
  initialPptxPublicUrl: string | null;
  organizationName: string;
  locale: string;
}

export function CertificateEditor({
  templateId,
  templateName,
  initialLayout,
  initialPptxPath,
  initialPptxPublicUrl,
  organizationName,
  locale,
}: CertificateEditorProps) {
  const router = useRouter();
  const [layout, setLayout] = useState<CertLayout>(
    initialLayout ?? DEFAULT_LAYOUT
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pptxPath, setPptxPath] = useState<string | null>(initialPptxPath);
  const [pptxPublicUrl, setPptxPublicUrl] = useState<string | null>(
    initialPptxPublicUrl
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Placeholders discovered in the active .pptx + admin-set values per token.
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [placeholdersLoading, setPlaceholdersLoading] = useState(true);

  const fetchPlaceholders = useCallback(async () => {
    setPlaceholdersLoading(true);
    try {
      const res = await fetch(
        `/api/admin/certificate-templates/${templateId}/placeholders`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Discovery failed (${res.status})`);
      const json = await res.json();
      setPlaceholders((json.placeholders as string[]) ?? []);
      setPlaceholderValues((json.values as Record<string, string>) ?? {});
    } catch (error) {
      console.warn("[cert-editor] placeholder discovery failed", error);
    } finally {
      setPlaceholdersLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchPlaceholders();
  }, [fetchPlaceholders]);

  const onPlaceholderValuesChange = useCallback(
    (next: Record<string, string>) => {
      setPlaceholderValues(next);
      setIsDirty(true);
    },
    []
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<CertElement>) => {
      setLayout((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as CertElement) : el
        ),
      }));
      setIsDirty(true);
    },
    []
  );

  const moveElement = useCallback((id: string, x: number, y: number) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? ({ ...el, x, y } as CertElement) : el
      ),
    }));
    setIsDirty(true);
  }, []);

  const deleteElement = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    setSelectedId(null);
    setIsDirty(true);
  }, []);

  const addText = useCallback(() => {
    const id = `text-${crypto.randomUUID()}`;
    const next: TextElement = {
      id,
      type: "text",
      label: "New text",
      x: 50,
      y: 50,
      text: "New text",
      fontSize: 24,
      fontFamily: "sans",
      fontWeight: 400,
      fontStyle: "normal",
      color: "#1F2937",
      align: "center",
    };
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, next] }));
    setSelectedId(id);
    setIsDirty(true);
  }, []);

  const updateCanvas = useCallback(
    (patch: Partial<Pick<CertLayout, "background">>) => {
      setLayout((prev) => ({ ...prev, ...patch }));
      setIsDirty(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/admin/certificate-templates/${templateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout, placeholderValues }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      toast.success("Saved");
      setIsDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [layout, placeholderValues, templateId]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadPptx = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
          `/api/admin/certificate-templates/${templateId}/upload-pptx`,
          { method: "POST", body: formData }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
        setPptxPath(json.pptx_path);
        // Build public URL on the client (same path, public bucket). Cache-bust
        // so Office Online refetches instead of serving a stale render.
        if (typeof json.pptx_path === "string") {
          const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseBase) {
            setPptxPublicUrl(
              `${supabaseBase}/storage/v1/object/public/certificates/${json.pptx_path}?v=${Date.now()}`
            );
          }
        }
        // Always reconcile with the server: discovery returns the canonical
        // placeholder list AND the row's saved `placeholder_values`. Without
        // this the local `placeholderValues` map could disagree with what the
        // PATCH endpoint will accept on Save.
        await fetchPlaceholders();
        toast.success("Template uploaded — new certificates will use this file");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [templateId, fetchPlaceholders]
  );

  const handleClearPptx = useCallback(async () => {
    if (!pptxPath) return;
    try {
      const res = await fetch(
        `/api/admin/certificate-templates/${templateId}/upload-pptx`,
        { method: "DELETE" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Remove failed (${res.status})`);
      setPptxPath(null);
      setPptxPublicUrl(null);
      fetchPlaceholders();
      toast.success("Custom template removed — using bundled default");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Remove failed";
      toast.error(message);
    }
  }, [pptxPath, templateId, fetchPlaceholders]);

  const handleDownloadSample = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/certificate-templates/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, organizationName }),
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `Preview failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vifm-certificate-preview.pptx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Preview failed";
      toast.error(message);
    }
  }, [organizationName, templateId]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/admin/certificates/templates`)}
          >
            <ArrowLeft className="me-1 h-4 w-4" />
            Templates
          </Button>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <h1 className="hidden font-heading text-lg font-semibold sm:block">
            {templateName}
          </h1>
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pptxPath ? (
            <div className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              <FileText className="h-3.5 w-3.5" />
              Custom .pptx active
              <button
                type="button"
                onClick={handleClearPptx}
                className="ms-1 rounded-full p-0.5 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/50"
                title="Remove uploaded .pptx"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePickFile}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="me-1 h-4 w-4" />
            )}
            {pptxPath ? "Replace .pptx" : "Upload .pptx"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={handleUploadPptx}
          />
          <Button variant="outline" size="sm" onClick={handleDownloadSample}>
            <Download className="me-1 h-4 w-4" />
            Sample (.pptx)
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? (
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="me-1 h-4 w-4" />
            )}
            Save layout
          </Button>
        </div>
      </div>

      {!pptxPath && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <strong>Heads up:</strong> the layout you edit on the canvas is saved
          alongside the template, but issued certificates currently render from
          the bundled <code>vifm-classic.pptx</code>. Upload your own .pptx
          (above) to take full control of the design.
        </div>
      )}
      {pptxPath && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <strong>Custom .pptx is active.</strong> The visual design comes from
          your uploaded file — we can't pixel-render an arbitrary .pptx in the
          browser, so there's no live canvas preview here. Click{" "}
          <strong>Sample (.pptx)</strong> to download a personalized copy and
          inspect the real layout in PowerPoint or Keynote. Set placeholder
          values on the right.
        </div>
      )}
      {/* Body — left canvas, right properties */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="mx-auto max-w-[1100px]">
            {pptxPath ? (
              <UploadedPptxPanel
                publicUrl={pptxPublicUrl}
                onDownloadSample={handleDownloadSample}
                onReplace={handlePickFile}
                onClear={handleClearPptx}
              />
            ) : (
              <CertificateCanvas
                layout={layout}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={moveElement}
              />
            )}
          </div>
        </div>
        <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-background">
          {/* The Layers + Canvas panel is only meaningful when the bundled
              JSON layout is the source. With a custom .pptx active, those
              controls don't drive anything that gets generated, so we hide
              them and let Placeholders take the full sidebar. */}
          {!pptxPath && (
            <div className="flex-1 overflow-hidden">
              <PropertiesPanel
                layout={layout}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdate={updateElement}
                onDelete={deleteElement}
                onAddText={addText}
                onCanvasChange={updateCanvas}
              />
            </div>
          )}
          <div
            className={
              pptxPath
                ? "flex-1 overflow-hidden"
                : "border-t border-border bg-muted/30"
            }
          >
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold">Placeholders</h3>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {placeholders.length} found
              </span>
            </div>
            <div
              className={pptxPath ? "h-full overflow-y-auto" : "max-h-72 overflow-y-auto"}
            >
              <PlaceholdersPanel
                placeholders={placeholders}
                values={placeholderValues}
                onChange={onPlaceholderValuesChange}
                isLoading={placeholdersLoading}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadedPptxPanel({
  publicUrl,
  onDownloadSample,
  onReplace,
  onClear,
}: {
  publicUrl: string | null;
  onDownloadSample: () => void;
  onReplace: () => void;
  onClear: () => void;
}) {
  // Microsoft hosts a free Office Online viewer that renders any public
  // .pptx in an iframe. Since the `certificates` bucket is public, the .pptx
  // URL is reachable and we can hand it to the viewer for an actual visual
  // preview (vs. our HTML approximation, which can't represent arbitrary
  // PowerPoint designs).
  //
  // Privacy note: rendering goes through a third-party (MSFT). The .pptx is
  // fetched from the public bucket and may be cached on their CDN. Don't
  // upload templates that contain confidential text.
  const viewerSrc = publicUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`
    : null;

  // Track viewer health: if the iframe never finishes loading (corp network
  // blocking the host, MSFT outage, etc.) we surface a fallback after a
  // short timeout instead of leaving a blank box.
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [viewerStalled, setViewerStalled] = useState(false);
  useEffect(() => {
    if (!viewerSrc) return;
    setViewerLoaded(false);
    setViewerStalled(false);
    const t = setTimeout(() => setViewerStalled(true), 12_000);
    return () => clearTimeout(t);
  }, [viewerSrc]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={onDownloadSample} variant="outline" size="sm">
          <Download className="me-2 h-4 w-4" />
          Sample (personalized)
        </Button>
        <Button onClick={onReplace} variant="outline" size="sm">
          <Upload className="me-2 h-4 w-4" />
          Replace .pptx
        </Button>
        <Button onClick={onClear} variant="ghost" size="sm">
          <X className="me-2 h-4 w-4" />
          Remove
        </Button>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <strong>Preview hosted by Microsoft.</strong> The viewer fetches your
        .pptx from its public storage URL, which means the file passes through
        Microsoft's servers and may be cached on their CDN. Don't upload
        templates that contain confidential information you wouldn't want
        third-party rendered.
      </p>

      {viewerSrc ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {!viewerLoaded && !viewerStalled && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              Loading preview…
            </div>
          )}
          {viewerStalled && !viewerLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/95 p-6 text-center text-sm text-muted-foreground dark:bg-card/95">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p>
                Preview didn't load — your network may block{" "}
                <code>view.officeapps.live.com</code>. Click{" "}
                <strong>Sample (personalized)</strong> above to verify the
                design instead.
              </p>
            </div>
          )}
          <iframe
            key={viewerSrc /* force reload on URL change */}
            src={viewerSrc}
            title="Certificate template preview"
            className="block w-full"
            style={{ aspectRatio: "297 / 210", minHeight: 480 }}
            // Restrict what the embedded viewer can do; allow-same-origin is
            // needed for Office Online to function.
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
            allowFullScreen
            onLoad={() => setViewerLoaded(true)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-white p-10 text-center shadow-sm dark:border-emerald-900/50 dark:bg-card">
          <FileText className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          <p className="mt-4 text-sm text-muted-foreground">
            Custom .pptx active. The public preview URL isn't available — use
            the buttons above to download or replace the file.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        To edit the design, open the file in PowerPoint or Keynote locally
        and click <strong>Replace .pptx</strong> when done. The placeholder
        tokens (e.g. <code>{`{{ATTENDEE_NAME}}`}</code>) shown in the preview
        are substituted at certificate-issue time.
      </p>
    </div>
  );
}
