import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Context {
  remainingMacros: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages as Message[];
  const context = body.context as Context | undefined;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY." }, { status: 500 });
  }

  const remaining = context?.remainingMacros;
  const targets = context?.targets;

  const systemPrompt = `You are a friendly, practical nutrition coach inside a gym tracker app. You help users with:

1. **Estimating what they ate** — "I had a butter chicken from Uber Eats" → estimate calories and macros for a typical restaurant serve
2. **Planning meals to hit macros** — "I have 800 cal left, got beef and rice" → calculate exact portions
3. **Meal suggestions** — "I've got chicken, broccoli and cheese, what should I make?" → suggest meals with macro breakdowns
4. **General nutrition advice** — quick, practical answers

${remaining ? `
THE USER'S REMAINING MACROS FOR TODAY:
- Calories: ${Math.round(remaining.calories)} kcal remaining
- Protein: ${Math.round(remaining.protein)}g remaining
- Carbs: ${Math.round(remaining.carbs)}g remaining
- Fat: ${Math.round(remaining.fat)}g remaining
${targets ? `(Daily targets: ${targets.calories} cal, ${targets.protein}g P, ${targets.carbs}g C, ${targets.fat}g F)` : ""}
` : "The user hasn't set up nutrition targets yet."}

RULES:
- Keep responses SHORT and practical. No essays.
- Use Australian nutrition data and serving sizes.
- When you suggest or estimate a specific meal with food items and quantities, you MUST include a structured block so the app can parse it. Format it EXACTLY like this:

<foods>
[
  { "name": "Chicken breast cooked", "quantity_g": 200, "calories": 330, "protein": 62, "carbs": 0, "fat": 7.2, "fiber": 0 },
  { "name": "Basmati rice cooked", "quantity_g": 185, "calories": 240, "protein": 5, "carbs": 52, "fat": 0.6, "fiber": 0.7 }
]
</foods>

- The <foods> block lets the user add it directly to their food log with one tap.
- Include the <foods> block ANY time you mention specific foods with specific quantities — whether estimating what they ate, suggesting a meal, or calculating portions.
- Outside the <foods> block, add a brief human-readable summary.
- Round macros to 1 decimal, calories to whole numbers.
- If the user asks something non-food related, politely redirect to nutrition.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build conversation for Gemini
    const conversationParts = messages.map(m =>
      `${m.role === "user" ? "User" : "Coach"}: ${m.content}`
    ).join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\nCONVERSATION:\n${conversationParts}\n\nCoach:`,
    });

    const text = response.text ?? "";

    return NextResponse.json({ response: text });
  } catch (err: any) {
    console.error("Nutrition coach error:", err);
    return NextResponse.json(
      { error: err?.message || "AI request failed. Try again." },
      { status: 500 }
    );
  }
}
