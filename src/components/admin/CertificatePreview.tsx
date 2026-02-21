"use client";

import type { CertificateTemplateKey } from "@/types";

interface CertificatePreviewProps {
  templateKey: CertificateTemplateKey;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  organizationName: string;
}

export function CertificatePreview({
  templateKey,
  primaryColor,
  secondaryColor,
  accentColor,
  organizationName,
}: CertificatePreviewProps) {
  const containerClass =
    "relative aspect-[297/210] w-full rounded-lg border overflow-hidden bg-white text-center";

  if (templateKey === "modern") {
    return (
      <div className={containerClass}>
        {/* Left sidebar */}
        <div
          className="absolute inset-y-0 left-0 w-[15%]"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute inset-y-0 left-[14%] w-[1%]"
          style={{ backgroundColor: secondaryColor }}
        />

        {/* Content */}
        <div className="absolute inset-y-0 left-[20%] right-4 flex flex-col justify-center px-4">
          <p className="text-lg font-bold" style={{ color: primaryColor }}>
            Certificate
          </p>
          <p className="text-xs" style={{ color: accentColor }}>
            of Completion
          </p>
          <div
            className="my-2 h-[2px] w-24"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-[10px]" style={{ color: accentColor }}>
            This certificate is presented to
          </p>
          <p
            className="mt-1 text-base font-bold"
            style={{ color: primaryColor }}
          >
            John Doe
          </p>
          <div
            className="my-1 h-px w-32"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-[10px]" style={{ color: accentColor }}>
            for completing
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            Course Title
          </p>
        </div>
      </div>
    );
  }

  if (templateKey === "corporate") {
    return (
      <div className={containerClass}>
        {/* Header band */}
        <div
          className="flex h-[20%] items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-white">
            {organizationName}
          </p>
        </div>
        <div className="h-[2%]" style={{ backgroundColor: secondaryColor }} />

        {/* Body */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <p
            className="text-lg font-bold"
            style={{ color: primaryColor }}
          >
            Certificate of Completion
          </p>
          <p className="mt-1 text-[10px]" style={{ color: accentColor }}>
            This is to certify that
          </p>
          <p
            className="mt-1 text-base font-bold"
            style={{ color: primaryColor }}
          >
            John Doe
          </p>
          <div
            className="my-1 mx-auto h-px w-32"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-[10px]" style={{ color: accentColor }}>
            has completed
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            Course Title
          </p>
        </div>

        {/* Footer band */}
        <div
          className="absolute inset-x-0 bottom-0 h-[12%]"
          style={{ backgroundColor: primaryColor }}
        />
      </div>
    );
  }

  if (templateKey === "elegant") {
    return (
      <div className={containerClass}>
        {/* Corner ornaments */}
        <div
          className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2"
          style={{ borderColor: secondaryColor }}
        />

        {/* Outer border */}
        <div
          className="absolute inset-2 rounded border"
          style={{ borderColor: accentColor }}
        />

        {/* Body */}
        <div className="flex h-full flex-col items-center justify-center p-6">
          <p className="text-[9px] uppercase" style={{ color: accentColor }}>
            {organizationName}
          </p>
          <div
            className="my-1 h-px w-16"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-xl font-bold" style={{ color: primaryColor }}>
            Certificate
          </p>
          <p className="text-[10px] uppercase" style={{ color: accentColor }}>
            of Completion
          </p>
          <p className="mt-2 text-[9px]" style={{ color: accentColor }}>
            Presented to
          </p>
          <p
            className="mt-1 text-lg font-bold"
            style={{ color: primaryColor }}
          >
            John Doe
          </p>
          <div
            className="my-1 h-px w-24"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-[9px]" style={{ color: accentColor }}>
            for completing
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            Course Title
          </p>
        </div>

        {/* Seal */}
        <div
          className="absolute bottom-5 left-8 flex h-6 w-6 items-center justify-center rounded-full border-2"
          style={{ borderColor: secondaryColor }}
        >
          <span className="text-[5px] font-bold" style={{ color: secondaryColor }}>
            CERT
          </span>
        </div>
      </div>
    );
  }

  // Classic (default)
  return (
    <div className={containerClass}>
      {/* Double border */}
      <div
        className="absolute inset-2 rounded border-2"
        style={{ borderColor: primaryColor }}
      />
      <div
        className="absolute inset-3 rounded border"
        style={{ borderColor: primaryColor }}
      />

      <div className="flex h-full flex-col items-center justify-center p-8">
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: primaryColor }}
        >
          {organizationName}
        </p>
        <p
          className="mt-2 text-xl font-bold"
          style={{ color: primaryColor }}
        >
          Certificate of Completion
        </p>
        <div
          className="my-2 h-[2px] w-24"
          style={{ backgroundColor: secondaryColor }}
        />
        <p className="text-[10px]" style={{ color: accentColor }}>
          This is to certify that
        </p>
        <p
          className="mt-1 text-lg font-bold"
          style={{ color: primaryColor }}
        >
          John Doe
        </p>
        <p className="mt-1 text-[10px]" style={{ color: accentColor }}>
          has successfully completed the course
        </p>
        <p
          className="mt-1 text-sm font-semibold"
          style={{ color: primaryColor }}
        >
          Course Title
        </p>
      </div>
    </div>
  );
}
