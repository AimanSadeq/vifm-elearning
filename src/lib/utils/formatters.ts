import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const localeMap = { en: enUS, ar } as const;

export function formatDate(date: string | Date, locale: string = "en") {
  return format(new Date(date), "PPP", {
    locale: localeMap[locale as keyof typeof localeMap] ?? enUS,
  });
}

export function formatRelativeDate(
  date: string | Date,
  locale: string = "en"
) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: localeMap[locale as keyof typeof localeMap] ?? enUS,
  });
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en"
) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", {
    style: "currency",
    currency,
    // Drop the ".00" on whole amounts ($200 instead of $200.00) while still
    // showing cents when an amount actually has them.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, locale: string = "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US").format(
    value
  );
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
