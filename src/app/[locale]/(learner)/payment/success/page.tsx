"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const locale = useLocale();
  const t = useTranslations("payments");
  const tc = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">{t("paymentSuccess")}</h1>
          <p className="text-muted-foreground">
            Your enrollment has been confirmed. You can now start learning!
          </p>

          <div className="flex flex-col gap-3 pt-4">
            <Link href={`/${locale}/my-courses`}>
              <Button className="w-full" size="lg">
                <BookOpen className="h-4 w-4 me-2" />
                {tc("startLearning")}
              </Button>
            </Link>

            <Link href={`/${locale}/courses`}>
              <Button variant="outline" className="w-full">
                Browse More Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
