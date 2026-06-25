import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

function isSupportedLocale(value: string | undefined): value is "en" | "ar" {
  return !!value && (routing.locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // Guard against any unsupported locale (bots, stale links like `/ar-SA`,
  // etc.) reaching message resolution and triggering next-intl's
  // "Incorrect locale information provided" error.
  const locale = isSupportedLocale(requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
