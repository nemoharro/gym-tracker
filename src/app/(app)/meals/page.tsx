"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MealCard } from "@/components/MealCard";
import { Plus } from "lucide-react";
import Link from "next/link";

interface MealWithTotals {
  id: number;
  name: string;
  ingredientCount: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<MealWithTotals[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchMeals() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: mealsData, error: mealsError } = await supabase
      .from("meals")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (mealsError || !mealsData) {
      setLoading(false);
      return;
    }

    const mealsWithTotals: MealWithTotals[] = [];

    for (const meal of mealsData) {
      const { data: ingredients } = await supabase
        .from("meal_ingredients")
        .select("quantity_g, food_id")
        .eq("meal_id", meal.id);

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      if (ingredients) {
        const foodIds = [...new Set(ingredients.map((i) => i.food_id))];
        const { data: foods } = await supabase
          .from("foods")
          .select("id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
          .in("id", foodIds);

        const foodMap = new Map(foods?.map((f) => [f.id, f]));

        for (const ing of ingredients) {
          const food = foodMap.get(ing.food_id);
          if (!food) continue;
          const factor = ing.quantity_g / 100;
          totalCalories += factor * food.calories_per_100g;
          totalProtein += factor * food.protein_per_100g;
          totalCarbs += factor * food.carbs_per_100g;
          totalFat += factor * food.fat_per_100g;
        }
      }

      mealsWithTotals.push({
        id: meal.id,
        name: meal.name,
        ingredientCount: ingredients?.length ?? 0,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });
    }

    setMeals(mealsWithTotals);
    setLoading(false);
  }

  useEffect(() => {
    fetchMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: number) {
    const { error: ingError } = await supabase
      .from("meal_ingredients")
      .delete()
      .eq("meal_id", id);

    if (ingError) {
      alert("Failed to delete meal ingredients. Please try again.");
      return;
    }

    const { error } = await supabase.from("meals").delete().eq("id", id);

    if (error) {
      alert("Failed to delete meal. Please try again.");
      return;
    }

    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Saved Meals</h1>
        <Link
          href="/meals/create"
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          New Meal
        </Link>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading meals...</p>
      ) : meals.length === 0 ? (
        <p className="text-muted text-sm">
          No saved meals yet. Create your first meal template!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              id={meal.id}
              name={meal.name}
              ingredientCount={meal.ingredientCount}
              totalCalories={meal.totalCalories}
              totalProtein={meal.totalProtein}
              totalCarbs={meal.totalCarbs}
              totalFat={meal.totalFat}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
