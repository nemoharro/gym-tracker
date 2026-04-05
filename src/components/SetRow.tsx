"use client";

import { Trash2 } from "lucide-react";

interface SetRowProps {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  onDelete?: () => void;
}

export function SetRow({ setNumber, weightKg, reps, rpe, onDelete }: SetRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted w-6">#{setNumber}</span>
        <span className="font-medium">{weightKg} kg</span>
        <span className="text-muted">x</span>
        <span className="font-medium">{reps} reps</span>
        {rpe && <span className="text-xs text-muted">RPE {rpe}</span>}
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-full hover:bg-destructive/20 text-muted hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
