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
      model: "gemini-2.0-flash",
      contents: `You are a nutrition expert. The user describes what they ate. Break it down into individual food items with estimated nutrition per item.

User said: "${description}"

Respond ONLY with valid JSON in this exact format, no other text, no markdown code blocks:
{
  "foods": [
    {
      "name": "food item name",
      "quantity_g": estimated weight in grams,
      "calories": total calories for that quantity,
      "protein": grams of protein,
      "carbs": grams of carbs,
      "fat": grams of fat,
      "fiber": grams of fiber
    }
  ]
}

Rules:
- Use realistic Australian serving sizes
- For meals like "pad thai" or "butter chicken", estimate the full dish as served
- Be specific with the food name (e.g. "pad thai with chicken" not just "pad thai")
- Round to 1 decimal place for macros, whole numbers for calories
- If they mention a quantity, use that. Otherwise estimate a standard serve
- Include all components (e.g. rice served with curry should be a separate item)`,
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
