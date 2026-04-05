"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MuscleGroupDataPoint {
  date: string;
  [muscleGroup: string]: number | string | undefined;
}

export function useMuscleGroupProgress() {
  const [data, setData] = useState<MuscleGroupDataPoint[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch sessions from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, started_at")
        .eq("user_id", user.id)
        .gte("started_at", ninetyDaysAgo.toISOString())
        .order("started_at", { ascending: true });

      if (!sessions || sessions.length === 0) {
        setData([]);
        setMuscleGroups([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map((s) => s.id);
      const sessionDateMap = new Map<number, string>();
      for (const s of sessions) {
        // Truncate to date only
        sessionDateMap.set(s.id, s.started_at.split("T")[0]);
      }

      // Fetch sets and exercises in parallel
      const [setsResult, exercisesResult] = await Promise.all([
        supabase
          .from("workout_sets")
          .select("session_id, exercise_id, weight_kg, reps")
          .in("session_id", sessionIds),
        supabase.from("exercises").select("id, muscle_group"),
      ]);

      const sets = setsResult.data;
      const exercises = exercisesResult.data;

      if (!sets || !exercises) {
        setData([]);
        setMuscleGroups([]);
        setLoading(false);
        return;
      }

      // Build exercise -> muscle group map
      const exerciseGroupMap = new Map<number, string>();
      for (const ex of exercises) {
        exerciseGroupMap.set(ex.id, ex.muscle_group);
      }

      // Aggregate volume by (date, muscleGroup)
      const volumeMap = new Map<string, Map<string, number>>();
      const allGroups = new Set<string>();

      for (const set of sets) {
        const dateStr = sessionDateMap.get(set.session_id);
        const group = exerciseGroupMap.get(set.exercise_id);
        if (!dateStr || !group) continue;

        allGroups.add(group);
        if (!volumeMap.has(dateStr)) {
          volumeMap.set(dateStr, new Map());
        }
        const dayMap = volumeMap.get(dateStr)!;
        dayMap.set(group, (dayMap.get(group) ?? 0) + Number(set.weight_kg) * Number(set.reps));
      }

      const sortedGroups = [...allGroups].sort();
      const sortedDates = [...volumeMap.keys()].sort();

      const points: MuscleGroupDataPoint[] = sortedDates.map((dateStr) => {
        const dayMap = volumeMap.get(dateStr)!;
        const point: MuscleGroupDataPoint = {
          date: new Date(dateStr).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
          }),
        };
        for (const group of sortedGroups) {
          const vol = dayMap.get(group);
          if (vol !== undefined) {
            point[group] = Math.round(vol);
          }
        }
        return point;
      });

      setData(points);
      setMuscleGroups(sortedGroups);
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, muscleGroups, loading };
}
