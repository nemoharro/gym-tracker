"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Dumbbell, UtensilsCrossed, Flame, Loader2, Scale, Clock, TrendingUp, TrendingDown, Minus, Weight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const QUOTES = [
  "Get the fuck up. Nobody's coming to save you.",
  "Get in the fucking gym. Now. Not later. Now.",
  "Shut the fuck up and lift. Nobody asked how you feel.",
  "You look in the mirror and you're happy with that? Fucking embarrassing.",
  "Your excuses are getting old. Your body's getting soft. Fix both.",
  "Stop being a little bitch and go train.",
  "Skipping today? Cool. Stay fat and broke then.",
  "The bar doesn't give a fuck about your bad day. Get under it.",
  "You're built like an excuse. Change that.",
  "Fuck your feelings. Train anyway.",
  "Nobody cares about your potential. Show them fucking results.",
  "Sore? Good. That means you actually did something yesterday.",
  "Soft body, soft mind, soft life. Pick up the fucking weight.",
  "That voice telling you to quit? Tell it to shut the fuck up.",
  "You want to look like a beast? Then stop training like a bitch.",
  "Get your ass off the couch. You're not resting, you're rotting.",
  "Your ex is doing better than you right now. Get the fuck up.",
  "While you're hitting snooze, someone's hitting your girl's DMs. Get up.",
  "Three months from now you'll wish you started today. Or you'll still be a bitch about it.",
  "Money, muscle, mindset — build all three or stay broke in all three.",
  "Rest day? You've been resting your whole fucking life.",
  "You said 'tomorrow' yesterday. Shut up and go.",
  "Don't wish it were easier. Get fucking stronger.",
  "Winners train. Losers complain. Pick your fucking side.",
  "The gym doesn't need you. YOU need the gym. Act like it.",
  "You'd rather scroll your phone than change your life? Pathetic.",
  "Every missed session is you voting for the version of yourself you hate.",
  "Your bank account and your body have the same problem — you're lazy with both.",
  "That gut isn't a dad bod. It's a 'gave up' bod. Fix it.",
  "Imagine your worst enemy seeing you right now. Still want to skip?",
  "You're not tired. You're weak. There's a difference. Fix it.",
  "Get in there and fucking earn it or admit you don't want it.",
  "The iron doesn't care about your excuses. Neither does life. Lift.",
  "You're one workout away from not being a fucking disappointment.",
  "Stop waiting for motivation, you soft cunt. Discipline doesn't wait.",
  "Your competition is training right now. You're reading your phone.",
  "Rich people work while broke people sleep. Same goes for the gym.",
  "Eat clean. Train dirty. Stop being a fucking passenger in your own life.",
  "You didn't wake up today to be a fucking nobody. Move.",
  "Every rep you skip is a rep someone better than you is doing.",
  "You're not 'too busy.' You're too fucking soft. Admit it.",
  "Put the fucking fork down and pick the fucking barbell up.",
  "You want respect? You want a good body? Then fucking earn it.",
  "The world doesn't owe you shit. Go take what you want.",
  "You're not built different. You're built average. Now go change that.",
  "Weak today, weaker tomorrow. Get your shit together.",
  "Fucking move. Your legs work. Your arms work. Use them.",
  "Stop treating the gym like it's optional. It's not. Go.",
  "You think this is hard? Try being a weak piece of shit forever.",
  "Nobody remembers the one who quit. Get in and be fucking ruthless.",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDailyQuote(): string {
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

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // Profile
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Weekly training
  const [weekSessionDates, setWeekSessionDates] = useState<Set<number>>(new Set());
  const [scheduledDayCount, setScheduledDayCount] = useState(0);

  // Weight
  const [weightData, setWeightData] = useState<Array<{ date: string; weight: number }>>([]);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [weightChange, setWeightChange] = useState<number | null>(null);

  // Food
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [nutritionTargets, setNutritionTargets] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);

  // Streak
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakDays, setStreakDays] = useState<boolean[]>([]);
  const [streakDayLabels, setStreakDayLabels] = useState<string[]>([]);

  // Weekly stats
  const [weekVolume, setWeekVolume] = useState(0);
  const [weekSets, setWeekSets] = useState(0);
  const [weekTime, setWeekTime] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

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
    const thirtyDaysAgo = getDaysAgo(30);

    const [
      profileRes,
      weekSessionsRes,
      scheduleRes,
      weightRes,
      weight30Res,
      foodTodayRes,
      targetsRes,
      streakWeightRes,
      streakFoodRes,
      streakWorkoutRes,
      weekSetsRes,
      allSessionsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      supabase.from("workout_sessions").select("id, started_at, finished_at").eq("user_id", user.id)
        .gte("started_at", monday.toISOString())
        .lte("started_at", new Date(sunday.getTime() + 86400000).toISOString()),
      supabase.from("split_schedule").select("day_of_week, is_rest_day").eq("user_id", user.id),
      supabase.from("body_weight_logs").select("logged_at, weight_kg").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(fourteenDaysAgo)).order("logged_at", { ascending: true }),
      supabase.from("body_weight_logs").select("logged_at, weight_kg").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(thirtyDaysAgo)).order("logged_at", { ascending: true }),
      supabase.from("food_log").select("calories, protein, carbs, fat").eq("user_id", user.id)
        .eq("logged_at", todayStr).eq("status", "finalized"),
      supabase.from("nutrition_targets").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
      supabase.from("body_weight_logs").select("logged_at").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(sevenDaysAgo)).eq("status", "finalized"),
      supabase.from("food_log").select("logged_at").eq("user_id", user.id)
        .gte("logged_at", formatDateISO(sevenDaysAgo)).eq("status", "finalized"),
      supabase.from("workout_sessions").select("started_at").eq("user_id", user.id)
        .gte("started_at", sevenDaysAgo.toISOString()),
      supabase.from("workout_sets").select("session_id, weight_kg, reps"),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id),
    ]);

    // Profile
    if (profileRes.data?.display_name) {
      setDisplayName(profileRes.data.display_name);
    }

    // Week sessions
    const sessionDays = new Set<number>();
    let totalTime = 0;
    if (weekSessionsRes.data) {
      for (const s of weekSessionsRes.data) {
        const dow = new Date(s.started_at).getDay();
        sessionDays.add(dow === 0 ? 6 : dow - 1);
        if (s.finished_at) {
          totalTime += new Date(s.finished_at).getTime() - new Date(s.started_at).getTime();
        }
      }
    }
    setWeekSessionDates(sessionDays);
    setWeekTime(totalTime);

    if (scheduleRes.data) {
      setScheduledDayCount(scheduleRes.data.filter(s => !s.is_rest_day).length);
    }

    // Total sessions all time
    setTotalSessions(allSessionsRes.data?.length ?? 0);

    // Week volume and sets
    if (weekSessionsRes.data && weekSetsRes.data) {
      const weekSessionIds = new Set(weekSessionsRes.data.map(s => s.id));
      let vol = 0;
      let sets = 0;
      for (const set of weekSetsRes.data) {
        if (weekSessionIds.has(set.session_id)) {
          vol += Number(set.weight_kg) * Number(set.reps);
          sets++;
        }
      }
      setWeekVolume(Math.round(vol));
      setWeekSets(sets);
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

    // Weight change over 30 days
    if (weight30Res.data && weight30Res.data.length >= 2) {
      const first = Number(weight30Res.data[0].weight_kg);
      const last = Number(weight30Res.data[weight30Res.data.length - 1].weight_kg);
      setWeightChange(Math.round((last - first) * 10) / 10);
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
  const greeting = displayName ? `${getGreeting()}, ${displayName}` : getGreeting();

  return (
    <div className="p-5 space-y-5">
      {/* Greeting + Quote */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-sm text-muted italic leading-relaxed">
          &ldquo;{getDailyQuote()}&rdquo;
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/workout"
          className="flex items-center justify-center gap-2.5 bg-primary text-primary-foreground rounded-xl p-5 text-base font-semibold active:opacity-80"
        >
          <Dumbbell className="h-5 w-5" />
          Start Workout
        </Link>
        <Link
          href="/food"
          className="flex items-center justify-center gap-2.5 bg-card border border-border rounded-xl p-5 text-base font-semibold active:opacity-80"
        >
          <UtensilsCrossed className="h-5 w-5" />
          Log Food
        </Link>
      </div>

      {/* Daily Streak */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-base font-semibold">
              {currentStreak > 0 ? `${currentStreak} day streak` : "Start your streak"}
            </span>
          </div>
          <span className="text-xs text-muted">weight + food + gym</span>
        </div>
        <div className="flex justify-around">
          {streakDays.map((complete, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className={`text-xl ${complete ? "" : "opacity-20"}`}>
                {complete ? "\uD83D\uDD25" : "\u26AA"}
              </span>
              <span className="text-xs text-muted font-medium">{streakDayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Weight className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold">{weekVolume > 1000 ? `${(weekVolume / 1000).toFixed(1)}t` : `${weekVolume}kg`}</p>
          <p className="text-xs text-muted mt-0.5">Volume</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Dumbbell className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold">{weekSets}</p>
          <p className="text-xs text-muted mt-0.5">Sets</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold">{weekTime > 0 ? formatDuration(weekTime) : "—"}</p>
          <p className="text-xs text-muted mt-0.5">Gym Time</p>
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-semibold">Today&apos;s Nutrition</span>
          <span className="text-sm text-muted">
            {Math.round(t.calories - todayMacros.calories)} kcal left
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted">Calories</span>
              <span className="font-semibold">{Math.round(todayMacros.calories)} / {t.calories}</span>
            </div>
            <MiniBar value={todayMacros.calories} max={t.calories} color="bg-primary" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Protein</span>
                <span>{Math.round(todayMacros.protein)}/{t.protein}g</span>
              </div>
              <MiniBar value={todayMacros.protein} max={t.protein} color="bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Carbs</span>
                <span>{Math.round(todayMacros.carbs)}/{t.carbs}g</span>
              </div>
              <MiniBar value={todayMacros.carbs} max={t.carbs} color="bg-yellow-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
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
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">This Week</span>
            <span className="text-xs text-muted font-medium">
              {weekSessionDates.size}{scheduledDayCount > 0 ? `/${scheduledDayCount}` : ""}
            </span>
          </div>
          <div className="flex justify-around">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
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
              <span className="text-sm font-bold">{todayWeight.toFixed(1)}kg</span>
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
          {weightChange !== null && (
            <div className="flex items-center gap-1 mt-2">
              {weightChange < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-success" />
              ) : weightChange > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted" />
              )}
              <span className="text-xs text-muted">
                {weightChange > 0 ? "+" : ""}{weightChange}kg / 30d
              </span>
            </div>
          )}
        </div>
      </div>

      {/* All-time sessions */}
      {totalSessions > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-primary">{totalSessions}</p>
          <p className="text-sm text-muted mt-1">total sessions logged</p>
        </div>
      )}
    </div>
  );
}
