/**
 * Builds the subject + HTML for Supabase Auth emails sent via the Send Email
 * Hook (signup confirmation, password reset, magic link, email change).
 *
 * Supabase hands us a one-time `token_hash`; we wrap it in a link back to our
 * own `/api/auth/callback`, which verifies it with `verifyOtp` and establishes
 * the session. Copy is rendered in English or Arabic based on the language the
 * learner chose at signup (stored in user_metadata.language).
 */

import { APP_URL } from "@/lib/env";

type Lang = "en" | "ar";

export interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: Record<string, unknown> | null;
  };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url?: string;
  };
}

function pickLang(meta?: Record<string, unknown> | null): Lang {
  return meta?.language === "ar" ? "ar" : "en";
}

/**
 * Default landing path per action type. Recovery must land on the
 * set-new-password page; everything else goes to the dashboard.
 */
function defaultNext(action: string, lang: Lang): string {
  if (action === "recovery") return `/${lang}/reset-password`;
  return `/${lang}/dashboard`;
}

/**
 * Honour an app-supplied `?next=/path` from the original redirect_to (e.g. the
 * forgot-password form points recovery at /reset-password). Only same-origin
 * relative paths are accepted; the callback re-validates anyway.
 */
function resolveNext(redirectTo: string, action: string, lang: Lang): string {
  try {
    const url = new URL(redirectTo, APP_URL);
    const next = url.searchParams.get("next");
    if (next && next.startsWith("/")) return next;
  } catch {
    // fall through to default
  }
  return defaultNext(action, lang);
}

interface Copy {
  subject: string;
  heading: string;
  intro: string;
  cta: string;
  fallback: string;
  ignore: string;
}

