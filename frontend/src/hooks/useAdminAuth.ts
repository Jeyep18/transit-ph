"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/services/adminService";
import {
  getToken,
  getStoredAdmin,
  clearAuthState,
  ApiError,
} from "@/services/api";
import type { AdminUser } from "@/types/admin";

interface UseAdminAuthReturn {
  admin: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      window.setTimeout(() => setLoading(false), 0);
      return;
    }

    // Use the cached admin info immediately for instant render,
    // then verify with the server in the background
    const cached = getStoredAdmin();
    if (cached) window.setTimeout(() => setAdmin(cached), 0);

    getMe()
      .then((freshAdmin) => {
        setAdmin(freshAdmin);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthState();
          router.replace("/admin/login");
        } else {
          console.error("Failed to validate admin session:", error);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { admin, loading, isAuthenticated: !!admin };
}
