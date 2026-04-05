import { NextResponse } from "next/server";
import { searchFoodDatabase } from "@/lib/foodDatabase";

// Parse natural language food descriptions into structured food entries
// e.g. "I had chicken breast with rice and broccoli for lunch" -> multiple food items

interface ParsedFood {
  name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturated_fat: number;
  sodium: number;
}

// Common portion sizes for estimation
const PORTION_SIZES: Record<string, number> = {
  "chicken breast": 150,
  "chicken thigh": 120,
  "steak": 200,
  "beef steak": 200,
  "salmon": 150,
  "rice": 200, // cooked
  "pasta": 200, // cooked
  "bread": 60, // 2 slices
  "eggs": 50, // 1 egg
  "egg": 50,
  "banana": 120,
  "apple": 180,
  "avocado": 80, // half
  "broccoli": 100,
  "spinach": 50,
  "potato": 200,
  "sweet potato": 200,
  "milk": 250,
  "yogurt": 170,
  "cheese": 30,
  "butter": 10,
  "olive oil": 15,
  "peanut butter": 30,
  "oats": 50, // dry
  "protein": 30,
  "whey protein": 30,
};

function extractFoods(input: string): ParsedFood[] {
  const text = input.toLowerCase().trim();
  const results: ParsedFood[] = [];

  // Try to find quantity patterns like "200g of chicken" or "2 eggs"
  // Split on common separators
  const parts = text
    .replace(/\band\b/g, ",")
    .replace(/\bwith\b/g, ",")
    .replace(/\bplus\b/g, ",")
    .replace(/\balso\b/g, ",")
    .split(/[,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    let quantity_g: number | null = null;
    let foodQuery = part;

    // Extract quantity: "200g of chicken breast" or "200 grams chicken"
    const qtyMatch = part.match(/(\d+)\s*(?:g|grams?)\s*(?:of\s+)?(.+)/);
    if (qtyMatch) {
      quantity_g = parseInt(qtyMatch[1]);
      foodQuery = qtyMatch[2].trim();
    }

    // Extract count: "2 eggs" or "3 slices bread"
    const countMatch = part.match(/^(\d+)\s+(.+)/);
    if (!qtyMatch && countMatch) {
      const count = parseInt(countMatch[1]);
      foodQuery = countMatch[2].trim();
      // Look up default portion and multiply
      const portionKey = Object.keys(PORTION_SIZES).find(
        (k) => foodQuery.includes(k) || k.includes(foodQuery)
      );
      if (portionKey) {
        quantity_g = PORTION_SIZES[portionKey] * count;
      }
    }

    // Clean up filler words
    foodQuery = foodQuery
      .replace(/\b(i had|i ate|i've had|some|a|an|the|for lunch|for dinner|for breakfast|for snack|today|yesterday)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!foodQuery) continue;

    // Search internal database
    const dbResults = searchFoodDatabase(foodQuery);

    if (dbResults.length > 0) {
      const match = dbResults[0];

      // Use extracted quantity, or look up default portion, or default to 100g
      if (!quantity_g) {
        const portionKey = Object.keys(PORTION_SIZES).find(
          (k) => match.name.includes(k) || k.includes(match.name)
        );
        quantity_g = portionKey ? PORTION_SIZES[portionKey] : 100;
      }

      const mult = quantity_g / 100;
      results.push({
        name: match.name,
        quantity_g,
        calories: Math.round(match.calories * mult),
        protein: Math.round(match.protein * mult * 10) / 10,
        carbs: Math.round(match.carbs * mult * 10) / 10,
        fat: Math.round(match.fat * mult * 10) / 10,
        fiber: Math.round(match.fiber * mult * 10) / 10,
        sugar: Math.round(match.sugar * mult * 10) / 10,
        saturated_fat: Math.round(match.saturated_fat * mult * 10) / 10,
        sodium: Math.round(match.sodium * mult * 10) / 10,
      });
    }
  }

  return results;
}

export async function POST(request: Request) {
  const body = await request.json();
  const description = body.description as string;

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "Missing food description" }, { status: 400 });
  }

  const foods = extractFoods(description);

  if (foods.length === 0) {
    return NextResponse.json(
      { error: "Could not identify any foods. Try being more specific (e.g. 'chicken breast with rice and broccoli')." },
      { status: 404 }
    );
  }

  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFat = foods.reduce((sum, f) => sum + f.fat, 0);

  return NextResponse.json({
    foods,
    summary: {
      total_calories: totalCalories,
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      item_count: foods.length,
    },
  });
}
