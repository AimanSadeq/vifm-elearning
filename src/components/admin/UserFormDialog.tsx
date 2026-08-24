"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userFormSchema, userCreateSchema, type UserFormInput } from "@/lib/utils/validators";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: Pick<Profile, "id" | "full_name" | "full_name_ar" | "email" | "phone" | "role" | "organization_id" | "department" | "language" | "is_active"> | null;
  onSuccess: () => void;
}

const EMPTY_VALUES: UserFormInput = {
  email: "",
  full_name: "",
  full_name_ar: "",
  phone: "",
  role: "learner",
  organization_id: null,
  department: "",
  language: "en",
  is_active: true,
  password: "",
};

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const isEditing = !!user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormInput>({
    resolver: zodResolver(isEditing ? userFormSchema : userCreateSchema),
    defaultValues: EMPTY_VALUES,
  });

  // The dialog stays mounted across opens, so `defaultValues` are only read
  // once. Re-seed the form every time it opens (or the selected user changes)
  // or an edit would render a blank form and fail validation on save.
  const { reset } = form;
  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            email: user.email ?? "",
            full_name: user.full_name ?? "",
            full_name_ar: user.full_name_ar ?? "",
            phone: user.phone ?? "",
            role: user.role ?? "learner",
            organization_id: user.organization_id ?? null,
            department: user.department ?? "",
            language: user.language ?? "en",
            is_active: user.is_active ?? true,
            password: "",
          }
        : EMPTY_VALUES
    );
  }, [open, user, reset]);

  const onSubmit = async (data: UserFormInput) => {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/admin/users/${user!.id}`
        : "/api/admin/users";
      const method = isEditing ? "PATCH" : "POST";

      // For edit, omit password if empty
      const payload = { ...data };
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Request failed");
      }

      toast.success(isEditing ? "User updated" : "User created");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user details. Leave password blank to keep current."
              : "Create a new user with a temporary password."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              disabled={isEditing}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && (
                <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name_ar">Full Name (Arabic)</Label>
              <Input id="full_name_ar" dir="rtl" {...form.register("full_name_ar")} />
            </div>
          </div>

          {/* Phone & Department */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. Human Capital"
                {...form.register("department")}
              />
            </div>
          </div>

          {/* Role & Language */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as UserFormInput["role"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="corporate_admin">Corporate Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={form.watch("language") ?? "en"}
                onValueChange={(v) => form.setValue("language", v as "en" | "ar")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.watch("is_active")}
              onChange={(e) => form.setValue("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? "Reset Password (optional)" : "Temporary Password"}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isEditing ? "Leave blank to keep current" : "Min 8 characters"}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
