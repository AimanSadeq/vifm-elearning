"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const { offices: rawOffices } = useSiteSettings();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Could not send message");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send message");
    }
  };

  const offices = rawOffices.map((o) => ({
    key: o.key,
    city: locale === "ar" ? o.cityAr : o.city,
    address: locale === "ar" ? o.addressAr : o.address,
    phone: o.phone,
    email: o.email,
  }));

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Form */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t("formTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {t("successTitle")}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {t("successMessage")}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {submitError && (
                    <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
                      {submitError}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("name")} *</Label>
                      <Input
                        id="name"
                        placeholder={t("namePlaceholder")}
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-sm text-error">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("email")} *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-sm text-error">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t("subject")} *</Label>
                    <Input
                      id="subject"
                      placeholder={t("subjectPlaceholder")}
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-sm text-error">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t("message")} *</Label>
                    <Textarea
                      id="message"
                      placeholder={t("messagePlaceholder")}
                      rows={5}
                      {...register("message")}
                    />
                    {errors.message && (
                      <p className="text-sm text-error">
                        {errors.message.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                    ) : (
                      <Send className="h-4 w-4 me-2" />
                    )}
                    {t("sendMessage")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Office Locations */}
          <div className="lg:col-span-2 space-y-4">
            {offices.map((office) => (
              <Card key={office.key}>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold">{office.city}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {office.address?.trim() && (
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        {office.address}
                      </p>
                    )}
                    {office.phone?.trim() && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" />
                        {office.phone}
                      </p>
                    )}
                    {office.email?.trim() && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        {office.email}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
