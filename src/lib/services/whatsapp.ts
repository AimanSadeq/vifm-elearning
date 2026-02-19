// Stub service for WhatsApp (Twilio) integration
// Replace with actual Twilio API calls in production

interface WhatsAppResult {
  messageId: string;
  success: boolean;
}

export async function sendWhatsAppMessage(params: {
  to: string;
  body: string;
}): Promise<WhatsAppResult> {
  console.log("[STUB] sendWhatsAppMessage:", params);
  return { messageId: `wa_${Date.now()}`, success: true };
}
