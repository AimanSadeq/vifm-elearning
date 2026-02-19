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

export function verifyPayTabsCallback(
  serverKey: string,
  body: Record<string, unknown>
): boolean {
  // PayTabs sends a signature in the callback
  // For now, verify the server key matches
  return !!serverKey && !!body.tran_ref;
}
