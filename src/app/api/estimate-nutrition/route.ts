import { NextResponse } from "next/server";

// Common foods nutrition per 100g (calories, protein, carbs, fat)
const FOOD_DB: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  "white rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "brown rice": { calories: 112, protein: 2.3, carbs: 24, fat: 0.8 },
  "basmati rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  "chicken thigh": { calories: 209, protein: 26, carbs: 0, fat: 10.9 },
  "beef mince": { calories: 250, protein: 26, carbs: 0, fat: 15 },
  "lean beef mince": { calories: 176, protein: 26, carbs: 0, fat: 8 },
  "beef steak": { calories: 271, protein: 26, carbs: 0, fat: 18 },
  "salmon": { calories: 208, protein: 20, carbs: 0, fat: 13 },
  "tuna": { calories: 132, protein: 29, carbs: 0, fat: 1.3 },
  "eggs": { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  "egg whites": { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  "whole milk": { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  "skim milk": { calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  "greek yogurt": { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  "oats": { calories: 389, protein: 17, carbs: 66, fat: 6.9 },
  "pasta": { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  "bread": { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  "potato": { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  "sweet potato": { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  "spinach": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  "avocado": { calories: 160, protein: 2, carbs: 9, fat: 15 },
  "olive oil": { calories: 884, protein: 0, carbs: 0, fat: 100 },
  "peanut butter": { calories: 588, protein: 25, carbs: 20, fat: 50 },
  "almonds": { calories: 579, protein: 21, carbs: 22, fat: 49 },
  "black beans": { calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  "kidney beans": { calories: 127, protein: 8.7, carbs: 23, fat: 0.5 },
  "lentils": { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  "chickpeas": { calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  "corn": { calories: 86, protein: 3.3, carbs: 19, fat: 1.2 },
  "pasta sauce": { calories: 50, protein: 1.5, carbs: 8, fat: 1.5 },
  "cheddar cheese": { calories: 403, protein: 25, carbs: 1.3, fat: 33 },
  "mozzarella": { calories: 280, protein: 28, carbs: 3.1, fat: 17 },
  "cottage cheese": { calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  "whey protein": { calories: 400, protein: 80, carbs: 10, fat: 5 },
  "protein bar": { calories: 350, protein: 20, carbs: 40, fat: 12 },
  "honey": { calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  "butter": { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
};

function findMatch(query: string): { calories: number; protein: number; carbs: number; fat: number } | null {
  const q = query.toLowerCase().trim();
  // Exact match
  if (FOOD_DB[q]) return FOOD_DB[q];
  // Partial match
  for (const [key, val] of Object.entries(FOOD_DB)) {
    if (q.includes(key) || key.includes(q)) return val;
  }
  return null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const foodName = body.food as string;

  if (!foodName) {
    return NextResponse.json({ error: "Missing food name" }, { status: 400 });
  }

  const match = findMatch(foodName);
  if (match) {
    return NextResponse.json({ ...match, source: "database" });
  }

  // TODO: Replace with Claude API call for unknown foods
  // For now return a placeholder indicating we don't know
  return NextResponse.json(
    { error: "Food not found in database. AI estimation coming soon." },
    { status: 404 }
  );
}
