/**
 * Microsoft Graph (Outlook / Microsoft 365) mail sender.
 *
 * Uses the OAuth2 client-credentials (app-only) flow with an Azure AD app
 * registration that has the `Mail.Send` *application* permission granted
 * (admin consent required). Mail is sent as OUTLOOK_SENDER_EMAIL via the
 * Graph `/users/{sender}/sendMail` endpoint.
 *
 * This is the only way to drive Microsoft 365 from app credentials — Supabase
 * custom SMTP can't, because it only speaks basic-auth SMTP, which Microsoft
 * is retiring. We call this from the Auth Send Email Hook.
 */

import { env } from "@/lib/env";

interface OutlookConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  sender: string;
}

export function isOutlookConfigured(): boolean {
  return Boolean(
    env.OUTLOOK_TENANT_ID &&
      env.OUTLOOK_CLIENT_ID &&
      env.OUTLOOK_CLIENT_SECRET &&
      env.OUTLOOK_SENDER_EMAIL,
  );
}

function getConfig(): OutlookConfig {
  const tenantId = env.OUTLOOK_TENANT_ID;
  const clientId = env.OUTLOOK_CLIENT_ID;
  const clientSecret = env.OUTLOOK_CLIENT_SECRET;
  const sender = env.OUTLOOK_SENDER_EMAIL;
  if (!tenantId || !clientId || !clientSecret || !sender) {
    throw new Error(
      "Outlook email is not configured. Set OUTLOOK_TENANT_ID, " +
        "OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_SENDER_EMAIL.",
    );
  }
  return { tenantId, clientId, clientSecret, sender };
}

// App-only tokens are valid ~1h. Cache and reuse until shortly before expiry
// so a burst of sends doesn't hit the token endpoint on every message.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: OutlookConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(
      cfg.tenantId,
    )}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Outlook token request failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

export async function sendOutlookEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const cfg = getConfig();
  const token = await getAccessToken(cfg);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      cfg.sender,
    )}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: params.subject,
          body: { contentType: "HTML", content: params.html },
          toRecipients: [{ emailAddress: { address: params.to } }],
        },
        // These are transactional auth emails — don't clutter the shared
        // mailbox's Sent Items.
        saveToSentItems: false,
      }),
    },
  );

  // Graph returns 202 Accepted on success (res.ok covers 200–299).
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Outlook sendMail failed (${res.status}): ${detail}`);
  }
}
