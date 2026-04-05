"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MacroSummary } from "@/components/MacroSummary";
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface FoodLogEntry {
  id: number;
  meal_type: MealType;
  food_id: number | null;
  meal_id: number | null;
  quantity_g: number | null;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  food_name?: string;
}

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface EstimatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function displayDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDate(date) === formatDate(today)) return "Today";
  if (formatDate(date) === formatDate(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export default function FoodPage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingFor, setAddingFor] = useState<MealType | null>(null);

  // Add form state
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [estimated, setEstimated] = useState<EstimatedNutrition | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [saving, setSaving] = useState(false);

  const dateStr = formatDate(currentDate);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [logRes, targetRes, foodsRes] = await Promise.all([
      supabase
        .from("food_log")
        .select("*")
        .eq("user_id", user.id)
        .eq("logged_at", dateStr)
        .order("id", { ascending: true }),
      supabase
        .from("nutrition_targets")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single(),
      supabase
        .from("foods")
        .select("id, name")
        .eq("user_id", user.id),
    ]);

    const foodMap = new Map<number, string>();
    if (foodsRes.data) {
      for (const f of foodsRes.data) {
        foodMap.set(f.id, f.name);
      }
    }

    if (logRes.data) {
      setEntries(
        logRes.data.map((e) => ({
          ...e,
          meal_type: e.meal_type as MealType,
          food_name: e.food_id ? foodMap.get(e.food_id) : undefined,
        }))
      );
    }

    if (targetRes.data) {
      setTargets({
        calories: targetRes.data.calories,
        protein: targetRes.data.protein_g,
        carbs: targetRes.data.carbs_g,
        fat: targetRes.data.fat_g,
      });
    }

    setLoading(false);
  }, [supabase, dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function changeDay(offset: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    setCurrentDate(d);
    setAddingFor(null);
    resetForm();
  }

  function resetForm() {
    setFoodName("");
    setQuantity("100");
    setEstimated(null);
    setEstimateError("");
  }

  async function handleEstimate() {
    if (!foodName.trim()) return;
    setEstimating(true);
    setEstimateError("");
    setEstimated(null);

    try {
      const res = await fetch("/api/estimate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: foodName }),
      });
      const data = await res.json();
      if (res.ok) {
        setEstimated(data);
      } else {
        setEstimateError(data.error || "Could not estimate nutrition");
      }
    } catch {
      setEstimateError("Failed to estimate nutrition");
    } finally {
      setEstimating(false);
    }
  }

  async function handleLog() {
    if (!addingFor || !estimated) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const q = parseFloat(quantity) || 100;
    const multiplier = q / 100;

    // Create food entry first
    const { data: food } = await supabase
      .from("foods")
      .insert({
        user_id: user.id,
        name: foodName.trim(),
        calories_per_100g: estimated.calories,
        protein_per_100g: estimated.protein,
        carbs_per_100g: estimated.carbs,
        fat_per_100g: estimated.fat,
        is_verified: false,
      })
      .select("id")
      .single();

    await supabase.from("food_log").insert({
      user_id: user.id,
      logged_at: dateStr,
      meal_type: addingFor,
      food_id: food?.id ?? null,
      quantity_g: q,
      servings: 1,
      calories: Math.round(estimated.calories * multiplier),
      protein: Math.round(estimated.protein * multiplier * 10) / 10,
      carbs: Math.round(estimated.carbs * multiplier * 10) / 10,
      fat: Math.round(estimated.fat * multiplier * 10) / 10,
    });

    resetForm();
    setAddingFor(null);
    setSaving(false);
    fetchData();
  }

  async function handleDelete(id: number) {
    await supabase.from("food_log").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="p-4 space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDay(-1)} className="p-2 rounded-lg bg-card border border-border">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{displayDate(currentDate)}</h1>
        <button onClick={() => changeDay(1)} className="p-2 rounded-lg bg-card border border-border">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Quick links */}
      <div className="flex gap-2">
        <Link
          href="/meals"
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          My Meals
        </Link>
        <Link
          href="/settings"
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors ml-auto"
        >
          Targets
        </Link>
      </div>

      {/* Macro summary */}
      <MacroSummary
        calories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        targets={targets}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        /* Meal sections */
        MEAL_TYPES.map(({ key, label }) => {
          const mealEntries = entries.filter((e) => e.meal_type === key);
          const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0);

          return (
            <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="font-semibold">{label}</h2>
                  {mealCals > 0 && (
                    <span className="text-xs text-muted">{mealCals} kcal</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (addingFor === key) {
                      setAddingFor(null);
                      resetForm();
                    } else {
                      setAddingFor(key);
                      resetForm();
                    }
                  }}
                  className="flex items-center gap-1 text-sm text-primary font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              {/* Logged items */}
              {mealEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{entry.food_name || "Unknown food"}</p>
                    <p className="text-xs text-muted">
                      {entry.quantity_g}g &middot; P:{Math.round(entry.protein)}g &middot; C:{Math.round(entry.carbs)}g &middot; F:{Math.round(entry.fat)}g
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{entry.calories} kcal</span>
                    <button onClick={() => handleDelete(entry.id)} className="text-muted hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {mealEntries.length === 0 && addingFor !== key && (
                <div className="px-4 py-3 text-sm text-muted">No items logged</div>
              )}

              {/* Add form */}
              {addingFor === key && (
                <div className="p-4 border-t border-border space-y-3 bg-secondary/30">
                  <input
                    type="text"
                    placeholder="Food name (e.g. chicken breast)"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Grams"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={handleEstimate}
                      disabled={estimating || !foodName.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-sm font-medium disabled:opacity-50"
                    >
                      {estimating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Estimate
                    </button>
                  </div>

                  {estimateError && (
                    <p className="text-xs text-destructive">{estimateError}</p>
                  )}

                  {estimated && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 bg-background rounded-lg">
                          <p className="text-muted">Cal/100g</p>
                          <p className="font-medium">{estimated.calories}</p>
                        </div>
                        <div className="p-2 bg-background rounded-lg">
                          <p className="text-muted">Protein</p>
                          <p className="font-medium">{estimated.protein}g</p>
                        </div>
                        <div className="p-2 bg-background rounded-lg">
                          <p className="text-muted">Carbs</p>
                          <p className="font-medium">{estimated.carbs}g</p>
                        </div>
                        <div className="p-2 bg-background rounded-lg">
                          <p className="text-muted">Fat</p>
                          <p className="font-medium">{estimated.fat}g</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLog}
                        disabled={saving}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? "Logging..." : `Log ${quantity}g of ${foodName}`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
