"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeightSelectorProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export function WeightSelector({ value, onChange, step = 2.5 }: WeightSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function handleDecrement() {
    onChange(Math.max(0, value - step));
  }

  function handleIncrement() {
    onChange(value + step);
  }

  function handleTap() {
    setEditValue(value.toString());
    setIsEditing(true);
  }

  function handleEditConfirm() {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDecrement}
        className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center active:bg-card transition-colors"
      >
        <Minus className="h-5 w-5" />
      </button>

      {isEditing ? (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditConfirm}
          onKeyDown={(e) => e.key === "Enter" && handleEditConfirm()}
          className="w-24 text-center text-2xl font-bold bg-card border border-border rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
          step={step}
          min={0}
        />
      ) : (
        <button
          type="button"
          onClick={handleTap}
          className="w-24 text-center py-2"
        >
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm text-muted ml-1">kg</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleIncrement}
        className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center active:bg-card transition-colors"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
