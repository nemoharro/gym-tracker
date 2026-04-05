import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const body = await request.json();
  const description = body.description as string;
  const remaining = body.remainingMacros as { calories: number; protein: number; carbs: number; fat: number } | undefined;

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "Missing food description" }, { status: 400 });
  }

  if (!remaining) {
    return NextResponse.json({ error: "Missing remaining macros" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY." }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a nutrition expert and macro calculator. The user needs to hit their remaining macros for the day with one meal.

REMAINING MACROS TO HIT:
- Calories: ${Math.round(remaining.calories)} kcal
- Protein: ${Math.round(remaining.protein)}g
- Carbs: ${Math.round(remaining.carbs)}g
- Fat: ${Math.round(remaining.fat)}g

THE USER WANTS TO EAT: "${description}"

INSTRUCTIONS:
1. Identify which foods are MANDATORY (fixed quantities — the user says "must have", "20g of", specific amounts). Keep these exact.
2. For FLEXIBLE foods (no fixed quantity), calculate the exact gram amounts so the TOTAL meal hits the remaining macros as closely as possible.
3. Prioritise hitting protein and calories. Carbs and fat can be within 10% margin.
4. Use realistic Australian nutrition data per 100g for calculations.
5. If it's mathematically impossible to hit all macros exactly, get as close as possible and explain why in the notes.

Respond ONLY with valid JSON, no markdown, no code blocks:
{
  "foods": [
    {
      "name": "food item name",
      "quantity_g": exact grams to eat,
      "calories": calories for that quantity,
      "protein": protein in grams,
      "carbs": carbs in grams,
      "fat": fat in grams,
      "fiber": fiber in grams,
      "fixed": true if mandatory/fixed quantity, false if calculated
    }
  ],
  "totals": {
    "calories": total calories,
    "protein": total protein,
    "carbs": total carbs,
    "fat": total fat
  },
  "notes": "brief explanation of the proportioning"
}`,
    });

    const text = response.text ?? "";
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
      quantity_g: Math.round(f.quantity_g || 100),
      calories: Math.round(f.calories || 0),
      protein: Math.round((f.protein || 0) * 10) / 10,
      carbs: Math.round((f.carbs || 0) * 10) / 10,
      fat: Math.round((f.fat || 0) * 10) / 10,
      fiber: Math.round((f.fiber || 0) * 10) / 10,
      sugar: 0,
      saturated_fat: 0,
      sodium: 0,
      fixed: !!f.fixed,
    }));

    return NextResponse.json({
      foods,
      totals: parsed.totals ?? {
        calories: foods.reduce((s: number, f: any) => s + f.calories, 0),
        protein: foods.reduce((s: number, f: any) => s + f.protein, 0),
        carbs: foods.reduce((s: number, f: any) => s + f.carbs, 0),
        fat: foods.reduce((s: number, f: any) => s + f.fat, 0),
      },
      notes: parsed.notes || "",
    });
  } catch (err: any) {
    console.error("AI macro fit error:", err);
    return NextResponse.json(
      { error: err?.message || "AI request failed. Try again." },
      { status: 500 }
    );
  }
}
