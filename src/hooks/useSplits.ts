"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SplitDayExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
}

export interface SplitDay {
  id: number;
  name: string;
  day_order: number;
  exercises: SplitDayExercise[];
}

export interface WorkoutSplit {
  id: number;
  name: string;
  description: string | null;
  is_preset: boolean;
  days: SplitDay[];
}

export interface ScheduleEntry {
  day_of_week: number;
  split_day_id: number | null;
  is_rest_day: boolean;
  split_day_name?: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export { DAY_NAMES };

export function useSplits() {
  const supabase = createClient();
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSplits = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: splitsData } = await supabase
      .from("workout_splits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!splitsData) { setLoading(false); return; }

    const fullSplits: WorkoutSplit[] = [];

    for (const split of splitsData) {
      const { data: days } = await supabase
        .from("split_days")
        .select("*")
        .eq("split_id", split.id)
        .order("day_order", { ascending: true });

      const fullDays: SplitDay[] = [];

      for (const day of days ?? []) {
        const { data: exercises } = await supabase
          .from("split_day_exercises")
          .select("id, exercise_id, order_index, target_sets, target_reps")
          .eq("split_day_id", day.id)
          .order("order_index", { ascending: true });

        const exerciseIds = (exercises ?? []).map((e) => e.exercise_id);
        let exerciseNames = new Map<number, string>();
        if (exerciseIds.length > 0) {
          const { data: exData } = await supabase
            .from("exercises")
            .select("id, name")
            .in("id", exerciseIds);
          if (exData) {
            for (const e of exData) exerciseNames.set(e.id, e.name);
          }
        }

        fullDays.push({
          id: day.id,
          name: day.name,
          day_order: day.day_order,
          exercises: (exercises ?? []).map((e) => ({
            ...e,
            exercise_name: exerciseNames.get(e.exercise_id) ?? "Unknown",
          })),
        });
      }

      fullSplits.push({
        id: split.id,
        name: split.name,
        description: split.description,
        is_preset: split.is_preset,
        days: fullDays,
      });
    }

    setSplits(fullSplits);

    // Fetch schedule
    const { data: schedData } = await supabase
      .from("split_schedule")
      .select("*")
      .eq("user_id", user.id)
      .order("day_of_week", { ascending: true });

    if (schedData) {
      // Build day name map from all split days
      const dayNameMap = new Map<number, string>();
      for (const split of fullSplits) {
        for (const day of split.days) {
          dayNameMap.set(day.id, day.name);
        }
      }

      setSchedule(
        schedData.map((s) => ({
          day_of_week: s.day_of_week,
          split_day_id: s.split_day_id,
          is_rest_day: s.is_rest_day,
          split_day_name: s.split_day_id ? dayNameMap.get(s.split_day_id) : undefined,
        }))
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSplits();
  }, [fetchSplits]);

  async function createSplit(name: string, description: string, dayNames: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: split } = await supabase
      .from("workout_splits")
      .insert({ user_id: user.id, name, description: description || null })
      .select("id")
      .single();

    if (!split) return;

    for (let i = 0; i < dayNames.length; i++) {
      await supabase.from("split_days").insert({
        split_id: split.id,
        name: dayNames[i],
        day_order: i,
      });
    }

    await fetchSplits();
  }

  async function deleteSplit(splitId: number) {
    const { error } = await supabase.from("workout_splits").delete().eq("id", splitId);
    if (error) {
      alert("Failed to delete split. Please try again.");
      return;
    }
    await fetchSplits();
  }

  async function addExerciseToDay(splitDayId: number, exerciseId: number, currentCount: number, targetSets?: number, targetReps?: number) {
    const { error } = await supabase.from("split_day_exercises").insert({
      split_day_id: splitDayId,
      exercise_id: exerciseId,
      order_index: currentCount,
      target_sets: targetSets ?? null,
      target_reps: targetReps ?? null,
    });
    if (error) {
      alert("Failed to add exercise. Please try again.");
      return;
    }
    await fetchSplits();
  }

  async function removeExerciseFromDay(exerciseRowId: number) {
    const { error } = await supabase.from("split_day_exercises").delete().eq("id", exerciseRowId);
    if (error) {
      alert("Failed to remove exercise. Please try again.");
      return;
    }
    await fetchSplits();
  }

  async function updateSchedule(dayOfWeek: number, splitDayId: number | null, isRestDay: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert
    const { data: existing } = await supabase
      .from("split_schedule")
      .select("id")
      .eq("user_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      day_of_week: dayOfWeek,
      split_day_id: splitDayId,
      is_rest_day: isRestDay,
    };

    if (existing) {
      await supabase.from("split_schedule").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("split_schedule").insert(payload);
    }

    await fetchSplits();
  }

  async function createPresetSplit(presetName: string) {
    const presets: Record<string, string[]> = {
      "Push / Pull / Legs": ["Push", "Pull", "Legs"],
      "Upper / Lower": ["Upper Body", "Lower Body"],
      "Full Body": ["Full Body"],
      "Bro Split": ["Chest", "Back", "Shoulders", "Arms", "Legs"],
    };

    const dayNames = presets[presetName];
    if (!dayNames) return;

    await createSplit(presetName, `${presetName} split`, dayNames);
  }

  return {
    splits,
    schedule,
    loading,
    createSplit,
    deleteSplit,
    addExerciseToDay,
    removeExerciseFromDay,
    updateSchedule,
    createPresetSplit,
    refresh: fetchSplits,
  };
}
