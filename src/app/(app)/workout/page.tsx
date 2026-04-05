"use client";

import { useState, useEffect } from "react";
import { useWorkout } from "@/hooks/useWorkout";
import { ExercisePicker } from "@/components/ExercisePicker";
import { LastSessionBanner } from "@/components/LastSessionBanner";
import { SetRow } from "@/components/SetRow";
import { AddSetForm } from "@/components/AddSetForm";
import { Plus, Square, Timer, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { Exercise } from "@/hooks/useExercises";

function formatDuration(startedAt: string) {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function WorkoutTimer({ startedAt }: { startedAt: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted">
      <Timer className="h-4 w-4" />
      <span>{formatDuration(startedAt)}</span>
    </div>
  );
}

function ExerciseCard({
  exerciseId,
  exerciseName,
  sets,
  sessionId,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
}: {
  exerciseId: number;
  exerciseName: string;
  sets: Array<{ setNumber: number; weightKg: number; reps: number; rpe?: number }>;
  sessionId: number | null;
  onAddSet: (exerciseId: number, weight: number, reps: number) => void;
  onDeleteSet: (exerciseId: number, setIndex: number) => void;
  onRemoveExercise: (exerciseId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">{exerciseName}</h3>
          <span className="text-xs text-muted bg-secondary px-2 py-0.5 rounded-full">
            {sets.length} {sets.length === 1 ? "set" : "sets"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <LastSessionBanner exerciseId={exerciseId} currentSessionId={sessionId} />

          {sets.length > 0 && (
            <div className="space-y-1.5">
              {sets.map((set, i) => (
                <SetRow
                  key={i}
                  setNumber={set.setNumber}
                  weightKg={set.weightKg}
                  reps={set.reps}
                  rpe={set.rpe}
                  onDelete={() => onDeleteSet(exerciseId, i)}
                />
              ))}
            </div>
          )}

          <AddSetForm
            exerciseId={exerciseId}
            currentSessionId={sessionId}
            currentSetCount={sets.length}
            onAdd={(weight, reps) => onAddSet(exerciseId, weight, reps)}
          />

          <button
            onClick={() => onRemoveExercise(exerciseId)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-destructive transition-colors mx-auto"
          >
            <Trash2 className="h-3 w-3" />
            Remove exercise
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  const {
    isActive,
    sessionId,
    startedAt,
    exercises,
    startWorkout,
    finishWorkout,
    addExercise,
    removeExercise,
    addSet,
    deleteSet,
  } = useWorkout();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  function handleSelectExercise(exercise: Exercise) {
    addExercise(exercise.id, exercise.name);
  }

  async function handleFinish() {
    setFinishing(true);
    await finishWorkout();
    setFinishing(false);
  }

  // Not started yet
  if (!isActive) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Ready to train?</h1>
          <p className="text-muted">Start a workout to begin tracking your sets.</p>
        </div>
        <button
          onClick={startWorkout}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg active:opacity-80 transition-opacity"
        >
          Start Workout
        </button>
      </div>
    );
  }

  // Active workout
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Workout</h1>
          {startedAt && <WorkoutTimer startedAt={startedAt} />}
        </div>
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-medium text-sm active:opacity-80 transition-opacity disabled:opacity-50"
        >
          <Square className="h-3.5 w-3.5" />
          {finishing ? "Finishing..." : "Finish"}
        </button>
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No exercises added yet.</p>
          <p className="text-sm mt-1">Tap the button below to add your first exercise.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.exerciseId}
              exerciseId={exercise.exerciseId}
              exerciseName={exercise.exerciseName}
              sets={exercise.sets}
              sessionId={sessionId}
              onAddSet={(eid, w, r) => addSet(eid, w, r)}
              onDeleteSet={(eid, idx) => deleteSet(eid, idx)}
              onRemoveExercise={removeExercise}
            />
          ))}
        </div>
      )}

      {/* Add exercise FAB */}
      <button
        onClick={() => setPickerOpen(true)}
        className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted font-medium flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-5 w-5" />
        Add Exercise
      </button>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelectExercise}
      />
    </div>
  );
}
