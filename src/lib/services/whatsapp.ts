/**
 * WhatsApp service.
 *
 * Twilio SDK is not installed yet. Until it is, this file fails loudly in
 * production and no-ops in development. Previously a stub returned
 * `{success:true}` and silently dropped every message — admins thought
 * they'd notified a learner who never received anything.
 *
 * To enable real sending:
 *   1. `npm i twilio`
 *   2. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER to env
 *   3. Replace the body of sendWhatsAppMessage with the real Twilio call.
 */

interface WhatsAppResult {
  messageId: string;
  success: boolean;
}

let warnedDev = false;

export async function sendWhatsAppMessage(_params: {
  to: string;
  body: string;
}): Promise<WhatsAppResult> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "WhatsApp delivery is not configured. Install `twilio`, set TWILIO_* env vars, and wire the SDK into src/lib/services/whatsapp.ts before calling this in production."
    );
  }
  if (!warnedDev) {
    warnedDev = true;
    console.warn(
      "[whatsapp] WhatsApp delivery is not wired up — message skipped in dev."
    );
  }
  return { messageId: `wa_dev_${Date.now()}`, success: false };
}
