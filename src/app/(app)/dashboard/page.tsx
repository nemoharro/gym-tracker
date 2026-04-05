"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Dumbbell, UtensilsCrossed, Flame, Loader2, Scale } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

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
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
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
      // Streak: workouts last 7 days
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

    // Streak: weight + food + gym (gym only if split scheduled for that day)
    const weightDates = new Set(streakWeightRes.data?.map(w => w.logged_at) ?? []);
    const foodDates = new Set(streakFoodRes.data?.map(f => f.logged_at) ?? []);
    const workoutDates = new Set(
      streakWorkoutRes.data?.map(w => new Date(w.started_at).toISOString().split("T")[0]) ?? []
    );

    // Build schedule map: day_of_week (0=Sun) -> is_rest_day
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
      const dow = d.getDay(); // 0=Sun

      const hasWeight = weightDates.has(ds);
      const hasFood = foodDates.has(ds);
      const hasGym = workoutDates.has(ds);

      // Gym required only if schedule has a non-rest entry for this day
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
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  const t = nutritionTargets ?? { calories: 2500, protein: 180, carbs: 250, fat: 80 };

  return (
    <div className="p-4 space-y-3">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/workout"
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl p-3 text-sm font-medium active:opacity-80"
        >
          <Dumbbell className="h-4 w-4" />
          Start Workout
        </Link>
        <Link
          href="/food"
          className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-3 text-sm font-medium active:opacity-80"
        >
          <UtensilsCrossed className="h-4 w-4" />
          Log Food
        </Link>
      </div>

      {/* Daily Streak */}
      <div className="bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">
              {currentStreak > 0 ? `${currentStreak} day streak` : "Start your streak"}
            </span>
          </div>
          <span className="text-xs text-muted">weight + food + gym</span>
        </div>
        <div className="flex justify-around">
          {streakDays.map((complete, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className={`text-base ${complete ? "" : "opacity-20"}`}>
                {complete ? "\uD83D\uDD25" : "\u26AA"}
              </span>
              <span className="text-[10px] text-muted">{streakDayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Nutrition */}
      <div className="bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Nutrition</span>
          <span className="text-xs text-muted">
            {Math.round(t.calories - todayMacros.calories)} kcal left
          </span>
        </div>
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted">Calories</span>
              <span>{Math.round(todayMacros.calories)} / {t.calories}</span>
            </div>
            <MiniBar value={todayMacros.calories} max={t.calories} color="bg-primary" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="flex justify-between text-[10px] text-muted mb-0.5">
                <span>Protein</span>
                <span>{Math.round(todayMacros.protein)}/{t.protein}g</span>
              </div>
              <MiniBar value={todayMacros.protein} max={t.protein} color="bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-muted mb-0.5">
                <span>Carbs</span>
                <span>{Math.round(todayMacros.carbs)}/{t.carbs}g</span>
              </div>
              <MiniBar value={todayMacros.carbs} max={t.carbs} color="bg-yellow-500" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-muted mb-0.5">
                <span>Fat</span>
                <span>{Math.round(todayMacros.fat)}/{t.fat}g</span>
              </div>
              <MiniBar value={todayMacros.fat} max={t.fat} color="bg-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* This Week + Weight Trend — side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* This Week */}
        <div className="bg-card border border-border rounded-xl px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">This Week</span>
            <span className="text-[10px] text-muted">
              {weekSessionDates.size}{scheduledDayCount > 0 ? `/${scheduledDayCount}` : ""}
            </span>
          </div>
          <div className="flex justify-around">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${
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
        <div className="bg-card border border-border rounded-xl px-3 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium flex items-center gap-1">
              <Scale className="h-3 w-3 text-muted" />
              Weight
            </span>
            {todayWeight && (
              <span className="text-xs font-medium">{todayWeight.toFixed(1)}kg</span>
            )}
          </div>
          {weightData.length > 1 ? (
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Link href="/weight" className="text-[10px] text-primary">Log weight</Link>
          )}
        </div>
      </div>
    </div>
  );
}
