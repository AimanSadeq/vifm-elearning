/**
 * Email service.
 *
 * Sends through Microsoft Graph (Outlook) when the OUTLOOK_* vars are set. In
 * production with them missing we throw — silently returning success masked
 * the fact that no enrollment confirmations or webinar reminders ever reached
 * learners. In development we log a one-time warning and short-circuit so a
 * half-set `.env.local` doesn't break the dev loop.
 */

import { env } from "@/lib/env";
import {
  canSendChannel,
  type NotificationChannel,
} from "./notification-preferences";
import { isOutlookConfigured, sendOutlookEmail } from "./outlook";
import { getSetting } from "./site-settings";

interface EmailResult {
  id: string;
  success: boolean;
  /** Set to true when the send was skipped because the user opted out. */
  skipped?: boolean;
}

interface EmailTemplateRow {
  key: string;
  name?: string;
  subject: string;
  html: string;
}

async function getEmailTemplate(key: string): Promise<EmailTemplateRow | null> {
  const templates = await getSetting<EmailTemplateRow[]>("email_templates", []);
  return templates.find((t) => t.key === key) ?? null;
}

/** Replaces `{{name}}` placeholders with values from `vars`. */
function applyTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? "");
}

let warnedAboutMissingConfig = false;

/**
 * Returns true when Outlook is configured and we should actually send. In
 * production a missing config throws (callers must not silently no-op); in dev
 * it warns once and short-circuits. Mail is sent from OUTLOOK_SENDER_EMAIL —
 * Graph sends as the configured mailbox, so there's no per-message "from".
 */
function ensureConfigured(): boolean {
  if (isOutlookConfigured()) return true;
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Outlook email is not configured. Set OUTLOOK_TENANT_ID, " +
        "OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_SENDER_EMAIL " +
        "in Render env vars, or stop calling the email service from this flow."
    );
  }
  if (!warnedAboutMissingConfig) {
    warnedAboutMissingConfig = true;
    console.warn(
      "[email] Outlook not configured emails will be skipped in dev. " +
        "Set OUTLOOK_* in .env.local to test real sending."
    );
  }
  return false;
}

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!ensureConfigured()) return { id: "dev-skip", success: false };
  // Graph sendMail returns 202 with no body / message id; synthesize one so
  // callers that log or store the result still get a stable value.
  await sendOutlookEmail({ to, subject, html });
  return { id: `outlook:${to}`, success: true };
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
  const vars = {
    userName: escapeHtml(params.userName),
    courseName: escapeHtml(params.courseName),
    appUrl: env.NEXT_PUBLIC_APP_URL ?? "",
  };

  const tpl = await getEmailTemplate("enrollment_confirmation");
  const subject = tpl?.subject
    ? applyTemplate(tpl.subject, vars)
    : `Enrollment confirmed ${params.courseName}`;
  const body = tpl?.html
    ? applyTemplate(tpl.html, vars)
    : `<h2>Welcome to ${vars.courseName}</h2>
       <p>Hi ${vars.userName},</p>
       <p>You're enrolled. Sign in any time at <a href="${vars.appUrl}">VIFM Academy</a> to start learning.</p>
       <p> VIFM Academy</p>`;

  const html = `<div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">${body}</div>`;
  return send(params.to, subject, html);
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
  const vars = {
    userName: escapeHtml(params.userName),
    webinarTitle: escapeHtml(params.webinarTitle),
    scheduledAt: escapeHtml(params.scheduledAt),
    joinUrl: encodeURI(params.joinUrl),
  };
  const tpl = await getEmailTemplate("webinar_reminder");
  const subject = tpl?.subject
    ? applyTemplate(tpl.subject, vars)
    : `Reminder: ${params.webinarTitle}`;
  const body = tpl?.html
    ? applyTemplate(tpl.html, vars)
    : `<h2>${vars.webinarTitle}</h2>
       <p>Hi ${vars.userName},</p>
       <p>Reminder: your webinar starts at ${vars.scheduledAt}.</p>
       <p><a href="${vars.joinUrl}" style="display:inline-block;padding:10px 18px;background:#134BA1;color:#fff;text-decoration:none;border-radius:6px;">Join the webinar</a></p>`;
  const html = `<div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">${body}</div>`;
  return send(params.to, subject, html);
}

/**
 * Notify a learner that training was assigned to them. Transactional (bypasses
 * notification preferences by design — mandatory training must reach the
 * learner). Template key: `training_assigned`.
 */
