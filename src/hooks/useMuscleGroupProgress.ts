"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toLocalDateStr } from "@/lib/dates";

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
        sessionDateMap.set(s.id, toLocalDateStr(new Date(s.started_at)));
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

      // Calculate avg estimated 1RM per muscle group per day
      // Structure: date -> muscleGroup -> exerciseId -> best e1RM
      const e1rmMap = new Map<string, Map<string, Map<number, number>>>();
      const allGroups = new Set<string>();

      for (const set of sets) {
        const dateStr = sessionDateMap.get(set.session_id);
        const group = exerciseGroupMap.get(set.exercise_id);
        if (!dateStr || !group) continue;

        const weight = Number(set.weight_kg);
        const reps = Number(set.reps);
        if (weight <= 0 || reps <= 0) continue;

        // Brzycki estimated 1RM (clamped at 36 reps)
        const clampedReps = Math.min(reps, 36);
        const e1rm = clampedReps === 1 ? weight : weight * (36 / (37 - clampedReps));

        allGroups.add(group);
        if (!e1rmMap.has(dateStr)) {
          e1rmMap.set(dateStr, new Map());
        }
        const dayMap = e1rmMap.get(dateStr)!;
        if (!dayMap.has(group)) {
          dayMap.set(group, new Map());
        }
        const groupMap = dayMap.get(group)!;
        // Keep the best e1RM per exercise
        const current = groupMap.get(set.exercise_id) ?? 0;
        if (e1rm > current) {
          groupMap.set(set.exercise_id, e1rm);
        }
      }

      const sortedGroups = [...allGroups].sort();
      const sortedDates = [...e1rmMap.keys()].sort();

      const points: MuscleGroupDataPoint[] = sortedDates.map((dateStr) => {
        const dayMap = e1rmMap.get(dateStr)!;
        const point: MuscleGroupDataPoint = {
          date: new Date(dateStr).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
          }),
        };
        for (const group of sortedGroups) {
          const exerciseMap = dayMap.get(group);
          if (exerciseMap && exerciseMap.size > 0) {
            // Average the best e1RM across exercises in this muscle group
            const values = [...exerciseMap.values()];
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            point[group] = Math.round(avg * 10) / 10;
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
