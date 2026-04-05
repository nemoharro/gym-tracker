type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface ParsedFoodInput {
  foodName: string;
  quantity: number | null;
  mealType: MealType | null;
}

export function parseFoodSpeech(transcript: string): ParsedFoodInput {
  let text = transcript.toLowerCase().trim();

  // Extract quantity (e.g. "200 grams", "200g", "150 g")
  let quantity: number | null = null;
  const qtyMatch = text.match(/(\d+)\s*(?:grams?|g\b)/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
    text = text.replace(qtyMatch[0], "");
  }

  // Extract meal type
  let mealType: MealType | null = null;
  const mealPatterns: { pattern: RegExp; type: MealType }[] = [
    { pattern: /\bbreakfast\b/, type: "breakfast" },
    { pattern: /\blunch\b/, type: "lunch" },
    { pattern: /\bdinner\b/, type: "dinner" },
    { pattern: /\bsnacks?\b/, type: "snack" },
  ];

  for (const { pattern, type } of mealPatterns) {
    if (pattern.test(text)) {
      mealType = type;
      text = text.replace(pattern, "");
      break;
    }
  }

  // Remove filler words and clean up
  text = text
    .replace(/\b(i had|i ate|i've had|i've eaten|i eat|add|log|for|of|about|around|some|a|an|the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    foodName: text,
    quantity,
    mealType,
  };
}
