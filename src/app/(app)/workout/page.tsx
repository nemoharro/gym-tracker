"use client";

import { useState, useEffect } from "react";
import { useWorkout } from "@/hooks/useWorkout";
import { ExercisePicker } from "@/components/ExercisePicker";
import { LastSessionBanner } from "@/components/LastSessionBanner";
import { SetRow } from "@/components/SetRow";
import { AddSetForm } from "@/components/AddSetForm";
import { Plus, Square, Timer, ChevronDown, ChevronUp, Trash2, Check, Dumbbell, TrendingUp, Trophy, LayoutGrid, X } from "lucide-react";
import Link from "next/link";
import type { Exercise } from "@/hooks/useExercises";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { usePersonalBest } from "@/hooks/usePersonalBest";

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
  const [finalized, setFinalized] = useState(false);
  const pb = usePersonalBest(exerciseId);

  return (
    <div className={`bg-card rounded-xl border overflow-hidden ${finalized ? "border-primary/30" : "border-border"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">{exerciseName}</h3>
            <span className="text-xs text-muted bg-secondary px-2 py-0.5 rounded-full">
              {sets.length} {sets.length === 1 ? "set" : "sets"}
            </span>
            {finalized && <Check className="h-4 w-4 text-primary" />}
          </div>
          {sets.length > 0 && (() => {
            const maxWeight = Math.max(...sets.map(s => s.weightKg));
            const repsAtMax = sets.filter(s => s.weightKg === maxWeight).map(s => s.reps);
            const isPB = pb != null && maxWeight >= pb.weight_kg;
            return (
              <div className="flex items-center gap-1 mt-0.5">
                {isPB && <Trophy className="h-3 w-3 text-yellow-500" />}
                <span className={`text-xs ${isPB ? "text-yellow-500 font-medium" : "text-muted"}`}>
                  {maxWeight}kg × {repsAtMax.join("-")}
                </span>
              </div>
            );
          })()}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {!finalized && <LastSessionBanner exerciseId={exerciseId} currentSessionId={sessionId} />}

          {sets.length > 0 && (
            <div className="space-y-1.5">
              {sets.map((set, i) => (
                <SetRow
                  key={i}
                  setNumber={set.setNumber}
                  weightKg={set.weightKg}
                  reps={set.reps}
                  rpe={set.rpe}
                  isPB={pb != null && set.weightKg >= pb.weight_kg}
                  onDelete={finalized ? undefined : () => onDeleteSet(exerciseId, i)}
                />
              ))}
            </div>
          )}

          {!finalized && (
            <>
              <AddSetForm
                exerciseId={exerciseId}
                currentSessionId={sessionId}
                currentSetCount={sets.length}
                onAdd={(weight, reps) => onAddSet(exerciseId, weight, reps)}
              />

              {sets.length > 0 && (
                <button
                  onClick={() => { setFinalized(true); setExpanded(false); }}
                  className="w-full py-2.5 bg-primary/10 text-primary rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Done
                </button>
              )}

              <button
                onClick={() => onRemoveExercise(exerciseId)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-destructive transition-colors mx-auto"
              >
                <Trash2 className="h-3 w-3" />
                Remove exercise
              </button>
            </>
          )}

          {finalized && (
            <button
              onClick={() => { setFinalized(false); setExpanded(true); }}
              className="w-full py-2 bg-secondary rounded-lg text-sm font-medium"
            >
              Edit
            </button>
          )}
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
    discardWorkout,
    addExercise,
    removeExercise,
    addSet,
    deleteSet,
  } = useWorkout();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  function handleSelectExercise(exercise: Exercise) {
    addExercise(exercise.id, exercise.name);
  }

  async function handleFinish() {
    setFinishing(true);
    await finishWorkout();
    setFinishing(false);
  }

  const { todaysWorkout, loading: todayLoading } = useTodaysWorkout();

  async function handleStartToday() {
    if (todaysWorkout) {
      await startWorkout(todaysWorkout.splitDayId);
    }
  }

  async function handleDiscard() {
    await discardWorkout();
    setShowDiscardConfirm(false);
  }

  // Not started yet
  if (!isActive) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <h1 className="text-xl font-bold">Workout</h1>
          <Link href="/splits" className="p-2 rounded-lg bg-card border border-border">
            <LayoutGrid className="h-5 w-5 text-muted" />
          </Link>
        </div>
        <div className="text-center py-2">
          <p className="text-muted text-sm">Start a workout to begin tracking your sets.</p>
        </div>

        {/* Today's preview */}
        {todaysWorkout && todaysWorkout.exercises.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{todaysWorkout.splitDayName}</h2>
              </div>
              <p className="text-xs text-muted">{todaysWorkout.splitName}</p>
            </div>

            <div className="divide-y divide-border">
              {todaysWorkout.exercises.map((ex) => (
                <div key={ex.exerciseId} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ex.exerciseName}</p>
                    {ex.targetSets && ex.targetReps && (
                      <span className="text-xs text-muted">{ex.targetSets}×{ex.targetReps}</span>
                    )}
                  </div>
                  {ex.lastWeight !== null && (
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-muted">Last: {ex.lastWeight}kg × {ex.lastReps}</span>
                      {ex.suggestedWeight !== null && ex.suggestedWeight !== ex.lastWeight && (
                        <span className="text-primary flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          {ex.suggestedWeight}kg × {ex.suggestedReps}
                        </span>
                      )}
                      {ex.suggestedReps !== null && ex.suggestedWeight === ex.lastWeight && ex.suggestedReps !== ex.lastReps && (
                        <span className="text-primary flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          {ex.suggestedWeight}kg × {ex.suggestedReps}
                        </span>
                      )}
                    </div>
                  )}
                  {ex.lastWeight === null && (
                    <p className="text-xs text-muted mt-1">No previous data</p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <button
                onClick={handleStartToday}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold active:opacity-80 transition-opacity"
              >
                Start {todaysWorkout.splitDayName}
              </button>
            </div>
          </div>
        )}

        {/* Empty workout option */}
        <button
          onClick={() => startWorkout()}
          className="w-full py-3 rounded-xl font-semibold active:opacity-80 transition-opacity bg-primary text-primary-foreground"
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiscardConfirm(true)}
            className="flex items-center gap-1 px-3 py-2 text-muted rounded-lg text-sm active:opacity-80"
          >
            <X className="h-3.5 w-3.5" />
            Discard
          </button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm active:opacity-80 transition-opacity disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {finishing ? "Saving..." : "Finish"}
          </button>
        </div>
      </div>

      {/* Discard confirmation */}
      {showDiscardConfirm && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-destructive">Discard this workout?</p>
          <p className="text-xs text-muted">All logged sets will be permanently deleted.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscardConfirm(false)}
              className="flex-1 py-2 rounded-lg bg-secondary text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDiscard}
              className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
            >
              Discard
            </button>
          </div>
        </div>
      )}

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
