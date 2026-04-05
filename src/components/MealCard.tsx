"use client";

import { Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface MealCardProps {
  id: number;
  name: string;
  ingredientCount: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  onDelete: (id: number) => void;
}

export function MealCard({
  id,
  name,
  ingredientCount,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  onDelete,
}: MealCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <Link href={`/meals/${id}`} className="flex-1">
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted">{ingredientCount} ingredients</p>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(id);
            }}
            className="p-1.5 rounded-full hover:bg-destructive/20 text-muted hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <Link href={`/meals/${id}`}>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-muted">
        <span>{Math.round(totalCalories)} kcal</span>
        <span>P: {Math.round(totalProtein)}g</span>
        <span>C: {Math.round(totalCarbs)}g</span>
        <span>F: {Math.round(totalFat)}g</span>
      </div>
    </div>
  );
}
