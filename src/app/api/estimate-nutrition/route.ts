import { NextResponse } from "next/server";

interface NutritionResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturated_fat: number;
  sodium: number;
  source: "database" | "openfoodfacts";
  product_name?: string;
  brand?: string;
}

// Common foods nutrition per 100g (fallback database)
const FOOD_DB: Record<string, Omit<NutritionResult, "source" | "product_name" | "brand">> = {
  "white rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, saturated_fat: 0.1, sodium: 1 },
  "brown rice": { calories: 112, protein: 2.3, carbs: 24, fat: 0.8, fiber: 1.8, sugar: 0.4, saturated_fat: 0.2, sodium: 1 },
  "basmati rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, saturated_fat: 0.1, sodium: 1 },
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, saturated_fat: 1, sodium: 74 },
  "chicken thigh": { calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0, sugar: 0, saturated_fat: 3, sodium: 84 },
  "beef mince": { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0, saturated_fat: 6, sodium: 66 },
  "lean beef mince": { calories: 176, protein: 26, carbs: 0, fat: 8, fiber: 0, sugar: 0, saturated_fat: 3.5, sodium: 66 },
  "beef steak": { calories: 271, protein: 26, carbs: 0, fat: 18, fiber: 0, sugar: 0, saturated_fat: 7, sodium: 57 },
  "salmon": { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, saturated_fat: 3.1, sodium: 59 },
  "tuna": { calories: 132, protein: 29, carbs: 0, fat: 1.3, fiber: 0, sugar: 0, saturated_fat: 0.4, sodium: 47 },
  "eggs": { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, saturated_fat: 3.3, sodium: 124 },
  "egg whites": { calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, sugar: 0.7, saturated_fat: 0, sodium: 166 },
  "whole milk": { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 4.8, saturated_fat: 1.9, sodium: 44 },
  "skim milk": { calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, sugar: 5, saturated_fat: 0.1, sodium: 42 },
  "greek yogurt": { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, saturated_fat: 0.1, sodium: 36 },
  "oats": { calories: 389, protein: 17, carbs: 66, fat: 6.9, fiber: 10.6, sugar: 0, saturated_fat: 1.2, sodium: 2 },
  "pasta": { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.6, saturated_fat: 0.2, sodium: 1 },
  "bread": { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5, saturated_fat: 0.7, sodium: 491 },
  "potato": { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8, saturated_fat: 0, sodium: 6 },
  "sweet potato": { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, saturated_fat: 0, sodium: 55 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, saturated_fat: 0.1, sodium: 1 },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, saturated_fat: 0, sodium: 1 },
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, saturated_fat: 0.1, sodium: 33 },
  "spinach": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, saturated_fat: 0.1, sodium: 79 },
  "avocado": { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7, sugar: 0.7, saturated_fat: 2.1, sodium: 7 },
  "olive oil": { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, saturated_fat: 14, sodium: 2 },
  "peanut butter": { calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, saturated_fat: 10, sodium: 459 },
  "almonds": { calories: 579, protein: 21, carbs: 22, fat: 49, fiber: 12.5, sugar: 4.4, saturated_fat: 3.7, sodium: 1 },
  "black beans": { calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, sugar: 0.3, saturated_fat: 0.1, sodium: 1 },
  "kidney beans": { calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4, sugar: 2, saturated_fat: 0.1, sodium: 2 },
  "lentils": { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sugar: 1.8, saturated_fat: 0.1, sodium: 2 },
  "chickpeas": { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, sugar: 4.8, saturated_fat: 0.3, sodium: 7 },
  "corn": { calories: 86, protein: 3.3, carbs: 19, fat: 1.2, fiber: 2.7, sugar: 3.2, saturated_fat: 0.2, sodium: 15 },
  "pasta sauce": { calories: 50, protein: 1.5, carbs: 8, fat: 1.5, fiber: 1.5, sugar: 5, saturated_fat: 0.2, sodium: 400 },
  "cheddar cheese": { calories: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sugar: 0.5, saturated_fat: 21, sodium: 621 },
  "mozzarella": { calories: 280, protein: 28, carbs: 3.1, fat: 17, fiber: 0, sugar: 1, saturated_fat: 11, sodium: 627 },
  "cottage cheese": { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7, saturated_fat: 1.7, sodium: 364 },
  "whey protein": { calories: 400, protein: 80, carbs: 10, fat: 5, fiber: 0, sugar: 5, saturated_fat: 2, sodium: 200 },
  "protein bar": { calories: 350, protein: 20, carbs: 40, fat: 12, fiber: 3, sugar: 20, saturated_fat: 5, sodium: 200 },
  "honey": { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, sugar: 82, saturated_fat: 0, sodium: 4 },
  "butter": { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sugar: 0.1, saturated_fat: 51, sodium: 11 },
};

function findMatch(query: string): (Omit<NutritionResult, "source" | "product_name" | "brand">) | null {
  const q = query.toLowerCase().trim();
  if (FOOD_DB[q]) return FOOD_DB[q];
  for (const [key, val] of Object.entries(FOOD_DB)) {
    if (q.includes(key) || key.includes(q)) return val;
  }
  return null;
}

async function searchOpenFoodFacts(query: string): Promise<NutritionResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&countries_tags_en=australia&fields=product_name,brands,nutriments&page_size=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GymTracker/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.products || data.products.length === 0) return null;

    // Find the first product with valid nutrition data
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
        sodium: Math.round((n["sodium_100g"] || 0) * 1000) / 10, // convert g to mg
        source: "openfoodfacts",
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

  if (!foodName) {
    return NextResponse.json({ error: "Missing food name" }, { status: 400 });
  }

  // Try local database first
  const localMatch = findMatch(foodName);
  if (localMatch) {
    return NextResponse.json({ ...localMatch, source: "database" });
  }

  // Try Open Food Facts API (Australian products)
  const offResult = await searchOpenFoodFacts(foodName);
  if (offResult) {
    return NextResponse.json(offResult);
  }

  return NextResponse.json(
    { error: "Food not found. Try a more specific name or brand." },
    { status: 404 }
  );
}
