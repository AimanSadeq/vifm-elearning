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
      ignore: "If you didn't request this, you can safely ignore this email — your password won't change.",
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

function render(copy: Copy, link: string, lang: Lang): string {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const safeLink = escapeHtml(link);
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
  <body style="margin:0;background:#f4f5f7;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#134BA1;padding:24px;text-align:center;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;">VIFM Academy</span>
          </td></tr>
          <tr><td style="padding:32px;color:#1f2933;line-height:1.6;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#102a43;">${escapeHtml(copy.heading)}</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#3e4c59;">${escapeHtml(copy.intro)}</p>
            <p style="margin:0 0 24px;">
              <a href="${safeLink}" style="display:inline-block;padding:12px 28px;background:#134BA1;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">${escapeHtml(copy.cta)}</a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#7b8794;">${escapeHtml(copy.fallback)}</p>
            <p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${safeLink}" style="color:#134BA1;">${safeLink}</a></p>
            <p style="margin:0;font-size:13px;color:#7b8794;">${escapeHtml(copy.ignore)}</p>
          </td></tr>
          <tr><td style="padding:16px 32px;background:#f4f5f7;text-align:center;color:#9aa5b1;font-size:12px;">
            © VIFM Academy
          </td></tr>
        </table>
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
