import { NextResponse } from "next/server";
import { searchFoodDatabase } from "@/lib/foodDatabase";

async function searchOpenFoodFacts(query: string) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&countries_tags_en=australia&fields=product_name,brands,nutriments&page_size=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GymTracker/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.products || data.products.length === 0) return null;

    for (const product of data.products) {
      const n = product.nutriments;
      if (!n || n["energy-kcal_100g"] === undefined) continue;

      return {
        calories: Math.round(n["energy-kcal_100g"] || 0),
        protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
        carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
        fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
        fiber: Math.round((n["fiber_100g"] || 0) * 10) / 10,
        sugar: Math.round((n["sugars_100g"] || 0) * 10) / 10,
        saturated_fat: Math.round((n["saturated-fat_100g"] || 0) * 10) / 10,
        sodium: Math.round((n["sodium_100g"] || 0) * 1000) / 10,
        source: "openfoodfacts" as const,
        product_name: product.product_name || undefined,
        brand: product.brands || undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const foodName = body.food as string;

  if (!foodName || typeof foodName !== "string") {
    return NextResponse.json({ error: "Missing food name" }, { status: 400 });
  }

  if (foodName.length > 200) {
    return NextResponse.json({ error: "Food name too long" }, { status: 400 });
  }

  // Try comprehensive internal database first (250+ foods with raw/cooked variants)
  const dbResults = searchFoodDatabase(foodName);
  if (dbResults.length > 0) {
    const match = dbResults[0];
    return NextResponse.json({
      calories: match.calories,
      protein: match.protein,
      carbs: match.carbs,
      fat: match.fat,
      fiber: match.fiber,
      sugar: match.sugar,
      saturated_fat: match.saturated_fat,
      sodium: match.sodium,
      source: "database",
      product_name: match.name,
      category: match.category,
    });
  }

  // Try Open Food Facts API (Australian products)
  const offResult = await searchOpenFoodFacts(foodName);
  if (offResult) {
    return NextResponse.json(offResult);
  }

  return NextResponse.json(
    { error: "Food not found. Try adding 'raw' or 'cooked' (e.g. 'chicken breast cooked')." },
    { status: 404 }
  );
}
