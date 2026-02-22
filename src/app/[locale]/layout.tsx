import { Open_Sans, Noto_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LocaleHtmlAttributes } from "./locale-html-attributes";
import "@/app/globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <LocaleHtmlAttributes locale={locale} dir={isRTL ? "rtl" : "ltr"} />
          <div
          className={`${openSans.variable} ${notoArabic.variable} ${jetbrainsMono.variable} ${
            isRTL ? "font-[family-name:var(--font-arabic)]" : "font-[family-name:var(--font-sans)]"
          } antialiased`}
        >
          {children}
          </div>
        </AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
