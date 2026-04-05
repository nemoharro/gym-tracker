"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface WorkoutSet {
  id?: number; // undefined until persisted to Supabase
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
}

interface WorkoutExercise {
  exerciseId: number;
  exerciseName: string;
  sets: WorkoutSet[];
}

interface WorkoutState {
  isActive: boolean;
  sessionId: number | null;
  startedAt: string | null;
  exercises: WorkoutExercise[];

  // Actions
  startWorkout: (splitDayId?: number) => Promise<void>;
  finishWorkout: (notes?: string) => Promise<void>;
  addExercise: (exerciseId: number, exerciseName: string) => void;
  removeExercise: (exerciseId: number) => void;
  addSet: (
    exerciseId: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => Promise<void>;
  updateSet: (
    exerciseId: number,
    setIndex: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => Promise<void>;
  deleteSet: (exerciseId: number, setIndex: number) => Promise<void>;
  reset: () => void;
}

export const useWorkout = create<WorkoutState>((set, get) => ({
  isActive: false,
  sessionId: null,
  startedAt: null,
  exercises: [],

  startWorkout: async (splitDayId?: number) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: user.id, split_day_id: splitDayId ?? null })
      .select("id, started_at")
      .single();

    if (error || !data) return;

    // Pre-populate exercises from split day if provided
    let preloadedExercises: WorkoutExercise[] = [];
    if (splitDayId) {
      const { data: dayExercises } = await supabase
        .from("split_day_exercises")
        .select("exercise_id")
        .eq("split_day_id", splitDayId)
        .order("order_index", { ascending: true });

      if (dayExercises && dayExercises.length > 0) {
        const ids = dayExercises.map((e) => e.exercise_id);
        const { data: exNames } = await supabase
          .from("exercises")
          .select("id, name")
          .in("id", ids);

        const nameMap = new Map<number, string>();
        if (exNames) for (const e of exNames) nameMap.set(e.id, e.name);

        preloadedExercises = dayExercises.map((e) => ({
          exerciseId: e.exercise_id,
          exerciseName: nameMap.get(e.exercise_id) ?? "Unknown",
          sets: [],
        }));
      }
    }

    set({
      isActive: true,
      sessionId: data.id,
      startedAt: data.started_at,
      exercises: preloadedExercises,
    });
  },

  finishWorkout: async (notes?: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    const supabase = createClient();
    await supabase
      .from("workout_sessions")
      .update({ finished_at: new Date().toISOString(), notes })
      .eq("id", sessionId);

    set({
      isActive: false,
      sessionId: null,
      startedAt: null,
      exercises: [],
    });
  },

  addExercise: (exerciseId: number, exerciseName: string) => {
    const { exercises } = get();
    if (exercises.some((e) => e.exerciseId === exerciseId)) return;
    set({
      exercises: [...exercises, { exerciseId, exerciseName, sets: [] }],
    });
  },

  removeExercise: (exerciseId: number) => {
    set({
      exercises: get().exercises.filter((e) => e.exerciseId !== exerciseId),
    });
  },

  addSet: async (
    exerciseId: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => {
    const { sessionId, exercises } = get();
    if (!sessionId) return;

    const exercise = exercises.find((e) => e.exerciseId === exerciseId);
    const setNumber = (exercise?.sets.length ?? 0) + 1;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight_kg: weightKg,
        reps,
        rpe: rpe ?? null,
      })
      .select("id")
      .single();

    if (error || !data) return;

    const newSet: WorkoutSet = {
      id: data.id,
      exerciseId,
      setNumber,
      weightKg,
      reps,
      rpe,
    };

    set({
      exercises: exercises.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: [...e.sets, newSet] }
          : e
      ),
    });
  },

  updateSet: async (
    exerciseId: number,
    setIndex: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => {
    const { exercises } = get();
    const exercise = exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) return;

    const existingSet = exercise.sets[setIndex];
    if (!existingSet?.id) return;

    const supabase = createClient();
    await supabase
      .from("workout_sets")
      .update({ weight_kg: weightKg, reps, rpe: rpe ?? null })
      .eq("id", existingSet.id);

    set({
      exercises: exercises.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s, i) =>
                i === setIndex ? { ...s, weightKg, reps, rpe } : s
              ),
            }
          : e
      ),
    });
  },

  deleteSet: async (exerciseId: number, setIndex: number) => {
    const { exercises } = get();
    const exercise = exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) return;

    const existingSet = exercise.sets[setIndex];
    if (existingSet?.id) {
      const supabase = createClient();
      await supabase.from("workout_sets").delete().eq("id", existingSet.id);
    }

    set({
      exercises: exercises.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
          : e
      ),
    });
  },

  reset: () => {
    set({
      isActive: false,
      sessionId: null,
      startedAt: null,
      exercises: [],
    });
  },
}));
