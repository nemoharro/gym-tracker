"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSplits, type WorkoutSplit } from "@/hooks/useSplits";
import { useExercises, type Exercise } from "@/hooks/useExercises";
import { ArrowLeft, Plus, Trash2, X, Search, Loader2 } from "lucide-react";

export default function SplitDetailPage() {
  const params = useParams<{ splitId: string }>();
  const router = useRouter();
  const { splits, loading, addExerciseToDay, removeExerciseFromDay, refresh } = useSplits();
  const { exercises } = useExercises();

  const [addingToDayId, setAddingToDayId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("10");

  const split = splits.find((s) => s.id === Number(params.splitId));

  const filteredExercises = exercises.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.muscle_group.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddExercise(dayId: number, exercise: Exercise) {
    const day = split?.days.find((d) => d.id === dayId);
    await addExerciseToDay(
      dayId,
      exercise.id,
      day?.exercises.length ?? 0,
      parseInt(targetSets) || undefined,
      parseInt(targetReps) || undefined,
    );
    setAddingToDayId(null);
    setSearch("");
  }

  async function handleRemoveExercise(exerciseRowId: number) {
    await removeExerciseFromDay(exerciseRowId);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!split) {
    return (
      <div className="p-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-muted text-center py-16">Split not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-muted">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold">{split.name}</h1>

      {split.days.map((day) => (
        <div key={day.id} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">{day.name}</h2>
            <button
              onClick={() => { setAddingToDayId(addingToDayId === day.id ? null : day.id); setSearch(""); }}
              className="flex items-center gap-1 text-sm text-primary font-medium"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Exercise list */}
          {day.exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0">
              <div>
                <p className="text-sm">{ex.exercise_name}</p>
                {(ex.target_sets || ex.target_reps) && (
                  <p className="text-xs text-muted">
                    {ex.target_sets && `${ex.target_sets} sets`}
                    {ex.target_sets && ex.target_reps && " × "}
                    {ex.target_reps && `${ex.target_reps} reps`}
                  </p>
                )}
              </div>
              <button onClick={() => handleRemoveExercise(ex.id)} className="p-1 text-muted hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {day.exercises.length === 0 && addingToDayId !== day.id && (
            <div className="px-4 py-3 text-sm text-muted">No exercises added</div>
          )}

          {/* Add exercise form */}
          {addingToDayId === day.id && (
            <div className="p-4 border-t border-border bg-secondary/30 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <button onClick={() => setAddingToDayId(null)} className="p-2 text-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted">Sets</label>
                  <input
                    type="number"
                    value={targetSets}
                    onChange={(e) => setTargetSets(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-sm text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted">Reps</label>
                  <input
                    type="number"
                    value={targetReps}
                    onChange={(e) => setTargetReps(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-sm text-center"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredExercises.slice(0, 20).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExercise(day.id, ex)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors"
                  >
                    <span>{ex.name}</span>
                    <span className="text-xs text-muted ml-2">{ex.muscle_group}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
