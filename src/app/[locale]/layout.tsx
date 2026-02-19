import { Plus_Jakarta_Sans, Inter, Noto_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { LocaleHtmlAttributes } from "./locale-html-attributes";
import "@/app/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
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
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider messages={messages}>
        <LocaleHtmlAttributes locale={locale} dir={isRTL ? "rtl" : "ltr"} />
        <div
          className={`${inter.variable} ${plusJakarta.variable} ${notoArabic.variable} ${jetbrainsMono.variable} ${
            isRTL ? "font-[family-name:var(--font-arabic)]" : "font-[family-name:var(--font-sans)]"
          } antialiased`}
        >
          {children}
        </div>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
