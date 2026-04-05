"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  estimatedOneRM: number;
}

export function useProgressData(exerciseId: number | null) {
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    const eid = exerciseId;

    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch sets for this exercise
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("weight_kg, reps, session_id")
        .eq("exercise_id", eid)
        .order("session_id", { ascending: true });

      if (!sets || sets.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Get unique session IDs
      const sessionIds = [...new Set(sets.map((s) => s.session_id))];

      // Fetch session dates separately to avoid relational query type issues
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, started_at")
        .in("id", sessionIds);

      const sessionDateMap = new Map<number, string>();
      if (sessions) {
        for (const s of sessions) {
          sessionDateMap.set(s.id, s.started_at);
        }
      }

      // Group by session
      const bySession = new Map<
        number,
        { date: string; sets: Array<{ weight: number; reps: number }> }
      >();
      for (const s of sets) {
        const sid = s.session_id;
        if (!bySession.has(sid)) {
          bySession.set(sid, {
            date: sessionDateMap.get(sid) ?? "",
            sets: [],
          });
        }
        bySession.get(sid)!.sets.push({
          weight: Number(s.weight_kg),
          reps: Number(s.reps),
        });
      }

      // Calculate metrics per session
      const points: ProgressPoint[] = [];
      for (const [, session] of bySession) {
        const maxWeight = Math.max(...session.sets.map((s) => s.weight));
        const totalVolume = session.sets.reduce(
          (sum, s) => sum + s.weight * s.reps,
          0
        );
        // Brzycki formula for estimated 1RM (use the heaviest set)
        const heaviestSet = session.sets.reduce((best, s) =>
          s.weight > best.weight ? s : best
        );
        // Brzycki formula — only accurate up to ~36 reps
        const clampedReps = Math.min(heaviestSet.reps, 36);
        const estimatedOneRM =
          clampedReps === 1
            ? heaviestSet.weight
            : heaviestSet.weight * (36 / (37 - clampedReps));

        points.push({
          date: new Date(session.date).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
          }),
          maxWeight: Math.round(maxWeight * 10) / 10,
          totalVolume: Math.round(totalVolume),
          estimatedOneRM: Math.round(estimatedOneRM * 10) / 10,
        });
      }

      setData(points);
      setLoading(false);
    }

    fetchData();
  }, [exerciseId]);

  return { data, loading };
}
