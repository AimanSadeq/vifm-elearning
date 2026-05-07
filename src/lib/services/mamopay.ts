/**
 * MamoPay Business API client.
 *
 * Docs: https://mamopay.readme.io/reference
 *
 * Auth: Bearer <MAMOPAY_API_KEY> (get from MamoPay dashboard → Developer)
 *
 * Base URLs:
 *   sandbox    https://sandbox.dev.business.mamopay.com/manage_api/v1/
 *   production https://business.mamopay.com/manage_api/v1/
 *
 * Set MAMOPAY_ENV=sandbox|production (defaults to sandbox).
 */

import crypto from "node:crypto";

const SANDBOX_BASE = "https://sandbox.dev.business.mamopay.com/manage_api/v1";
const PROD_BASE = "https://business.mamopay.com/manage_api/v1";
const FETCH_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function baseUrl() {
  return process.env.MAMOPAY_ENV === "production" ? PROD_BASE : SANDBOX_BASE;
}

function apiKey() {
  const key = process.env.MAMOPAY_API_KEY;
  if (!key) throw new Error("MAMOPAY_API_KEY is not set");
  return key;
}

interface CreateLinkOptions {
  /** Order/description shown on the hosted checkout */
  title: string;
  /** Long description shown on the hosted checkout (≤75 chars) */
  description?: string;
  /** Amount, must be ≥ 2 in the chosen currency */
  amount: number;
  /** AED | USD | EUR | GBP | SAR */
  currency: string;
  /** Where the customer is sent on success */
  returnUrl: string;
  /** Where the customer is sent on failure */
  failureReturnUrl?: string;
  /** Your internal reference (we pass the payments.id here) */
  externalId?: string;
  /** Limit usage to 1 — single-use checkout */
  capacity?: number;
  /** Allow card and Apple Pay etc. by default */
  paymentMethods?: string[];
  /** Pre-fill customer info */
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

interface CreateLinkResponse {
  /** Mamo's payment link ID */
  id: string;
  /** Hosted checkout URL — send the customer here */
  paymentUrl: string;
  /** Raw response for debugging */
  raw: Record<string, unknown>;
}

export async function createPaymentLink(
  opts: CreateLinkOptions
): Promise<CreateLinkResponse> {
  const body: Record<string, unknown> = {
    title: opts.title.slice(0, 50),
    description: opts.description?.slice(0, 75),
    amount: Math.max(2, Math.round(opts.amount * 100) / 100),
    amount_currency: opts.currency.toUpperCase(),
    return_url: opts.returnUrl,
    failure_return_url: opts.failureReturnUrl ?? opts.returnUrl,
    external_id: opts.externalId,
    capacity: opts.capacity ?? 1,
    active: true,
    save_card: "off",
    enable_customer_details: true,
    payment_methods: opts.paymentMethods ?? ["card"],
  };

  if (opts.customer?.email) {
    body.customer = {
      email: opts.customer.email,
      first_name: opts.customer.firstName,
      last_name: opts.customer.lastName,
      phone: opts.customer.phone,
    };
  }

  const res = await fetchWithTimeout(`${baseUrl()}/links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      (json?.message as string) ||
      (json?.error as string) ||
      `MamoPay error ${res.status}`;
    throw new Error(`MamoPay createPaymentLink failed: ${msg}`);
  }

  // MamoPay sometimes nests the payload under `data` and uses different URL
  // field names depending on link_type. Cover the common shapes.
  const data = (json.data as Record<string, unknown> | undefined) ?? json;
  const id = (data.id as string) ?? (json.id as string);
  const paymentUrl =
    (data.payment_url as string) ??
    (data.short_url as string) ??
    (data.url as string) ??
    (json.payment_url as string) ??
    "";

  if (!id || !paymentUrl) {
    throw new Error(
      `MamoPay returned no id/payment_url. Raw: ${JSON.stringify(json).slice(0, 300)}`
    );
  }

  return { id, paymentUrl, raw: json };
}

/**
 * Verify a webhook callback by:
 *   1. (preferred) Validating the X-Mamo-Signature HMAC if MAMOPAY_WEBHOOK_SECRET is set
 *   2. (fallback) Re-fetching the charge from Mamo's API and confirming status
 *
 * Returns true if the webhook is trustworthy, false otherwise.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.MAMOPAY_WEBHOOK_SECRET;
  if (!secret) {
    // No secret configured → can't verify with HMAC; caller should fall back
    // to re-fetching the charge from Mamo to confirm.
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Mamo's header is hex-encoded; some integrations include `sha256=` prefix.
  const provided = signatureHeader.replace(/^sha256=/, "").trim();

  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(provided, "hex")
  );
}

/** Fetch a charge by ID — used as a server-side trust check after a webhook. */
export async function fetchCharge(
  chargeId: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetchWithTimeout(`${baseUrl()}/charges/${chargeId}`, {
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
  } catch {
    // Timeout or network failure — caller treats as "can't verify".
    return null;
  }
}

export const MamoPay = {
  createPaymentLink,
  verifyWebhookSignature,
  fetchCharge,
};
