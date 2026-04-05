"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface TodayExercise {
  exerciseId: number;
  exerciseName: string;
  targetSets: number | null;
  targetReps: number | null;
  lastWeight: number | null;
  lastReps: number | null;
  lastSets: number;
  suggestedWeight: number | null;
  suggestedReps: number | null;
}

export interface TodaysWorkout {
  splitDayId: number;
  splitDayName: string;
  splitName: string;
  exercises: TodayExercise[];
}

export function useTodaysWorkout() {
  const supabase = createClient();
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const dayOfWeek = new Date().getDay(); // 0=Sunday

      // Get today's schedule
      const { data: schedEntry } = await supabase
        .from("split_schedule")
        .select("split_day_id, is_rest_day")
        .eq("user_id", user.id)
        .eq("day_of_week", dayOfWeek)
        .single();

      if (!schedEntry || schedEntry.is_rest_day || !schedEntry.split_day_id) {
        setTodaysWorkout(null);
        setLoading(false);
        return;
      }

      // Get split day info
      const { data: splitDay } = await supabase
        .from("split_days")
        .select("id, name, split_id")
        .eq("id", schedEntry.split_day_id)
        .single();

      if (!splitDay) { setLoading(false); return; }

      // Get split name
      const { data: split } = await supabase
        .from("workout_splits")
        .select("name")
        .eq("id", splitDay.split_id)
        .single();

      // Get exercises for this day
      const { data: dayExercises } = await supabase
        .from("split_day_exercises")
        .select("exercise_id, target_sets, target_reps")
        .eq("split_day_id", splitDay.id)
        .order("order_index", { ascending: true });

      if (!dayExercises || dayExercises.length === 0) {
        setTodaysWorkout({
          splitDayId: splitDay.id,
          splitDayName: splitDay.name,
          splitName: split?.name ?? "",
          exercises: [],
        });
        setLoading(false);
        return;
      }

      // Get exercise names
      const exerciseIds = dayExercises.map((e) => e.exercise_id);
      const { data: exerciseData } = await supabase
        .from("exercises")
        .select("id, name")
        .in("id", exerciseIds);

      const nameMap = new Map<number, string>();
      if (exerciseData) {
        for (const e of exerciseData) nameMap.set(e.id, e.name);
      }

      // Get last session data for each exercise
      const exercises: TodayExercise[] = [];

      for (const de of dayExercises) {
        // Find the most recent session that had this exercise
        const { data: lastSets } = await supabase
          .from("workout_sets")
          .select("session_id, weight_kg, reps, set_number")
          .eq("exercise_id", de.exercise_id)
          .order("logged_at", { ascending: false })
          .limit(20);

        let lastWeight: number | null = null;
        let lastReps: number | null = null;
        let lastSetCount = 0;

        if (lastSets && lastSets.length > 0) {
          // Group by session, take most recent session
          const lastSessionId = lastSets[0].session_id;
          const sessionSets = lastSets.filter((s) => s.session_id === lastSessionId);
          lastSetCount = sessionSets.length;
          // Use the heaviest set as reference
          const heaviest = sessionSets.reduce((best, s) =>
            Number(s.weight_kg) > Number(best.weight_kg) ? s : best
          , sessionSets[0]);
          lastWeight = Number(heaviest.weight_kg);
          lastReps = Number(heaviest.reps);
        }

        // Calculate suggested progression
        let suggestedWeight = lastWeight;
        let suggestedReps = lastReps;

        if (lastWeight !== null && lastReps !== null && de.target_reps) {
          if (lastReps >= de.target_reps) {
            // Hit target reps — suggest weight increase
            suggestedWeight = lastWeight + 2.5;
            suggestedReps = de.target_reps;
          } else {
            // Didn't hit target — suggest same weight, +1 rep
            suggestedWeight = lastWeight;
            suggestedReps = lastReps + 1;
          }
        }

        exercises.push({
          exerciseId: de.exercise_id,
          exerciseName: nameMap.get(de.exercise_id) ?? "Unknown",
          targetSets: de.target_sets,
          targetReps: de.target_reps,
          lastWeight,
          lastReps,
          lastSets: lastSetCount,
          suggestedWeight,
          suggestedReps,
        });
      }

      setTodaysWorkout({
        splitDayId: splitDay.id,
        splitDayName: splitDay.name,
        splitName: split?.name ?? "",
        exercises,
      });
      setLoading(false);
    }

    fetch();
  }, [supabase]);

  return { todaysWorkout, loading };
}
