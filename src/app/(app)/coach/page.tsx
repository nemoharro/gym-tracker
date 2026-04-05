"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send, Loader2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { toLocalDateStr } from "@/lib/dates";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  foods?: FoodItem[];
  logged?: boolean;
}

interface FoodItem {
  name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

function parseFoodsFromResponse(text: string): { cleanText: string; foods: FoodItem[] | null } {
  const match = text.match(/<foods>\s*([\s\S]*?)\s*<\/foods>/);
  if (!match) return { cleanText: text, foods: null };

  try {
    const foods = JSON.parse(match[1]) as FoodItem[];
    const cleanText = text.replace(/<foods>[\s\S]*?<\/foods>/, "").trim();
    return { cleanText, foods };
  } catch {
    return { cleanText: text, foods: null };
  }
}

export default function CoachPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingIndex, setLoggingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Macro context
  const [remaining, setRemaining] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const [targets, setTargets] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);

  const fetchContext = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = toLocalDateStr(new Date());

    const [foodRes, targetRes] = await Promise.all([
      supabase.from("food_log").select("calories, protein, carbs, fat").eq("user_id", user.id)
        .eq("logged_at", todayStr),
      supabase.from("nutrition_targets").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    let todayCal = 0, todayP = 0, todayC = 0, todayF = 0;
    if (foodRes.data) {
      for (const e of foodRes.data) {
        todayCal += Number(e.calories) || 0;
        todayP += Number(e.protein) || 0;
        todayC += Number(e.carbs) || 0;
        todayF += Number(e.fat) || 0;
      }
    }

    if (targetRes.data) {
      const t = {
        calories: Number(targetRes.data.calories),
        protein: Number(targetRes.data.protein_g),
        carbs: Number(targetRes.data.carbs_g),
        fat: Number(targetRes.data.fat_g),
      };
      setTargets(t);
      setRemaining({
        calories: Math.max(0, t.calories - todayCal),
        protein: Math.max(0, t.protein - todayP),
        carbs: Math.max(0, t.carbs - todayC),
        fat: Math.max(0, t.fat - todayF),
      });
    }
  }, [supabase]);

  useEffect(() => { fetchContext(); }, [fetchContext]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/nutrition-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: remaining && targets ? { remainingMacros: remaining, targets } : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const { cleanText, foods } = parseFoodsFromResponse(data.response);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: cleanText,
          foods: foods ?? undefined,
        };
        setMessages([...newMessages, assistantMsg]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.error || "Sorry, something went wrong. Try again." }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Failed to connect. Check your internet and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogFoods(messageIndex: number) {
    const msg = messages[messageIndex];
    if (!msg.foods || msg.logged) return;

    setLoggingIndex(messageIndex);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoggingIndex(null); return; }

    const todayStr = toLocalDateStr(new Date());

    for (const food of msg.foods) {
      // Save to personal foods DB
      let foodId: number | null = null;
      const { data: existing } = await supabase
        .from("foods")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", food.name)
        .maybeSingle();

      if (existing) {
        foodId = existing.id;
      } else {
        const per100 = food.quantity_g > 0 ? 100 / food.quantity_g : 1;
        const { data: saved } = await supabase.from("foods").insert({
          user_id: user.id,
          name: food.name,
          calories_per_100g: Math.round(food.calories * per100),
          protein_per_100g: Math.round(food.protein * per100 * 10) / 10,
          carbs_per_100g: Math.round(food.carbs * per100 * 10) / 10,
          fat_per_100g: Math.round(food.fat * per100 * 10) / 10,
          fiber_per_100g: Math.round(food.fiber * per100 * 10) / 10,
          is_verified: false,
        }).select("id").maybeSingle();
        if (saved) foodId = saved.id;
      }

      // Log to food_log
      await supabase.from("food_log").insert({
        user_id: user.id,
        logged_at: todayStr,
        meal_type: "general",
        food_id: foodId,
        quantity_g: food.quantity_g,
        servings: 1,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        status: "draft",
      });
    }

    // Mark as logged
    setMessages(prev => prev.map((m, i) => i === messageIndex ? { ...m, logged: true } : m));
    setLoggingIndex(null);
    fetchContext(); // refresh remaining macros
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Link href="/food" className="text-muted hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Nutrition Coach
          </h1>
          {remaining && (
            <p className="text-xs text-muted">
              {Math.round(remaining.calories)} cal &middot; {Math.round(remaining.protein)}g P &middot; {Math.round(remaining.carbs)}g C &middot; {Math.round(remaining.fat)}g F remaining
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="h-8 w-8 text-primary mx-auto opacity-50" />
            <p className="text-sm text-muted">Ask me anything about nutrition</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "I just had a chicken pad thai",
                "What can I make with beef and rice?",
                "I need a high protein lunch under 500 cal",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 bg-card border border-border rounded-full text-xs text-muted hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Food card */}
              {msg.foods && msg.foods.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {msg.foods.map((food, fi) => (
                    <div key={fi} className="px-3 py-2 bg-secondary/50 rounded-lg text-sm">
                      <p className="font-medium">{food.name} — {food.quantity_g}g</p>
                      <p className="text-xs text-muted">
                        {food.calories} kcal &middot; P:{food.protein}g &middot; C:{food.carbs}g &middot; F:{food.fat}g
                      </p>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-primary/10 rounded-lg text-sm font-medium">
                    Total: {msg.foods.reduce((s, f) => s + f.calories, 0)} kcal &middot;
                    P:{Math.round(msg.foods.reduce((s, f) => s + f.protein, 0))}g &middot;
                    C:{Math.round(msg.foods.reduce((s, f) => s + f.carbs, 0))}g &middot;
                    F:{Math.round(msg.foods.reduce((s, f) => s + f.fat, 0))}g
                  </div>
                  {msg.logged ? (
                    <p className="text-xs text-green-500 font-medium text-center py-1">Added to food log</p>
                  ) : (
                    <button
                      onClick={() => handleLogFoods(i)}
                      disabled={loggingIndex === i}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {loggingIndex === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      {loggingIndex === i ? "Adding..." : "Add to Food Log"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What did you eat, or what should you make?"
            className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
