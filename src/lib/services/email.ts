/**
 * Email service.
 *
 * Real Resend integration when `RESEND_API_KEY` is set. In production with
 * the key missing we throw — silently returning success masked the fact that
 * no enrollment confirmations or webinar reminders ever reached learners.
 * In development we log a one-time warning and short-circuit so a half-set
 * `.env.local` doesn't break the dev loop.
 */

import { Resend } from "resend";
import { env } from "@/lib/env";
import {
  canSendChannel,
  type NotificationChannel,
} from "./notification-preferences";

interface EmailResult {
  id: string;
  success: boolean;
  /** Set to true when the send was skipped because the user opted out. */
  skipped?: boolean;
}

let cachedClient: Resend | null = null;
let warnedAboutMissingKey = false;

function getClient(): Resend | null {
  if (cachedClient) return cachedClient;
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY is not configured. Set it in Render env vars or stop calling email service from this flow."
      );
    }
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.warn(
        "[email] RESEND_API_KEY not set — emails will be skipped in dev. " +
          "Set RESEND_API_KEY in .env.local to test real sending."
      );
    }
    return null;
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

function fromAddress(): string {
  return env.EMAIL_FROM || "VIFM Academy <noreply@learn.viftraining.com>";
}

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  const client = getClient();
  if (!client) return { id: "dev-skip", success: false };
  const { data, error } = await client.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });
  if (error || !data?.id) {
    throw new Error(`Resend error: ${error?.message ?? "unknown"}`);
  }
  return { id: data.id, success: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  // Body is admin-typed; treat as plain text and escape into the html slot.
  const html = `<div style="font-family: system-ui, sans-serif; line-height: 1.5;">${escapeHtml(
    params.body
  )
    .split("\n")
    .join("<br>")}</div>`;
  return send(params.to, params.subject, html);
}

export async function sendEnrollmentConfirmation(params: {
  to: string;
  userName: string;
  courseName: string;
}): Promise<EmailResult> {
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">
      <h2>Welcome to ${escapeHtml(params.courseName)}</h2>
      <p>Hi ${escapeHtml(params.userName)},</p>
      <p>You're enrolled. Sign in any time at <a href="${env.NEXT_PUBLIC_APP_URL ?? ""}">VIFM Academy</a> to start learning.</p>
      <p>— VIFM Academy</p>
    </div>
  `;
  return send(params.to, `Enrollment confirmed — ${params.courseName}`, html);
}

export async function sendWebinarReminder(params: {
  to: string;
  userName: string;
  webinarTitle: string;
  scheduledAt: string;
  joinUrl: string;
  /** When set, respects the user's webinar_reminders preference. */
  userId?: string;
}): Promise<EmailResult> {
  if (params.userId) {
    const allowed = await canSendChannel(params.userId, "webinar_reminders");
    if (!allowed) return { id: "opt-out", success: false, skipped: true };
  }
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">
      <h2>${escapeHtml(params.webinarTitle)}</h2>
      <p>Hi ${escapeHtml(params.userName)},</p>
      <p>Reminder: your webinar starts at ${escapeHtml(params.scheduledAt)}.</p>
      <p><a href="${encodeURI(params.joinUrl)}" style="display:inline-block;padding:10px 18px;background:#134BA1;color:#fff;text-decoration:none;border-radius:6px;">Join the webinar</a></p>
    </div>
  `;
  return send(params.to, `Reminder: ${params.webinarTitle}`, html);
}

/**
 * Send a marketing/announcement email, gated on the user's marketing_emails
 * preference. Returns { skipped: true } if the user has opted out — callers
 * should treat this as success (not an error).
 *
 * For transactional sends (enrollment confirmation, password reset, voucher
 * delivery) use sendEmail / sendEnrollmentConfirmation directly — those
 * bypass preferences by design.
 */
export async function sendMarketingEmail(params: {
  to: string;
  userId: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const allowed = await canSendChannel(params.userId, "marketing_emails");
  if (!allowed) return { id: "opt-out", success: false, skipped: true };
  return send(params.to, params.subject, params.html);
}

/**
 * Generic gated sender. Use when you have the userId and want to respect a
 * specific channel preference (course_updates, etc.).
 */
export async function sendEmailIfAllowed(params: {
  to: string;
  userId: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  const allowed = await canSendChannel(params.userId, params.channel);
  if (!allowed) return { id: "opt-out", success: false, skipped: true };
  return sendEmail({ to: params.to, subject: params.subject, body: params.body });
}
