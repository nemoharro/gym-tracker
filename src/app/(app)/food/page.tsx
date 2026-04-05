"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MacroSummary } from "@/components/MacroSummary";
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Sparkles, BookOpen, Mic, MicOff, Pencil, Check, X, Zap, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { parseFoodSpeech } from "@/lib/parseFoodSpeech";

interface FoodLogEntry {
  id: number;
  food_id: number | null;
  quantity_g: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  food_name?: string;
}

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface EstimatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturated_fat: number;
  sodium: number;
  source?: string;
  product_name?: string;
  brand?: string;
}

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
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [estimated, setEstimated] = useState<EstimatedNutrition | null>(null);
  const [editableEstimate, setEditableEstimate] = useState<EstimatedNutrition | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit entry state
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editEntryValues, setEditEntryValues] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Recent foods
  const [recentFoods, setRecentFoods] = useState<Array<{ food_id: number; name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; fiber_per_100g: number; quantity_g: number }>>([]);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; fiber_per_100g: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Quick add
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickCalories, setQuickCalories] = useState("");
  const [quickName, setQuickName] = useState("");

  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition();

  // Handle voice transcript
  useEffect(() => {
    if (!transcript) return;
    const parsed = parseFoodSpeech(transcript);
    if (parsed.foodName) setFoodName(parsed.foodName);
    if (parsed.quantity !== null) setQuantity(String(parsed.quantity));
    setShowAddForm(true);
  }, [transcript]);

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
        fiber: targetRes.data.fiber_g ?? 30,
      });
    }

    setLoading(false);
  }, [supabase, dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch recent unique foods
  useEffect(() => {
    async function fetchRecents() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("food_log")
        .select("food_id, quantity_g")
        .eq("user_id", user.id)
        .not("food_id", "is", null)
        .order("id", { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return;

      // Deduplicate by food_id, keep most recent
      const seen = new Set<number>();
      const unique: Array<{ food_id: number; quantity_g: number }> = [];
      for (const entry of data) {
        if (entry.food_id && !seen.has(entry.food_id)) {
          seen.add(entry.food_id);
          unique.push({ food_id: entry.food_id, quantity_g: entry.quantity_g ?? 100 });
          if (unique.length >= 10) break;
        }
      }

      const foodIds = unique.map((u) => u.food_id);
      const { data: foods } = await supabase
        .from("foods")
        .select("id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g")
        .in("id", foodIds);

      if (!foods) return;

      const foodMap = new Map(foods.map((f) => [f.id, f]));
      setRecentFoods(unique.map((u) => {
        const f = foodMap.get(u.food_id);
        return f ? { ...f, food_id: f.id, fiber_per_100g: f.fiber_per_100g ?? 0, quantity_g: u.quantity_g } : null;
      }).filter(Boolean) as typeof recentFoods);
    }
    fetchRecents();
  }, [supabase, entries]);

  // Autocomplete: search user's food database as they type
  useEffect(() => {
    if (foodName.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("foods")
        .select("id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g")
        .eq("user_id", user.id)
        .ilike("name", `%${foodName}%`)
        .limit(5);

      if (data && data.length > 0) {
        setSuggestions(data.map((f) => ({ ...f, fiber_per_100g: f.fiber_per_100g ?? 0 })));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [foodName, supabase]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + (e.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  function changeDay(offset: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    setCurrentDate(d);
    setShowAddForm(false);
    resetForm();
  }

  function resetForm() {
    setFoodName("");
    setQuantity("100");
    setEstimated(null);
    setEditableEstimate(null);
    setEstimateError("");
  }

  async function handleEstimate() {
    if (!foodName.trim()) return;
    setEstimating(true);
    setEstimateError("");
    setEstimated(null);
    setEditableEstimate(null);

    try {
      const res = await fetch("/api/estimate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: foodName }),
      });
      const data = await res.json();
      if (res.ok) {
        setEstimated(data);
        setEditableEstimate(data);
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
    if (!editableEstimate || !foodName.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const q = parseFloat(quantity) || 100;
    const multiplier = q / 100;

    // Upsert food to avoid duplicates by name per user
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .upsert({
        user_id: user.id,
        name: foodName.trim(),
        calories_per_100g: editableEstimate.calories,
        protein_per_100g: editableEstimate.protein,
        carbs_per_100g: editableEstimate.carbs,
        fat_per_100g: editableEstimate.fat,
        fiber_per_100g: editableEstimate.fiber,
        sugar_per_100g: editableEstimate.sugar,
        saturated_fat_per_100g: editableEstimate.saturated_fat,
        sodium_per_100g: editableEstimate.sodium,
        is_verified: false,
      }, { onConflict: "name,user_id" })
      .select("id")
      .single();

    if (foodError) {
      alert("Failed to save food. Please try again.");
      setSaving(false);
      return;
    }

    const { error: logError } = await supabase.from("food_log").insert({
      user_id: user.id,
      logged_at: dateStr,
      meal_type: "general",
      food_id: food?.id ?? null,
      quantity_g: q,
      servings: 1,
      calories: Math.round(editableEstimate.calories * multiplier),
      protein: Math.round(editableEstimate.protein * multiplier * 10) / 10,
      carbs: Math.round(editableEstimate.carbs * multiplier * 10) / 10,
      fat: Math.round(editableEstimate.fat * multiplier * 10) / 10,
      fiber: Math.round(editableEstimate.fiber * multiplier * 10) / 10,
      sugar: Math.round(editableEstimate.sugar * multiplier * 10) / 10,
      saturated_fat: Math.round(editableEstimate.saturated_fat * multiplier * 10) / 10,
      sodium: Math.round(editableEstimate.sodium * multiplier * 10) / 10,
    });

    if (logError) {
      alert("Failed to log food. Please try again.");
      setSaving(false);
      return;
    }

    resetForm();
    setShowAddForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("food_log").delete().eq("id", id);
    if (error) {
      alert("Failed to delete entry. Please try again.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function startEditEntry(entry: FoodLogEntry) {
    setEditingEntryId(entry.id);
    setEditEntryValues({
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber ?? 0,
    });
  }

  async function saveEditEntry(id: number) {
    const { error } = await supabase.from("food_log").update({
      calories: editEntryValues.calories,
      protein: editEntryValues.protein,
      carbs: editEntryValues.carbs,
      fat: editEntryValues.fat,
      fiber: editEntryValues.fiber,
    }).eq("id", id);

    if (error) {
      alert("Failed to save changes. Please try again.");
      return;
    }

    setEditingEntryId(null);
    fetchData();
  }

  async function handleQuickLog(recent: typeof recentFoods[0]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mult = recent.quantity_g / 100;
    await supabase.from("food_log").insert({
      user_id: user.id,
      logged_at: dateStr,
      meal_type: "general",
      food_id: recent.food_id,
      quantity_g: recent.quantity_g,
      servings: 1,
      calories: Math.round(recent.calories_per_100g * mult),
      protein: Math.round(recent.protein_per_100g * mult * 10) / 10,
      carbs: Math.round(recent.carbs_per_100g * mult * 10) / 10,
      fat: Math.round(recent.fat_per_100g * mult * 10) / 10,
      fiber: Math.round(recent.fiber_per_100g * mult * 10) / 10,
    });
    fetchData();
  }

  function handleSelectSuggestion(food: typeof suggestions[0]) {
    setFoodName(food.name);
    setShowSuggestions(false);
    setEditableEstimate({
      calories: Number(food.calories_per_100g),
      protein: Number(food.protein_per_100g),
      carbs: Number(food.carbs_per_100g),
      fat: Number(food.fat_per_100g),
      fiber: Number(food.fiber_per_100g),
      sugar: 0,
      saturated_fat: 0,
      sodium: 0,
      source: "database",
    });
    setEstimated({
      calories: Number(food.calories_per_100g),
      protein: Number(food.protein_per_100g),
      carbs: Number(food.carbs_per_100g),
      fat: Number(food.fat_per_100g),
      fiber: Number(food.fiber_per_100g),
      sugar: 0,
      saturated_fat: 0,
      sodium: 0,
    });
  }

  async function handleQuickAdd() {
    const cal = parseFloat(quickCalories);
    if (!cal || cal <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("food_log").insert({
      user_id: user.id,
      logged_at: dateStr,
      meal_type: "general",
      food_id: null,
      quantity_g: null,
      servings: 1,
      calories: Math.round(cal),
      protein: 0,
      carbs: 0,
      fat: 0,
    });

    setQuickCalories("");
    setQuickName("");
    setShowQuickAdd(false);
    fetchData();
  }

  async function handleTargetsChange(newTargets: { calories: number; protein: number; carbs: number; fat: number; fiber: number }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("nutrition_targets")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const payload = {
      user_id: user.id,
      calories: newTargets.calories,
      protein_g: newTargets.protein,
      carbs_g: newTargets.carbs,
      fat_g: newTargets.fat,
      fiber_g: newTargets.fiber,
    };

    if (existing) {
      await supabase.from("nutrition_targets").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("nutrition_targets").insert(payload);
    }

    setTargets(newTargets);
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
      </div>

      {/* Macro summary with inline editing */}
      <MacroSummary
        calories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        fiber={totals.fiber}
        targets={targets}
        onTargetsChange={handleTargetsChange}
      />

      {/* Recent foods */}
      {recentFoods.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted font-medium px-1">Quick add from recent</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {recentFoods.map((rf) => (
              <button
                key={rf.food_id}
                onClick={() => handleQuickLog(rf)}
                className="flex-shrink-0 px-3 py-2 bg-card border border-border rounded-lg text-left hover:border-primary transition-colors"
              >
                <p className="text-xs font-medium truncate max-w-[120px]">{rf.name}</p>
                <p className="text-xs text-muted">{rf.quantity_g}g &middot; {Math.round(rf.calories_per_100g * rf.quantity_g / 100)} kcal</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold">Food Log</h2>
              {totals.calories > 0 && (
                <span className="text-xs text-muted">{Math.round(totals.calories)} kcal total</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowQuickAdd(!showQuickAdd); setShowAddForm(false); }}
                className="flex items-center gap-1 text-sm text-muted font-medium"
              >
                <Zap className="h-3.5 w-3.5" />
                Quick
              </button>
              <button
                onClick={() => { setShowAddForm(!showAddForm); setShowQuickAdd(false); if (showAddForm) resetForm(); }}
                className="flex items-center gap-1 text-sm text-primary font-medium"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {/* Quick add form */}
          {showQuickAdd && (
            <div className="p-4 border-b border-border bg-secondary/30 space-y-2">
              <p className="text-xs text-muted font-medium">Quick calorie entry</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Food name (optional)"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                />
                <div className="relative w-24">
                  <input
                    type="number"
                    placeholder="Cal"
                    value={quickCalories}
                    onChange={(e) => setQuickCalories(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">kcal</span>
                </div>
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={!quickCalories || parseFloat(quickCalories) <= 0}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                Log {quickCalories ? `${quickCalories} kcal` : ""}
              </button>
            </div>
          )}

          {/* Food entries */}
          {entries.map((entry) => (
            <div key={entry.id} className="border-b border-border last:border-b-0">
              {editingEntryId === entry.id ? (
                <div className="p-4 space-y-2 bg-secondary/30">
                  <p className="text-sm font-medium">{entry.food_name || "Unknown food"}</p>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {(["calories", "protein", "carbs", "fat", "fiber"] as const).map((key) => (
                      <div key={key}>
                        <label className="text-muted capitalize block mb-1">{key === "calories" ? "Cal" : key}</label>
                        <input
                          type="number"
                          value={editEntryValues[key]}
                          onChange={(e) => setEditEntryValues({ ...editEntryValues, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1.5 py-1 bg-background border border-border rounded text-sm text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingEntryId(null)} className="p-1.5 text-muted hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={() => saveEditEntry(entry.id)} className="p-1.5 text-primary hover:text-primary/80">
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{entry.food_name || "Unknown food"}</p>
                    <p className="text-xs text-muted">
                      {entry.quantity_g}g &middot; P:{Math.round(entry.protein)}g &middot; C:{Math.round(entry.carbs)}g &middot; F:{Math.round(entry.fat)}g
                      {entry.fiber != null && entry.fiber > 0 && <> &middot; Fb:{Math.round(entry.fiber)}g</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.calories} kcal</span>
                    <button onClick={() => startEditEntry(entry)} className="p-1 text-muted hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="text-muted hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {entries.length === 0 && !showAddForm && (
            <div className="px-4 py-3 text-sm text-muted">No items logged</div>
          )}

          {/* Add form */}
          {showAddForm && (
            <div className="p-4 border-t border-border space-y-3 bg-secondary/30">
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Food name (e.g. chicken breast)"
                    value={foodName}
                    onChange={(e) => { setFoodName(e.target.value); setEstimated(null); setEditableEstimate(null); }}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    className={`flex-1 px-3 py-2 rounded-lg bg-background border text-sm focus:outline-none focus:border-primary ${isListening ? "border-primary ring-2 ring-primary/30 animate-pulse" : "border-border"}`}
                  />
                  {isSupported && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`p-2 rounded-lg border transition-colors ${isListening ? "bg-destructive/10 border-destructive text-destructive" : "bg-secondary border-border text-muted hover:text-foreground"}`}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted ml-2">{s.calories_per_100g} kcal/100g</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">g</span>
                </div>
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

              {editableEstimate && (() => {
                const q = parseFloat(quantity) || 100;
                const mult = q / 100;
                return (
                  <div className="space-y-2">
                    {editableEstimate.product_name && (
                      <p className="text-xs text-muted">
                        {editableEstimate.brand && `${editableEstimate.brand} — `}{editableEstimate.product_name}
                      </p>
                    )}
                    {/* Per 100g (editable) */}
                    <p className="text-xs text-muted font-medium">Per 100g (tap to edit)</p>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                      {([
                        { key: "calories", label: "Cal" },
                        { key: "protein", label: "Protein" },
                        { key: "carbs", label: "Carbs" },
                        { key: "fat", label: "Fat" },
                        { key: "fiber", label: "Fiber" },
                      ] as const).map(({ key, label }) => (
                        <div key={key} className="p-1.5 bg-background rounded-lg">
                          <p className="text-muted mb-0.5">{label}</p>
                          <input
                            type="number"
                            value={editableEstimate[key]}
                            onChange={(e) => setEditableEstimate({ ...editableEstimate, [key]: parseFloat(e.target.value) || 0 })}
                            className="w-full text-center text-xs font-medium bg-transparent focus:outline-none focus:bg-secondary rounded"
                          />
                        </div>
                      ))}
                    </div>
                    {/* Live calculated preview for actual quantity */}
                    <p className="text-xs text-muted font-medium">For {q}g</p>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                      {([
                        { label: "Cal", value: Math.round(editableEstimate.calories * mult) },
                        { label: "Protein", value: Math.round(editableEstimate.protein * mult * 10) / 10 },
                        { label: "Carbs", value: Math.round(editableEstimate.carbs * mult * 10) / 10 },
                        { label: "Fat", value: Math.round(editableEstimate.fat * mult * 10) / 10 },
                        { label: "Fiber", value: Math.round(editableEstimate.fiber * mult * 10) / 10 },
                      ]).map(({ label, value }) => (
                        <div key={label} className="p-1.5 bg-primary/5 rounded-lg">
                          <p className="text-muted mb-0.5">{label}</p>
                          <p className="font-semibold text-sm">{value}</p>
                          <p className="text-muted">{label === "Cal" ? "kcal" : "g"}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleLog}
                      disabled={saving}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? "Logging..." : `Log ${q}g of ${foodName}`}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