function copyFor(action: string, lang: Lang): Copy {
  const en: Record<string, Copy> = {
    signup: {
      subject: "Confirm your VIFM Academy account",
      heading: "Confirm your email",
      intro: "Welcome to VIFM Academy. Confirm your email address to activate your account and start learning.",
      cta: "Confirm email",
      fallback: "If the button doesn't work, copy and paste this link into your browser:",
      ignore: "If you didn't create this account, you can safely ignore this email.",
    },
    recovery: {
      subject: "Reset your VIFM Academy password",
      heading: "Reset your password",
      intro: "We received a request to reset your password. Click below to choose a new one.",
      cta: "Reset password",
      fallback: "If the button doesn't work, copy and paste this link into your browser:",
      ignore: "If you didn't request this, you can safely ignore this email your password won't change.",
    },
    magiclink: {
      subject: "Your VIFM Academy sign-in link",
      heading: "Sign in to VIFM Academy",
      intro: "Click below to sign in to your account.",
      cta: "Sign in",
      fallback: "If the button doesn't work, copy and paste this link into your browser:",
      ignore: "If you didn't request this, you can safely ignore this email.",
    },
    email_change: {
      subject: "Confirm your new email address",
      heading: "Confirm your new email",
      intro: "Confirm this address to finish updating the email on your VIFM Academy account.",
      cta: "Confirm new email",
      fallback: "If the button doesn't work, copy and paste this link into your browser:",
      ignore: "If you didn't request this change, you can safely ignore this email.",
    },
    invite: {
      subject: "You've been invited to VIFM Academy",
      heading: "Accept your invitation",
      intro: "You've been invited to join VIFM Academy. Click below to set up your account.",
      cta: "Accept invitation",
      fallback: "If the button doesn't work, copy and paste this link into your browser:",
      ignore: "If you weren't expecting this invitation, you can safely ignore this email.",
    },
  };

  const ar: Record<string, Copy> = {
    signup: {
      subject: "تأكيد حسابك في أكاديمية VIFM",
      heading: "تأكيد بريدك الإلكتروني",
      intro: "مرحبًا بك في أكاديمية VIFM. أكّد بريدك الإلكتروني لتفعيل حسابك والبدء في التعلّم.",
      cta: "تأكيد البريد الإلكتروني",
      fallback: "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
      ignore: "إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.",
    },
    recovery: {
      subject: "إعادة تعيين كلمة مرور أكاديمية VIFM",
      heading: "إعادة تعيين كلمة المرور",
      intro: "تلقّينا طلبًا لإعادة تعيين كلمة المرور. اضغط أدناه لاختيار كلمة مرور جديدة.",
      cta: "إعادة تعيين كلمة المرور",
      fallback: "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
      ignore: "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان ولن تتغيّر كلمة مرورك.",
    },
    magiclink: {
      subject: "رابط تسجيل الدخول إلى أكاديمية VIFM",
      heading: "تسجيل الدخول إلى أكاديمية VIFM",
      intro: "اضغط أدناه لتسجيل الدخول إلى حسابك.",
      cta: "تسجيل الدخول",
      fallback: "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
      ignore: "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.",
    },
    email_change: {
      subject: "تأكيد بريدك الإلكتروني الجديد",
      heading: "تأكيد بريدك الإلكتروني الجديد",
      intro: "أكّد هذا العنوان لإتمام تحديث البريد الإلكتروني لحسابك في أكاديمية VIFM.",
      cta: "تأكيد البريد الجديد",
      fallback: "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
      ignore: "إذا لم تطلب هذا التغيير، يمكنك تجاهل هذه الرسالة بأمان.",
    },
    invite: {
      subject: "تمت دعوتك إلى أكاديمية VIFM",
      heading: "قبول الدعوة",
      intro: "تمت دعوتك للانضمام إلى أكاديمية VIFM. اضغط أدناه لإعداد حسابك.",
      cta: "قبول الدعوة",
      fallback: "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
      ignore: "إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.",
    },
  };

  const table = lang === "ar" ? ar : en;
  return table[action] ?? table.signup;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = "#134BA1";

/**
 * Renders a transactional email that survives the lowest common denominator:
 * Outlook Classic on Windows (Word rendering engine). That means:
 *   - table-based layout, every dimension explicit, no flex/grid
 *   - inline styles only (Outlook strips most <style>, keeps it for mobile)
 *   - a VML <v:roundrect> button for MSO; an <a> button for everyone else
 *   - a ghost <table> wrapper so Outlook honours the 600px width
 *   - Arial/Helvetica fallbacks (Outlook can't load system-ui/web fonts)
 * RTL is handled by flipping dir + alignment for Arabic.
 */
function render(copy: Copy, link: string, lang: Lang): string {
  const rtl = lang === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const safeLink = escapeHtml(link);
  const font = "Arial, Helvetica, sans-serif";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(copy.heading)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  a { text-decoration: none; }
  @media screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f5f7;">${escapeHtml(copy.intro)}</div>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f4f5f7;">
<tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" class="container" width="600" border="0" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr>
    <td align="center" style="background:${BRAND};padding:28px 24px;">
      <span style="font-family:${font};font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.3px;">VIFM Academy</span>
    </td>
  </tr>
  <tr>
    <td class="px" dir="${dir}" style="padding:36px 40px 4px;text-align:${align};font-family:${font};color:#1f2933;">
      <h1 style="margin:0 0 16px;font-family:${font};font-size:24px;line-height:30px;font-weight:bold;color:#102a43;">${escapeHtml(copy.heading)}</h1>
      <p style="margin:0 0 28px;font-family:${font};font-size:16px;line-height:24px;color:#3e4c59;mso-line-height-rule:exactly;">${escapeHtml(copy.intro)}</p>
    </td>
  </tr>
  <tr>
    <td class="px" align="${align}" style="padding:0 40px 28px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeLink}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" strokecolor="${BRAND}" fillcolor="${BRAND}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:${font};font-size:16px;font-weight:bold;">${escapeHtml(copy.cta)}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${safeLink}" style="display:inline-block;background:${BRAND};color:#ffffff;font-family:${font};font-size:16px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:280px;border-radius:8px;">${escapeHtml(copy.cta)}</a>
      <!--<![endif]-->
    </td>
  </tr>
  <tr>
    <td class="px" dir="${dir}" style="padding:0 40px 32px;text-align:${align};font-family:${font};">
      <p style="margin:0 0 8px;font-family:${font};font-size:13px;line-height:20px;color:#7b8794;">${escapeHtml(copy.fallback)}</p>
      <p style="margin:0 0 24px;font-family:${font};font-size:13px;line-height:20px;word-break:break-all;"><a href="${safeLink}" style="color:${BRAND};text-decoration:underline;">${safeLink}</a></p>
      <p style="margin:0;font-family:${font};font-size:13px;line-height:20px;color:#7b8794;">${escapeHtml(copy.ignore)}</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:20px 40px;background:#f4f5f7;font-family:${font};font-size:12px;line-height:18px;color:#9aa5b1;">
      © VIFM Academy
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

export function buildAuthEmail(payload: AuthEmailPayload): {
  subject: string;
  html: string;
} {
  const lang = pickLang(payload.user.user_metadata);
  const action = payload.email_data.email_action_type;
  const next = resolveNext(payload.email_data.redirect_to, action, lang);

  const link =
    `${APP_URL}/api/auth/callback` +
    `?token_hash=${encodeURIComponent(payload.email_data.token_hash)}` +
    `&type=${encodeURIComponent(action)}` +
    `&next=${encodeURIComponent(next)}`;

  const copy = copyFor(action, lang);
  return { subject: copy.subject, html: render(copy, link, lang) };
}
