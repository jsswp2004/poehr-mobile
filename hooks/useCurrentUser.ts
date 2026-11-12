// hooks/useCurrentUser.ts
// Reads the signed-in user from the stored JWT so screens don't each decode it.
import { tokenStore } from "@/utils/tokenStore";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

export interface CurrentUser {
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  email?: string;
  user_id: number;
  organization?: string;
}

export const STAFF_ROLES = ["doctor", "nurse", "registrar", "admin", "system_admin"];

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await tokenStore.getItem("access_token");
        if (token && !cancelled) {
          const t: any = jwtDecode(token);
          setUser({
            username: t.username,
            firstName: t.first_name,
            lastName: t.last_name,
            role: t.role,
            email: t.email,
            user_id: t.user_id,
            organization: t.organization_name || "Unknown Organization",
          });
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
