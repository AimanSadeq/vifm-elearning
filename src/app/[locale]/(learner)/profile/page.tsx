"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Lock, Eye, EyeOff, BellRing } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const t = useTranslations();
  const { user, isLoading } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          fullName: user.full_name,
          fullNameAr: user.full_name_ar || "",
          phone: user.phone || "",
          preferredLanguage: user.language,
          timezone: user.timezone,
        }
      : undefined,
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const onProfileSubmit = async (data: ProfileInput) => {
    setProfileError(null);
    setProfileSuccess(false);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        full_name_ar: data.fullNameAr || null,
        phone: data.phone || null,
        language: data.preferredLanguage,
        timezone: data.timezone,
      })
      .eq("id", user.id);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const onPasswordSubmit = async (data: PasswordInput) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    const supabase = createClient();

    // Supabase's updateUser doesn't verify the current password, so we
    // re-authenticate first. If the current password is wrong, refuse the
    // change — protects against stolen sessions / accidental edits.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    });
    if (signInError) {
      setPasswordError(
        "Current password is incorrect."
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPasswordSuccess(true);
    passwordForm.reset();
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Profile Settings</h1>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            {profileError && (
              <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">
                Profile updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name (English)</Label>
                <Input
                  id="fullName"
                  {...profileForm.register("fullName")}
                />
                {profileForm.formState.errors.fullName && (
                  <p className="text-sm text-error">
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullNameAr">Full Name (Arabic)</Label>
                <Input
                  id="fullNameAr"
                  dir="rtl"
                  {...profileForm.register("fullNameAr")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+971 50 123 4567"
                {...profileForm.register("phone")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language</Label>
                <select
                  id="preferredLanguage"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...profileForm.register("preferredLanguage")}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...profileForm.register("timezone")}
                >
                  <option value="Asia/Dubai">Dubai (GMT+4)</option>
                  <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            {passwordError && (
              <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">
                Password changed successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-error">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-error">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-error">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Notification Preferences */}
      <NotificationPreferencesSection />
    </div>
  );
}

interface PrefsState {
  email_notifications: boolean;
  webinar_reminders: boolean;
  course_updates: boolean;
  marketing_emails: boolean;
}

const PREF_FIELDS: { id: keyof PrefsState; label: string; desc: string }[] = [
  { id: "email_notifications", label: "Email Notifications", desc: "Receive important updates via email" },
  { id: "webinar_reminders", label: "Webinar Reminders", desc: "Get reminded before webinars start" },
  { id: "course_updates", label: "Course Updates", desc: "Notifications about course progress and new content" },
  { id: "marketing_emails", label: "Marketing Emails", desc: "Promotions and new course announcements" },
];

function NotificationPreferencesSection() {
  const [prefs, setPrefs] = useState<PrefsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/learner/notification-preferences")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.data) setPrefs(j.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key: keyof PrefsState) => {
    setPrefs((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
    setSuccess(false);
    setError(null);
  };

  const save = async () => {
    if (!prefs) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/learner/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Could not save");
        return;
      }
      setPrefs(j.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BellRing className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Transactional notifications (course enrollment, certificates,
          password reset) are always sent. The toggles below control everything
          else.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-success/10 px-4 py-3 text-sm text-success">
            Preferences saved.
          </div>
        )}

        {isLoading || !prefs ? (
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {PREF_FIELDS.map((field) => (
                <label
                  key={field.id}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {field.desc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[field.id]}
                    onChange={() => toggle(field.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={save} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
