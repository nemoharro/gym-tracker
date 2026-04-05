"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Dumbbell, UtensilsCrossed, Flame, Loader2, Scale } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const QUOTES = [
  "Get the fuck up. Nobody's coming to save you.",
  "While you're hitting snooze, someone else is hitting PRs.",
  "Comfortable? Good. Now do something that scares you.",
  "You didn't wake up today to be mediocre.",
  "Discipline is choosing between what you want now and what you want most.",
  "Stop waiting for motivation. Get up and earn it.",
  "Your excuses are getting old. Your body's getting soft. Fix both.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Nobody cares about your potential. Show them results.",
  "You're not tired. You're uninspired. Fix your standards.",
  "Average effort gets average results. You're better than average.",
  "Every rep you skip is a rep someone else is doing.",
  "The only bad workout is the one that didn't happen.",
  "Your future self is watching. Don't let them down.",
  "Weak today, weaker tomorrow. Strong today, unstoppable tomorrow.",
  "Pain is temporary. Being out of shape is forever if you let it be.",
  "The grind doesn't care about your feelings. Show up anyway.",
  "Winners train. Losers complain. Pick your side.",
  "You want results? Then stop treating the gym like it's optional.",
  "If it doesn't challenge you, it doesn't change you.",
  "Be the hardest worker in every room you walk into.",
  "Money, muscle, mindset — build all three or stay broke in all three.",
  "You said 'tomorrow' yesterday. Today is the day.",
  "Comfort zones are where dreams go to die.",
  "The body achieves what the mind believes. Believe harder.",
  "Success isn't owned. It's rented. And rent is due every single day.",
  "Don't wish it were easier. Get fucking stronger.",
  "Sleep is earned. Go put in work first.",
  "Champions don't take days off from being champions.",
  "Excuses don't burn calories. Get moving.",
  "Your competition is training right now. Are you?",
  "Are you a fucking dog or a fucking puppy? Dogs eat. Puppies beg.",
  "Sore? Good. That means you actually did something yesterday.",
  "You're one workout away from a better mood. Stop being a little bitch about it.",
  "The iron doesn't lie. It doesn't care about your bad day. Lift it.",
  "Soft body, soft mind, soft life. Pick up the fucking weight.",
  "You want to look like a beast? Then stop training like a bitch.",
  "Rich people work while broke people sleep. Same goes for the gym.",
  "That voice telling you to quit? Tell it to shut the fuck up.",
  "Your muscles don't know excuses. They only know work.",
  "Get comfortable being uncomfortable or stay exactly where you are.",
  "You're not 'too busy.' You're just not hungry enough.",
  "Every day you skip is a day you chose to stay the same.",
  "Stop feeling sorry for yourself and start feeling the burn.",
  "The world doesn't owe you shit. Go earn everything you want.",
  "Cry in the gym or cry in the mirror. Your choice.",
  "You think this is hard? Try being weak for the rest of your life.",
  "Fuck your feelings. Train anyway.",
  "Your body is a reflection of your standards. Raise them.",
  "Nobody remembers the guy who quit. Be unforgettable.",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDailyQuote(): string {
  // Rotate based on day of year so it changes daily
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // Weekly training
  const [weekSessionDates, setWeekSessionDates] = useState<Set<number>>(new Set());
  const [scheduledDayCount, setScheduledDayCount] = useState(0);

  // Weight
  const [weightData, setWeightData] = useState<Array<{ date: string; weight: number }>>([]);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);

  // Food
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [nutritionTargets, setNutritionTargets] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);

  // Streak
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakDays, setStreakDays] = useState<boolean[]>([]);
  const [streakDayLabels, setStreakDayLabels] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const today = new Date();
    const todayStr = formatDateISO(today);
    const monday = getMondayOfWeek(today);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const fourteenDaysAgo = getDaysAgo(14);
    const sevenDaysAgo = getDaysAgo(7);

    const [
      weekSessionsRes,
      scheduleRes,
      weightRes,
      foodTodayRes,
      targetsRes,
      streakWeightRes,
      streakFoodRes,
      streakWorkoutRes,
    ] = await Promise.all([
      supabase.from("workout_sessions").select("started_at").eq("user_id", user.id)
        .gte("started_at", monday.toISOString())
        .lte("started_at", new Date(sunday.getTime() + 86400000).toISOString()),
      supabase.from("split_schedule").select("day_of_week, is_rest_day").eq("user_id", user.id),
      supabase.from("body_weight_logs").select("logged_at, weight_kg").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(fourteenDaysAgo)).order("logged_at", { ascending: true }),
      supabase.from("food_log").select("calories, protein, carbs, fat").eq("user_id", user.id)
        .eq("logged_at", todayStr).eq("status", "finalized"),
      supabase.from("nutrition_targets").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
      supabase.from("body_weight_logs").select("logged_at").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(sevenDaysAgo)).eq("status", "finalized"),
      supabase.from("food_log").select("logged_at").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(sevenDaysAgo)).eq("status", "finalized"),
      supabase.from("workout_sessions").select("started_at").eq("user_id", user.id)
        .gte("started_at", sevenDaysAgo.toISOString()),
    ]);

    // Week sessions
    const sessionDays = new Set<number>();
    if (weekSessionsRes.data) {
      for (const s of weekSessionsRes.data) {
        const dow = new Date(s.started_at).getDay();
        sessionDays.add(dow === 0 ? 6 : dow - 1);
      }
    }
    setWeekSessionDates(sessionDays);

    if (scheduleRes.data) {
      setScheduledDayCount(scheduleRes.data.filter(s => !s.is_rest_day).length);
    }

    // Weight
    if (weightRes.data) {
      setWeightData(weightRes.data.map(w => ({
        date: new Date(w.logged_at + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        weight: Number(w.weight_kg),
      })));
      const todayEntry = weightRes.data.find(w => w.logged_at === todayStr);
      setTodayWeight(todayEntry ? Number(todayEntry.weight_kg) : null);
    }

    // Food
    if (foodTodayRes.data && foodTodayRes.data.length > 0) {
      let cal = 0, pro = 0, carb = 0, f = 0;
      for (const e of foodTodayRes.data) {
        cal += Number(e.calories) || 0;
        pro += Number(e.protein) || 0;
        carb += Number(e.carbs) || 0;
        f += Number(e.fat) || 0;
      }
      setTodayMacros({ calories: cal, protein: pro, carbs: carb, fat: f });
    }

    if (targetsRes.data) {
      setNutritionTargets({
        calories: Number(targetsRes.data.calories),
        protein: Number(targetsRes.data.protein_g),
        carbs: Number(targetsRes.data.carbs_g),
        fat: Number(targetsRes.data.fat_g),
      });
    }

    // Streak
    const weightDates = new Set(streakWeightRes.data?.map(w => w.logged_at) ?? []);
    const foodDates = new Set(streakFoodRes.data?.map(f => f.logged_at) ?? []);
    const workoutDates = new Set(
      streakWorkoutRes.data?.map(w => new Date(w.started_at).toISOString().split("T")[0]) ?? []
    );

    const scheduleMap = new Map<number, boolean>();
    if (scheduleRes.data) {
      for (const s of scheduleRes.data) {
        scheduleMap.set(s.day_of_week, s.is_rest_day);
      }
    }

    const days: boolean[] = [];
    const labels: string[] = [];
    const abbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = getDaysAgo(i);
      const ds = formatDateISO(d);
      const dow = d.getDay();

      const hasWeight = weightDates.has(ds);
      const hasFood = foodDates.has(ds);
      const hasGym = workoutDates.has(ds);

      const schedEntry = scheduleMap.get(dow);
      const gymRequired = schedEntry !== undefined && !schedEntry;

      days.push(hasWeight && hasFood && (!gymRequired || hasGym));
      labels.push(abbrevs[dow]);
    }
    setStreakDays(days);
    setStreakDayLabels(labels);

    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i]) streak++;
      else break;
    }
    setCurrentStreak(streak);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  const t = nutritionTargets ?? { calories: 2500, protein: 180, carbs: 250, fat: 80 };

  return (
    <div className="p-5 space-y-5">
      {/* Greeting + Quote */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{getGreeting()}</h1>
        <p className="text-sm text-muted italic leading-relaxed">
          &ldquo;{getDailyQuote()}&rdquo;
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/workout"
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl p-4 text-sm font-semibold active:opacity-80"
        >
          <Dumbbell className="h-5 w-5" />
          Start Workout
        </Link>
        <Link
          href="/food"
          className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 text-sm font-semibold active:opacity-80"
        >
          <UtensilsCrossed className="h-5 w-5" />
          Log Food
        </Link>
      </div>

      {/* Daily Streak */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-semibold">
              {currentStreak > 0 ? `${currentStreak} day streak` : "Start your streak"}
            </span>
          </div>
          <span className="text-xs text-muted">weight + food + gym</span>
        </div>
        <div className="flex justify-around">
          {streakDays.map((complete, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`text-lg ${complete ? "" : "opacity-20"}`}>
                {complete ? "\uD83D\uDD25" : "\u26AA"}
              </span>
              <span className="text-xs text-muted">{streakDayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Nutrition</span>
          <span className="text-xs text-muted">
            {Math.round(t.calories - todayMacros.calories)} kcal left
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">Calories</span>
              <span className="font-medium">{Math.round(todayMacros.calories)} / {t.calories}</span>
            </div>
            <MiniBar value={todayMacros.calories} max={t.calories} color="bg-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Protein</span>
                <span>{Math.round(todayMacros.protein)}/{t.protein}g</span>
              </div>
              <MiniBar value={todayMacros.protein} max={t.protein} color="bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Carbs</span>
                <span>{Math.round(todayMacros.carbs)}/{t.carbs}g</span>
              </div>
              <MiniBar value={todayMacros.carbs} max={t.carbs} color="bg-yellow-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Fat</span>
                <span>{Math.round(todayMacros.fat)}/{t.fat}g</span>
              </div>
              <MiniBar value={todayMacros.fat} max={t.fat} color="bg-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* This Week + Weight Trend */}
      <div className="grid grid-cols-2 gap-3">
        {/* This Week */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">This Week</span>
            <span className="text-xs text-muted">
              {weekSessionDates.size}{scheduledDayCount > 0 ? `/${scheduledDayCount}` : ""}
            </span>
          </div>
          <div className="flex justify-around">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  weekSessionDates.has(i)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Weight Trend */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-muted" />
              Weight
            </span>
            {todayWeight && (
              <span className="text-sm font-semibold">{todayWeight.toFixed(1)}kg</span>
            )}
          </div>
          {weightData.length > 1 ? (
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Link href="/weight" className="text-xs text-primary font-medium">Log weight</Link>
          )}
        </div>
      </div>
    </div>
  );
}
