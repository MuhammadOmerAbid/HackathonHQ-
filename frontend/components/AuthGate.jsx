"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/", "/login", "/register"];

function isPublicPath(pathname) {
  if (!pathname) return false;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildRedirect(pathname, searchParams) {
  const query = searchParams?.toString();
  const full = query ? `${pathname}?${query}` : pathname;
  return encodeURIComponent(full || "/");
}

export default function AuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (isPublic) return;
    if (loading) return;
    if (!user) {
      const redirect = buildRedirect(pathname, searchParams);
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isPublic, loading, user, pathname, searchParams, router]);

  if (isPublic) {
    return children;
  }

  if (loading || !user) {
    return null;
  }

  return children;
}
