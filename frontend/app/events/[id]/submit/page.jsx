"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SubmitRedirect() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    router.replace(`/submissions/create?event=${id}`);
  }, [id, router]);

  return <LoadingSpinner message="Redirecting to submission..." />;
}
