"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PersonalBest {
  weight_kg: number;
  reps: number;
}

export function usePersonalBest(exerciseId: number | null) {
  const [pb, setPb] = useState<PersonalBest | null>(null);

  useEffect(() => {
    if (!exerciseId) return;

    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("workout_sets")
        .select("weight_kg, reps")
        .eq("exercise_id", exerciseId!)
        .order("weight_kg", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setPb({
          weight_kg: Number(data[0].weight_kg),
          reps: Number(data[0].reps),
        });
      }
    }

    fetch();
  }, [exerciseId]);

  return pb;
}
