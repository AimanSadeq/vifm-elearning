import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Wrap the build with the analyzer when ANALYZE=true. Run as:
//   ANALYZE=true npm run build
// → outputs HTML reports under .next/analyze/ for client + server bundles.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Defence-in-depth headers applied to every response. CSP is intentionally
// omitted here — it requires per-deploy tuning (Stripe/Supabase/MamoPay/
// PayTabs origins + the Next.js inline-script bootstrapping) and a wrong
// CSP breaks the live app silently. Add it deliberately, in Report-Only
// first, once we have the full origin inventory. Everything below is
// universally safe and adds no behavioural risk.
const securityHeaders = [
  // Block clickjacking. We don't iframe ourselves anywhere.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers MIME-sniffing responses into something else (esp. JSON
  // API responses being rendered as HTML).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Trim referrer leakage to third parties (PayTabs/MamoPay redirects, etc.).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down sensitive browser features we don't use.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
  },
  // 2-year HSTS with preload eligibility. Only effective when served over
  // HTTPS (Render terminates TLS for us in production).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Cross-origin isolation primitives — safe defaults that don't affect
  // current integrations (Stripe/Supabase aren't loaded as cross-origin
  // iframes from us, and our images use same-origin proxying).
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Make sure the .pptx certificate template ships with the standalone build
  // — Next's tracer only follows JS imports, so a runtime fs.readFileSync
  // wouldn't otherwise be detected.
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/lib/services/templates/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
