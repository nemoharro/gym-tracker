"use client";

import { useState, useEffect } from "react";
import { WeightSelector } from "./WeightSelector";
import { RepInput } from "./RepInput";
import { Check } from "lucide-react";
import { useLastSession } from "@/hooks/useLastSession";

interface AddSetFormProps {
  exerciseId: number;
  currentSessionId: number | null;
  currentSetCount: number;
  onAdd: (weightKg: number, reps: number) => void;
}

export function AddSetForm({ exerciseId, currentSessionId, currentSetCount, onAdd }: AddSetFormProps) {
  const { lastSession } = useLastSession(exerciseId, currentSessionId);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(8);
  const [initialized, setInitialized] = useState(false);

  // Pre-fill from last session
  useEffect(() => {
    if (lastSession && !initialized) {
      const lastSet = lastSession.sets[Math.min(currentSetCount, lastSession.sets.length - 1)];
      if (lastSet) {
        setWeight(lastSet.weight_kg);
        setReps(lastSet.reps);
      }
      setInitialized(true);
    }
  }, [lastSession, initialized, currentSetCount]);

  function handleAdd() {
    onAdd(weight, reps);
  }

  return (
    <div className="space-y-3 p-3 bg-card rounded-xl border border-border">
      <div className="flex flex-col items-center gap-3">
        <div>
          <label className="text-xs text-muted block text-center mb-1">Weight</label>
          <WeightSelector value={weight} onChange={setWeight} />
        </div>
        <div>
          <label className="text-xs text-muted block text-center mb-1">Reps</label>
          <RepInput value={reps} onChange={setReps} />
        </div>
      </div>
      <button
        onClick={handleAdd}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
      >
        <Check className="h-4 w-4" />
        Log Set #{currentSetCount + 1}
      </button>
    </div>
  );
}
