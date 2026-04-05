"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { searchFoodDatabase } from "@/lib/foodDatabase";

interface Food {
  id: number;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface Ingredient {
  food: Food;
  quantity_g: number;
}

export default function CreateMealPage() {
  const [mealName, setMealName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isBatch, setIsBatch] = useState(false);
  const [totalWeightOverride, setTotalWeightOverride] = useState("");

  const supabase = createClient();
  const router = useRouter();

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setSearching(false); return; }

    // Search shared foods database
    const { data: userFoods } = await supabase
      .from("foods")
      .select("id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
      .ilike("name", `%${query}%`)
      .limit(10);

    // Also search the internal database
    const internalResults = searchFoodDatabase(query).slice(0, 10).map((f, i) => ({
      id: -(i + 1), // negative IDs to distinguish from DB foods
      name: f.name,
      calories_per_100g: f.calories,
      protein_per_100g: f.protein,
      carbs_per_100g: f.carbs,
      fat_per_100g: f.fat,
      _isInternal: true,
    }));

    // Merge: user foods first, then internal (deduplicate by name)
    const userResults = userFoods ?? [];
    const seenNames = new Set(userResults.map((f) => f.name.toLowerCase()));
    const combined = [
      ...userResults,
      ...internalResults.filter((f) => !seenNames.has(f.name.toLowerCase())),
    ].slice(0, 15);

    setSearchResults(combined);
    setSearching(false);
  }

  async function handleSelectFood(food: Food) {
    // If it's an internal database food (negative ID), save it to user's foods first
    if (food.id < 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to find existing food by name first
      const { data: existing } = await supabase
        .from("foods")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", food.name)
        .maybeSingle();

      if (existing) {
        food = { ...food, id: existing.id };
      } else {
        // Insert new food
        const { data: saved } = await supabase
          .from("foods")
          .insert({
            user_id: user.id,
            name: food.name,
            calories_per_100g: food.calories_per_100g,
            protein_per_100g: food.protein_per_100g,
            carbs_per_100g: food.carbs_per_100g,
            fat_per_100g: food.fat_per_100g,
            is_verified: false,
          })
          .select("id")
          .single();

        if (saved) {
          food = { ...food, id: saved.id };
        } else {
          alert("Failed to save food to your database.");
          return;
        }
      }
    }

    setSelectedFood(food);
    setSearchQuery("");
    setSearchResults([]);
    setQuantity("");
  }

  function handleAddIngredient() {
    if (!selectedFood || !quantity) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    setIngredients((prev) => [...prev, { food: selectedFood, quantity_g: qty }]);
    setSelectedFood(null);
    setQuantity("");
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  const totals = ingredients.reduce(
    (acc, ing) => {
      const factor = ing.quantity_g / 100;
      return {
        calories: acc.calories + factor * ing.food.calories_per_100g,
        protein: acc.protein + factor * ing.food.protein_per_100g,
        carbs: acc.carbs + factor * ing.food.carbs_per_100g,
        fat: acc.fat + factor * ing.food.fat_per_100g,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function handleSave() {
    if (!mealName.trim() || ingredients.length === 0) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    let batchWeight: number | null = null;
    if (isBatch) {
      const rawWeight = ingredients.reduce((s, i) => s + i.quantity_g, 0);
      batchWeight = Math.round(parseFloat(totalWeightOverride) || rawWeight);
    }

    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({ user_id: user.id, name: mealName.trim(), total_weight_g: batchWeight })
      .select("id")
      .single();

    if (mealError || !meal) {
      setSaving(false);
      return;
    }

    const ingredientRows = ingredients.map((ing) => ({
      meal_id: meal.id,
      food_id: ing.food.id,
      quantity_g: ing.quantity_g,
    }));

    const { error: ingError } = await supabase
      .from("meal_ingredients")
      .insert(ingredientRows);

    if (ingError) {
      setSaving(false);
      return;
    }

    router.push("/meals");
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/meals" className="text-muted hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Create Meal</h1>
      </div>

      {/* Meal name */}
      <input
        type="text"
        placeholder="Meal name"
        value={mealName}
        onChange={(e) => setMealName(e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted mb-6 focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Add ingredient section */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">Add Ingredient</h2>

        {!selectedFood ? (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {searching && (
              <p className="text-xs text-muted py-2">Searching...</p>
            )}

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {searchResults.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors"
                  >
                    <span className="text-foreground">{food.name}</span>
                    <span className="text-muted text-xs ml-2">
                      {food.calories_per_100g} kcal/100g
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs text-muted py-2">No foods found.</p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{selectedFood.name}</span>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Quantity (g)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleAddIngredient}
                disabled={!quantity || parseFloat(quantity) <= 0}
                className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ingredients list */}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">
            Ingredients ({ingredients.length})
          </h2>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing, index) => {
              const factor = ing.quantity_g / 100;
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{ing.food.name}</p>
                    <p className="text-xs text-muted">
                      {ing.quantity_g}g &middot;{" "}
                      {Math.round(factor * ing.food.calories_per_100g)} kcal
                      &middot; P: {Math.round(factor * ing.food.protein_per_100g)}g
                      &middot; C: {Math.round(factor * ing.food.carbs_per_100g)}g
                      &middot; F: {Math.round(factor * ing.food.fat_per_100g)}g
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-1 text-muted hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meal type + totals */}
      {ingredients.length > 0 && (() => {
        const rawWeight = ingredients.reduce((s, i) => s + i.quantity_g, 0);
        const batchWeight = parseFloat(totalWeightOverride) || rawWeight;
        const per100 = isBatch && batchWeight > 0 ? {
          calories: Math.round(totals.calories / batchWeight * 100),
          protein: Math.round(totals.protein / batchWeight * 100 * 10) / 10,
          carbs: Math.round(totals.carbs / batchWeight * 100 * 10) / 10,
          fat: Math.round(totals.fat / batchWeight * 100 * 10) / 10,
        } : null;

        return (
          <div className="bg-secondary border border-border rounded-xl p-4 mb-6 space-y-3">
            {/* Batch toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Meal Totals</h2>
              <button
                type="button"
                onClick={() => setIsBatch(!isBatch)}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${isBatch ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted"}`}
              >
                {isBatch ? "Batch meal" : "Single meal"}
              </button>
            </div>

            <div className="flex gap-4 text-sm text-muted">
              <span>{Math.round(totals.calories)} kcal</span>
              <span>P: {Math.round(totals.protein)}g</span>
              <span>C: {Math.round(totals.carbs)}g</span>
              <span>F: {Math.round(totals.fat)}g</span>
            </div>

            {!isBatch && (
              <p className="text-xs text-muted">Logging this meal will add all macros at once.</p>
            )}

            {isBatch && (
              <>
                <div>
                  <label className="text-xs text-muted block mb-1">
                    Total batch weight (ingredients: {Math.round(rawWeight)}g)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={String(Math.round(rawWeight))}
                      value={totalWeightOverride}
                      onChange={(e) => setTotalWeightOverride(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">g</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Adjust if cooking changes the weight
                  </p>
                </div>

                {per100 && (
                  <div>
                    <p className="text-xs text-muted font-medium mb-1">Per 100g serving</p>
                    <div className="flex gap-4 text-sm">
                      <span>{per100.calories} kcal</span>
                      <span>P: {per100.protein}g</span>
                      <span>C: {per100.carbs}g</span>
                      <span>F: {per100.fat}g</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !mealName.trim() || ingredients.length === 0}
        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Meal"}
      </button>
    </div>
  );
}
