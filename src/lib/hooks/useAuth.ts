"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { EXPLICIT_SIGNOUT_FLAG } from "@/lib/utils/protected-paths";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const locale = useLocale();

  const signOut = async () => {
    const supabase = createClient();
    // Set this *before* signOut() so the AuthProvider's SIGNED_OUT listener
    // sees the flag and skips its own redirect — otherwise both this push
    // and the listener's hard nav fire, and the listener's `?redirect=`
    // sends the user back to where they signed out from.
    if (typeof window !== "undefined") {
      sessionStorage.setItem(EXPLICIT_SIGNOUT_FLAG, "1");
    }
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    router.push(`/${locale}/login`);
  };

  return { user, isLoading, signOut };
}
