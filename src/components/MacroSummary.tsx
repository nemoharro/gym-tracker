"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MacroSummaryProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  targets: MacroTargets | null;
  onTargetsChange?: (targets: MacroTargets) => void;
}

function calcCalories(protein: number, carbs: number, fat: number) {
  return Math.round((protein * 4) + (carbs * 4) + (fat * 9));
}

export function MacroSummary({ calories, protein, carbs, fat, fiber, targets, onTargetsChange }: MacroSummaryProps) {
  const defaultTargets: MacroTargets = { calories: 2500, protein: 180, carbs: 250, fat: 80, fiber: 30 };
  const t = targets ?? defaultTargets;

  const [isEditing, setIsEditing] = useState(false);
  const [editProtein, setEditProtein] = useState(t.protein);
  const [editCarbs, setEditCarbs] = useState(t.carbs);
  const [editFat, setEditFat] = useState(t.fat);

  const editCalories = calcCalories(editProtein, editCarbs, editFat);

  function handleSave() {
    onTargetsChange?.({
      calories: editCalories,
      protein: editProtein,
      carbs: editCarbs,
      fat: editFat,
      fiber: t.fiber,
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setEditProtein(t.protein);
    setEditCarbs(t.carbs);
    setEditFat(t.fat);
    setIsEditing(false);
  }

  function handleStartEdit() {
    setEditProtein(t.protein);
    setEditCarbs(t.carbs);
    setEditFat(t.fat);
    setIsEditing(true);
  }

  const macros = [
    { key: "calories" as const, label: "Calories", current: calories, target: isEditing ? editCalories : t.calories, unit: "kcal", color: "bg-primary", editable: false },
    { key: "protein" as const, label: "Protein", current: protein, target: isEditing ? editProtein : t.protein, unit: "g", color: "bg-red-500", editable: true },
    { key: "carbs" as const, label: "Carbs", current: carbs, target: isEditing ? editCarbs : t.carbs, unit: "g", color: "bg-yellow-500", editable: true },
    { key: "fat" as const, label: "Fat", current: fat, target: isEditing ? editFat : t.fat, unit: "g", color: "bg-orange-500", editable: true },
    { key: "fiber" as const, label: "Fiber", current: fiber, target: t.fiber, unit: "g", color: "bg-green-500", editable: false },
  ];

  function handleEditChange(key: string, value: number) {
    if (key === "protein") setEditProtein(value);
    else if (key === "carbs") setEditCarbs(value);
    else if (key === "fat") setEditFat(value);
  }

  const remainingCal = Math.round(t.calories - calories);

  return (
    <div className="space-y-3 p-4 bg-card rounded-xl border border-border">
      {/* Remaining calories hero */}
      {!isEditing && (
        <div className="text-center pb-2 border-b border-border">
          <p className={`text-3xl font-bold ${remainingCal < 0 ? "text-destructive" : "text-foreground"}`}>
            {Math.abs(remainingCal)}
          </p>
          <p className="text-xs text-muted">
            {remainingCal >= 0 ? "kcal remaining" : "kcal over"}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Daily Nutrition</span>
        {onTargetsChange && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="p-1 text-muted hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1 text-primary hover:text-primary/80">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={handleCancel} className="p-1 text-muted hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {macros.map((m) => {
        const pct = Math.min(100, (m.current / m.target) * 100);
        const isOver = m.current > m.target;
        return (
          <div key={m.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">{m.label}</span>
              {isEditing && m.editable ? (
                <div className="flex items-center gap-1">
                  <span>{Math.round(m.current)} /</span>
                  <input
                    type="number"
                    value={m.target}
                    onChange={(e) => handleEditChange(m.key, parseFloat(e.target.value) || 0)}
                    className="w-16 px-1 py-0.5 text-right text-sm bg-background border border-border rounded"
                  />
                  <span className="text-muted text-xs">{m.unit}</span>
                </div>
              ) : (
                <span className={isOver ? "text-destructive font-medium" : ""}>
                  {Math.round(m.current)} / {m.target} {m.unit}
                </span>
              )}
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${m.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {!isEditing && (
              <p className={`text-xs mt-0.5 ${isOver ? "text-destructive" : "text-muted"}`}>
                {isOver
                  ? `${Math.round(m.current - m.target)} ${m.unit} over`
                  : `${Math.round(m.target - m.current)} ${m.unit} left`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
