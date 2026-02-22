import { createHmac } from "crypto";

const PAYTABS_SERVER_KEY = process.env.PAYTABS_SERVER_KEY ?? "";
const PAYTABS_PROFILE_ID = process.env.PAYTABS_PROFILE_ID ?? "";
const PAYTABS_BASE_URL =
  process.env.PAYTABS_BASE_URL ?? "https://secure.paytabs.sa";

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
  const response = await fetch(`${PAYTABS_BASE_URL}/payment/request`, {
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

  return response.json();
}

/**
 * Verify PayTabs IPN callback signature.
 * PayTabs signs callbacks with HMAC-SHA256 using the server key.
 */
export function verifyPayTabsCallback(
  body: Record<string, unknown>
): boolean {
  if (!PAYTABS_SERVER_KEY) return false;

  const signature = body.signature as string | undefined;
  if (!signature) return false;

  const tranRef = body.tran_ref as string;
  const cartAmount = body.cart_amount as string;
  const cartCurrency = body.cart_currency as string;
  const responseCode =
    (body.payment_result as Record<string, unknown>)?.response_code as string;

  if (!tranRef || !cartAmount || !cartCurrency || !responseCode) return false;

  // PayTabs HMAC: SHA256(server_key + tran_ref + cart_amount + cart_currency + response_code)
  const data = `${PAYTABS_SERVER_KEY}${tranRef}${cartAmount}${cartCurrency}${responseCode}`;
  const expectedSignature = createHmac("sha256", PAYTABS_SERVER_KEY)
    .update(data)
    .digest("hex");

  return signature === expectedSignature;
}
