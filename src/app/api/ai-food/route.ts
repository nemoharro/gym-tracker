import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const body = await request.json();
  const description = body.description as string;

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "Missing food description" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY." }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a nutrition expert. The user describes what they ate. Break it down into individual food items with estimated nutrition per item.

User said: "${description}"

Respond ONLY with valid JSON in this exact format, no other text, no markdown code blocks:
{
  "foods": [
    {
      "name": "descriptive name including portion (e.g. 'Avocado — half, medium' or 'Wholemeal bread — 2 slices')",
      "quantity_g": weight in grams,
      "calories": total calories for that quantity,
      "protein": grams of protein,
      "carbs": grams of carbs,
      "fat": grams of fat,
      "fiber": grams of fiber
    }
  ]
}

CRITICAL RULES:
- The "name" field MUST describe the portion clearly so the user can verify it. Include the quantity description AND the size. Examples:
  - "Avocado — half, medium (~85g)" NOT just "Avocado"
  - "Wholemeal bread — 2 slices (~90g)" NOT just "Bread"
  - "Chicken breast — 1 medium, cooked (~165g)" NOT just "Chicken breast"
  - "Basmati rice — 1 cup cooked (~185g)" NOT just "Rice"
  - "Full cream milk — 250ml (~258g)" NOT just "Milk"
- Include the approximate gram weight in parentheses in the name so the user can sanity-check it
- Use ACCURATE Australian weights. A slice of sandwich bread is ~38-45g. A medium avocado is ~170g (half = ~85g). A cup of cooked rice is ~185g.
- For restaurant/takeaway meals, estimate generously — portions are usually larger than home-cooked
- Round macros to 1 decimal place, calories to whole numbers
- If they mention a specific quantity (e.g. "half", "2 slices", "200g"), honour that exactly
- If no quantity mentioned, use a standard Australian serve and describe it
- Include all components separately (e.g. rice served with curry = two items)`,
    });

    const text = response.text ?? "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    const foods = parsed.foods.map((f: any) => ({
      name: f.name || "Unknown",
      quantity_g: f.quantity_g || 100,
      calories: Math.round(f.calories || 0),
      protein: Math.round((f.protein || 0) * 10) / 10,
      carbs: Math.round((f.carbs || 0) * 10) / 10,
      fat: Math.round((f.fat || 0) * 10) / 10,
      fiber: Math.round((f.fiber || 0) * 10) / 10,
      sugar: 0,
      saturated_fat: 0,
      sodium: 0,
    }));

    const totalCalories = foods.reduce((sum: number, f: any) => sum + f.calories, 0);
    const totalProtein = foods.reduce((sum: number, f: any) => sum + f.protein, 0);
    const totalCarbs = foods.reduce((sum: number, f: any) => sum + f.carbs, 0);
    const totalFat = foods.reduce((sum: number, f: any) => sum + f.fat, 0);

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
  } catch (err: any) {
    console.error("AI food error:", err);
    return NextResponse.json(
      { error: err?.message || "AI request failed. Try again." },
      { status: 500 }
    );
  }
}