export async function sendTrainingAssignedEmail(params: {
  to: string;
  userName: string;
  trainingTitle: string;
  dueDate?: string;
  trainingUrl: string;
}): Promise<EmailResult> {
  const vars = {
    userName: escapeHtml(params.userName),
    trainingTitle: escapeHtml(params.trainingTitle),
    dueDate: escapeHtml(params.dueDate ?? ""),
    trainingUrl: encodeURI(params.trainingUrl),
    appUrl: env.NEXT_PUBLIC_APP_URL ?? "",
  };
  const tpl = await getEmailTemplate("training_assigned");
  const subject = tpl?.subject
    ? applyTemplate(tpl.subject, vars)
    : `New training assigned: ${params.trainingTitle}`;
  const dueLine = params.dueDate
    ? `<p>Please complete it by <strong>${vars.dueDate}</strong>.</p>`
    : "";
  const body = tpl?.html
    ? applyTemplate(tpl.html, vars)
    : `<h2>${vars.trainingTitle}</h2>
       <p>Hi ${vars.userName},</p>
       <p>You have been assigned new training on VIFM Academy.</p>
       ${dueLine}
       <p><a href="${vars.trainingUrl}" style="display:inline-block;padding:10px 18px;background:#134BA1;color:#fff;text-decoration:none;border-radius:6px;">Start training</a></p>`;
  const html = `<div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">${body}</div>`;
  return send(params.to, subject, html);
}

/**
 * Due-soon / overdue reminder for an assigned training. Transactional
 * (bypasses preferences — completion is mandated by the assigning admin).
 * Template key: `training_reminder`.
 */
export async function sendTrainingReminderEmail(params: {
  to: string;
  userName: string;
  trainingTitle: string;
  dueDate: string;
  isOverdue: boolean;
  trainingUrl: string;
}): Promise<EmailResult> {
  const vars = {
    userName: escapeHtml(params.userName),
    trainingTitle: escapeHtml(params.trainingTitle),
    dueDate: escapeHtml(params.dueDate),
    trainingUrl: encodeURI(params.trainingUrl),
    statusWord: params.isOverdue ? "overdue" : "due soon",
    appUrl: env.NEXT_PUBLIC_APP_URL ?? "",
  };
  const tpl = await getEmailTemplate("training_reminder");
  const subject = tpl?.subject
    ? applyTemplate(tpl.subject, vars)
    : params.isOverdue
      ? `Overdue training: ${params.trainingTitle}`
      : `Reminder: complete ${params.trainingTitle} by ${params.dueDate}`;
  const statusLine = params.isOverdue
    ? `<p>This training was due on <strong>${vars.dueDate}</strong> and is now <strong>overdue</strong>.</p>`
    : `<p>This training is due on <strong>${vars.dueDate}</strong>.</p>`;
  const body = tpl?.html
    ? applyTemplate(tpl.html, vars)
    : `<h2>${vars.trainingTitle}</h2>
       <p>Hi ${vars.userName},</p>
       ${statusLine}
       <p><a href="${vars.trainingUrl}" style="display:inline-block;padding:10px 18px;background:#134BA1;color:#fff;text-decoration:none;border-radius:6px;">Continue training</a></p>`;
  const html = `<div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">${body}</div>`;
  return send(params.to, subject, html);
}

/**
 * Invite a learner to the 90-day follow-up survey for training they
 * completed (Kirkpatrick Level 3). Transactional. Template key:
 * `training_followup`.
 */
export async function sendTrainingFollowupEmail(params: {
  to: string;
  userName: string;
  trainingTitle: string;
  surveyUrl: string;
}): Promise<EmailResult> {
  const vars = {
    userName: escapeHtml(params.userName),
    trainingTitle: escapeHtml(params.trainingTitle),
    surveyUrl: encodeURI(params.surveyUrl),
    appUrl: env.NEXT_PUBLIC_APP_URL ?? "",
  };
  const tpl = await getEmailTemplate("training_followup");
  const subject = tpl?.subject
    ? applyTemplate(tpl.subject, vars)
    : `How has "${params.trainingTitle}" worked out for you?`;
  const body = tpl?.html
    ? applyTemplate(tpl.html, vars)
    : `<h2>${vars.trainingTitle}</h2>
       <p>Hi ${vars.userName},</p>
       <p>It has been about 90 days since you completed this training. We would love to hear how you have applied it in your work. The survey takes 2 minutes.</p>
       <p><a href="${vars.surveyUrl}" style="display:inline-block;padding:10px 18px;background:#134BA1;color:#fff;text-decoration:none;border-radius:6px;">Take the follow-up survey</a></p>`;
  const html = `<div style="font-family: system-ui, sans-serif; line-height: 1.5; max-width: 560px;">${body}</div>`;
  return send(params.to, subject, html);
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
