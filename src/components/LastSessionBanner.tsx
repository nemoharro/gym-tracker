"use client";

import { useLastSession } from "@/hooks/useLastSession";
import { Clock } from "lucide-react";

interface LastSessionBannerProps {
  exerciseId: number;
  currentSessionId: number | null;
}

export function LastSessionBanner({ exerciseId, currentSessionId }: LastSessionBannerProps) {
  const { lastSession, loading } = useLastSession(exerciseId, currentSessionId);

  if (loading) {
    return <div className="text-xs text-muted py-1">Loading previous...</div>;
  }

  if (!lastSession) {
    return <div className="text-xs text-muted py-1">No previous data</div>;
  }

  const setsStr = lastSession.sets
    .map((s) => `${s.weight_kg}kg x ${s.reps}`)
    .join(", ");

  const dateStr = new Date(lastSession.date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted py-1">
      <Clock className="h-3 w-3" />
      <span>
        Last ({dateStr}): {setsStr}
      </span>
    </div>
  );
}
