"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface RepInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function RepInput({ value, onChange }: RepInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function handleEditConfirm() {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:bg-card transition-colors"
      >
        <Minus className="h-4 w-4" />
      </button>

      {isEditing ? (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditConfirm}
          onKeyDown={(e) => e.key === "Enter" && handleEditConfirm()}
          className="w-16 text-center text-xl font-bold bg-card border border-border rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
          min={0}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditValue(value.toString());
            setIsEditing(true);
          }}
          className="w-16 text-center"
        >
          <span className="text-xl font-bold">{value}</span>
          <span className="text-xs text-muted ml-1">reps</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:bg-card transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
