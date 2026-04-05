"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface LastSet {
  weight_kg: number;
  reps: number;
  set_number: number;
}

interface LastSessionData {
  sets: LastSet[];
  date: string;
}

export function useLastSession(
  exerciseId: number | null,
  currentSessionId: number | null
) {
  const [data, setData] = useState<LastSessionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    const eid = exerciseId;
    const csid = currentSessionId;

    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Get distinct session IDs for this exercise, ordered by most recent
      const { data: sessionSets } = await supabase
        .from("workout_sets")
        .select("session_id")
        .eq("exercise_id", eid)
        .order("session_id", { ascending: false })
        .limit(50);

      if (!sessionSets || sessionSets.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      // Find distinct session IDs, excluding current
      const sessionIds = [
        ...new Set(sessionSets.map((s) => s.session_id)),
      ].filter((id) => id !== csid);

      if (sessionIds.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      const prevSessionId = sessionIds[0];

      // Get all sets from that session for this exercise
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("weight_kg, reps, set_number")
        .eq("session_id", prevSessionId)
        .eq("exercise_id", eid)
        .order("set_number", { ascending: true });

      // Get the session date
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("id", prevSessionId)
        .single();

      if (sets && sets.length > 0) {
        setData({
          sets: sets.map((s) => ({
            weight_kg: Number(s.weight_kg),
            reps: Number(s.reps),
            set_number: Number(s.set_number),
          })),
          date: session?.started_at ?? "",
        });
      } else {
        setData(null);
      }
      setLoading(false);
    }

    fetchData();
  }, [exerciseId, currentSessionId]);

  return { lastSession: data, loading };
}
