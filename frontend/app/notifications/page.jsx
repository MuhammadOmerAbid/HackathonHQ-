"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tab=notifications");
  }, [router]);

  return <LoadingSpinner message="Redirecting..." />;
}
