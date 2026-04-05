"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MacroSummary } from "@/components/MacroSummary";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import Link from "next/link";
import { Dumbbell, UtensilsCrossed, Flame, ChevronRight, Loader2, Scale, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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

const DAY_LABELS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  // Weekly training
  const [weekSessionDates, setWeekSessionDates] = useState<Set<number>>(new Set());
  const [scheduledDayCount, setScheduledDayCount] = useState(0);

  // Weight
  const [weightData, setWeightData] = useState<Array<{ date: string; weight: number }>>([]);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);

  // Food
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [nutritionTargets, setNutritionTargets] = useState<{ calories: number; protein: number; carbs: number; fat: number; fiber: number } | null>(null);

  // Streak
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakDays, setStreakDays] = useState<boolean[]>([]);
  const [streakDayLabels, setStreakDayLabels] = useState<string[]>([]);

  // Today's workout
  const { todaysWorkout } = useTodaysWorkout();

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
      profileRes,
      weekSessionsRes,
      scheduleRes,
      weightRes,
      foodTodayRes,
      targetsRes,
      streakWeightRes,
      streakFoodRes,
      streakWorkoutRes,
    ] = await Promise.all([
      // Profile
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      // Week sessions
      supabase.from("workout_sessions").select("started_at").eq("user_id", user.id)
        .gte("started_at", monday.toISOString())
        .lte("started_at", new Date(sunday.getTime() + 86400000).toISOString()),
      // Schedule
      supabase.from("split_schedule").select("day_of_week, is_rest_day").eq("user_id", user.id),
      // Weight (14 days)
      supabase.from("body_weight_logs").select("logged_at, weight_kg").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(fourteenDaysAgo)).order("logged_at", { ascending: true }),
      // Today's food (only finalized entries count)
      supabase.from("food_log").select("calories, protein, carbs, fat, fiber").eq("user_id", user.id)
        .eq("logged_at", todayStr).eq("status", "finalized"),
      // Nutrition targets
      supabase.from("nutrition_targets").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
      // Streak: weight last 7 days
      supabase.from("body_weight_logs").select("logged_at").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(sevenDaysAgo)),
      // Streak: food last 7 days (only finalized)
      supabase.from("food_log").select("logged_at").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(sevenDaysAgo)).eq("status", "finalized"),
      // Streak: workouts last 7 days
      supabase.from("workout_sessions").select("started_at").eq("user_id", user.id)
        .gte("started_at", sevenDaysAgo.toISOString()),
    ]);

    // Profile
    if (profileRes.data) {
      setDisplayName(profileRes.data.display_name || "");
    }

    // Week sessions — figure out which day-of-week (Mon=0..Sun=6) had sessions
    const sessionDays = new Set<number>();
    if (weekSessionsRes.data) {
      for (const s of weekSessionsRes.data) {
        const d = new Date(s.started_at);
        const dow = d.getDay();
        // Convert JS day (0=Sun) to Mon=0..Sun=6
        sessionDays.add(dow === 0 ? 6 : dow - 1);
      }
    }
    setWeekSessionDates(sessionDays);

    // Scheduled days count
    if (scheduleRes.data) {
      setScheduledDayCount(scheduleRes.data.filter(s => !s.is_rest_day && s.day_of_week !== undefined).length);
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

    // Today's macros
    if (foodTodayRes.data && foodTodayRes.data.length > 0) {
      const totals = foodTodayRes.data.reduce((acc: { calories: number; protein: number; carbs: number; fat: number; fiber: number }, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
        fiber: acc.fiber + (Number(e.fiber ?? 0) || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
      setTodayMacros(totals);
    }

    // Nutrition targets
    if (targetsRes.data) {
      setNutritionTargets({
        calories: Number(targetsRes.data.calories),
        protein: Number(targetsRes.data.protein_g),
        carbs: Number(targetsRes.data.carbs_g),
        fat: Number(targetsRes.data.fat_g),
        fiber: Number(targetsRes.data.fiber_g) || 30,
      });
    }

    // Streak calculation
    const weightDates = new Set(streakWeightRes.data?.map(w => w.logged_at) ?? []);
    const foodDates = new Set(streakFoodRes.data?.map(f => f.logged_at) ?? []);
    const workoutDates = new Set(
      streakWorkoutRes.data?.map(w => new Date(w.started_at).toISOString().split("T")[0]) ?? []
    );

    const days: boolean[] = [];
    const labels: string[] = [];
    const dayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = getDaysAgo(i);
      const ds = formatDateISO(d);
      const hasAll = weightDates.has(ds) && foodDates.has(ds) && workoutDates.has(ds);
      days.push(hasAll);
      labels.push(dayAbbrevs[d.getDay()]);
    }
    setStreakDays(days);
    setStreakDayLabels(labels);

    // Current streak — consecutive complete days from today backward
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i]) streak++;
      else break;
    }
    setCurrentStreak(streak);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div className="p-4 space-y-4">
      {/* Greeting + Streak */}
      <div>
        <h1 className="text-xl font-bold">{greeting}{displayName ? `, ${displayName}` : ""}</h1>
        {currentStreak > 0 && (
          <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-orange-500">{currentStreak} day streak</span>
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/workout"
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl p-4 font-medium active:opacity-80 transition-opacity"
        >
          <Dumbbell className="h-5 w-5" />
          Start Workout
        </Link>
        <Link
          href="/food"
          className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 font-medium active:opacity-80 transition-opacity"
        >
          <UtensilsCrossed className="h-5 w-5" />
          Log Food
        </Link>
      </div>

      {/* This Week */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">This Week</h2>
          <span className="text-sm text-muted">
            {weekSessionDates.size}{scheduledDayCount > 0 ? `/${scheduledDayCount}` : ""} sessions
          </span>
        </div>
        <div className="flex justify-around">
          {DAY_LABELS_SHORT.map((label, i) => {
            const hasSession = weekSessionDates.has(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    hasSession
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted"
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Nutrition */}
      {(todayMacros.calories > 0 || nutritionTargets) && (
        <MacroSummary
          calories={todayMacros.calories}
          protein={todayMacros.protein}
          carbs={todayMacros.carbs}
          fat={todayMacros.fat}
          fiber={todayMacros.fiber}
          targets={nutritionTargets}
        />
      )}

      {/* Weight Trend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium flex items-center gap-1.5">
            <Scale className="h-4 w-4 text-muted" />
            Weight Trend
          </h2>
          {todayWeight && (
            <span className="text-sm font-medium">{todayWeight.toFixed(1)} kg</span>
          )}
        </div>
        {weightData.length > 1 ? (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value) => [`${Number(value).toFixed(1)} kg`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : weightData.length === 1 ? (
          <p className="text-sm text-muted">{weightData[0].weight.toFixed(1)} kg - log more days to see a trend</p>
        ) : (
          <Link href="/weight" className="text-sm text-primary">Log your first weigh-in</Link>
        )}
      </div>

      {/* Daily Streak */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Daily Streak</h2>
          <span className="text-xs text-muted">weight + food + gym = streak</span>
        </div>
        <div className="flex justify-around">
          {streakDays.map((complete, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`text-xl ${complete ? "" : "opacity-30"}`}>
                {complete ? "\uD83D\uDD25" : "\u26AA"}
              </span>
              <span className="text-xs text-muted">{streakDayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Workout */}
      {todaysWorkout && todaysWorkout.exercises.length > 0 && (
        <Link href="/workout" className="block bg-card border border-border rounded-xl p-4 active:bg-secondary transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Dumbbell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Today's Workout</h2>
              </div>
              <p className="font-semibold">{todaysWorkout.splitDayName}</p>
              <p className="text-xs text-muted">
                {todaysWorkout.exercises.length} exercises &middot; {todaysWorkout.splitName}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </div>
        </Link>
      )}

      {/* Progress link */}
      <Link href="/progress" className="flex items-center justify-center gap-2 text-sm text-muted py-2 hover:text-foreground transition-colors">
        <TrendingUp className="h-4 w-4" />
        View Exercise Progress
      </Link>
    </div>
  );
}
