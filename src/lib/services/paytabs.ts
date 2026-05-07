const PAYTABS_SERVER_KEY = process.env.PAYTABS_SERVER_KEY ?? "";
const PAYTABS_PROFILE_ID = process.env.PAYTABS_PROFILE_ID ?? "";
const PAYTABS_BASE_URL =
  process.env.PAYTABS_BASE_URL ?? "https://secure.paytabs.sa";
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

interface CreatePaymentPageParams {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerName: string;
  callbackUrl: string;
  returnUrl: string;
}

interface PayTabsResponse {
  redirect_url: string;
  tran_ref: string;
  [key: string]: unknown;
}

export async function createPaymentPage(
  params: CreatePaymentPageParams
): Promise<PayTabsResponse> {
  const response = await fetchWithTimeout(`${PAYTABS_BASE_URL}/payment/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: PAYTABS_SERVER_KEY,
    },
    body: JSON.stringify({
      profile_id: PAYTABS_PROFILE_ID,
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: params.orderId,
      cart_description: params.description,
      cart_currency: params.currency,
      cart_amount: params.amount,
      customer_details: {
        name: params.customerName,
        email: params.customerEmail,
      },
      callback: params.callbackUrl,
      return: params.returnUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`PayTabs API error: ${response.statusText}`);
  }

  const json = (await response.json().catch(() => null)) as PayTabsResponse | null;
  // PayTabs occasionally returns 200 with an error payload that lacks the
  // hosted-page URL. If we don't validate here, the calling route will
  // happily insert a `payments` row with `paytabs_transaction_ref = undefined`
  // and redirect the customer to "undefined".
  if (
    !json ||
    typeof json.redirect_url !== "string" ||
    !json.redirect_url ||
    typeof json.tran_ref !== "string" ||
    !json.tran_ref
  ) {
    throw new Error(
      "PayTabs returned no redirect_url / tran_ref — refusing to create payment row"
    );
  }
  return json;
}

/**
 * Server-to-server query of a transaction's authoritative state.
 *
 * The IPN body is attacker-controllable (anyone can POST to the public
 * webhook URL). Rather than reimplementing PayTabs' canonical-string HMAC
 * scheme — which is easy to get subtly wrong — we trust ONLY what PayTabs
 * tells us when we ask them directly. Same trust model the MamoPay webhook
 * uses when its HMAC secret is unset.
 *
 * Returns the parsed query response, or null on network error / 4xx.
 */
export async function queryPayTabsTransaction(
  tranRef: string
): Promise<Record<string, unknown> | null> {
  if (!PAYTABS_SERVER_KEY || !PAYTABS_PROFILE_ID) return null;
  if (!tranRef) return null;
  try {
    const response = await fetchWithTimeout(`${PAYTABS_BASE_URL}/payment/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: PAYTABS_SERVER_KEY,
      },
      body: JSON.stringify({
        profile_id: PAYTABS_PROFILE_ID,
        tran_ref: tranRef,
      }),
    });
    if (!response.ok) return null;
    return (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
  } catch {
    return null;
  }
}
