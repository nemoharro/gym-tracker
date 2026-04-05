"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string | null;
  is_custom: boolean;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("exercises")
        .select("id, name, muscle_group, equipment, is_custom")
        .order("muscle_group")
        .order("name");

      if (data) setExercises(data);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises;
    const q = search.toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_group.toLowerCase().includes(q) ||
        (e.equipment && e.equipment.toLowerCase().includes(q))
    );
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    for (const e of filtered) {
      if (!groups[e.muscle_group]) groups[e.muscle_group] = [];
      groups[e.muscle_group].push(e);
    }
    return groups;
  }, [filtered]);

  return { exercises: filtered, grouped, loading, search, setSearch };
}
