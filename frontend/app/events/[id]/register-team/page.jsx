"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RegisterTeamRedirect() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    router.replace(`/teams/create?event=${id}`);
  }, [id, router]);

  return <LoadingSpinner message="Redirecting to team registration..." />;
}
