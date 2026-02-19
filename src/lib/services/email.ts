// Stub service for email (Resend) integration
// Replace with actual Resend API calls in production

interface EmailResult {
  id: string;
  success: boolean;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  console.log("[STUB] sendEmail:", params);
  return { id: `email_${Date.now()}`, success: true };
}

export async function sendEnrollmentConfirmation(params: {
  to: string;
  userName: string;
  courseName: string;
}): Promise<EmailResult> {
  console.log("[STUB] sendEnrollmentConfirmation:", params);
  return { id: `email_${Date.now()}`, success: true };
}

export async function sendWebinarReminder(params: {
  to: string;
  userName: string;
  webinarTitle: string;
  scheduledAt: string;
  joinUrl: string;
}): Promise<EmailResult> {
  console.log("[STUB] sendWebinarReminder:", params);
  return { id: `email_${Date.now()}`, success: true };
}
