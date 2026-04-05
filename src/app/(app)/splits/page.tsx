"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronRight, Plus, X } from "lucide-react";
import Link from "next/link";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRESET_DAYS = [
  "Push", "Pull", "Legs", "Upper Body", "Lower Body", "Full Body",
  "Chest", "Back", "Shoulders", "Arms", "Chest & Triceps", "Back & Biceps",
];

interface SplitDay {
  id: number;
  name: string;
  day_order: number;
  split_id: number;
}

interface ScheduleEntry {
  day_of_week: number;
  split_day_id: number | null;
  is_rest_day: boolean;
}

export default function SplitsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [splitDays, setSplitDays] = useState<SplitDay[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  // We use a single "My Split" to hold all day types
  const [splitId, setSplitId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get or create the user's split
    let { data: splits } = await supabase
      .from("workout_splits")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    let sid: number;
    if (!splits || splits.length === 0) {
      const { data: newSplit } = await supabase
        .from("workout_splits")
        .insert({ user_id: user.id, name: "My Split" })
        .select("id")
        .single();
      if (!newSplit) { setLoading(false); return; }
      sid = newSplit.id;
    } else {
      sid = splits[0].id;
    }
    setSplitId(sid);

    // Get all split days
    const { data: days } = await supabase
      .from("split_days")
      .select("*")
      .eq("split_id", sid)
      .order("day_order", { ascending: true });

    setSplitDays(days ?? []);

    // Get schedule
    const { data: sched } = await supabase
      .from("split_schedule")
      .select("day_of_week, split_day_id, is_rest_day")
      .eq("user_id", user.id)
      .order("day_of_week", { ascending: true });

    setSchedule(sched ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getScheduleForDay(dow: number): ScheduleEntry | undefined {
    return schedule.find((s) => s.day_of_week === dow);
  }

  function getDayName(dow: number): string {
    const sched = getScheduleForDay(dow);
    if (!sched || (!sched.split_day_id && !sched.is_rest_day)) return "Not set";
    if (sched.is_rest_day) return "Rest Day";
    const day = splitDays.find((d) => d.id === sched.split_day_id);
    return day?.name ?? "Not set";
  }

  async function assignDay(dayOfWeek: number, splitDayId: number | null, isRest: boolean) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: existing } = await supabase
      .from("split_schedule")
      .select("id")
      .eq("user_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      day_of_week: dayOfWeek,
      split_day_id: splitDayId,
      is_rest_day: isRest,
    };

    if (existing) {
      await supabase.from("split_schedule").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("split_schedule").insert(payload);
    }

    setEditingDay(null);
    setSaving(false);
    fetchData();
  }

  async function createAndAssignDay(dayOfWeek: number, name: string) {
    if (!splitId || !name.trim()) return;
    setSaving(true);

    // Check if this day type already exists
    let existingDay = splitDays.find((d) => d.name.toLowerCase() === name.trim().toLowerCase());

    if (!existingDay) {
      const { data: newDay } = await supabase
        .from("split_days")
        .insert({
          split_id: splitId,
          name: name.trim(),
          day_order: splitDays.length,
        })
        .select("*")
        .single();

      if (newDay) {
        existingDay = newDay;
      }
    }

    if (existingDay) {
      await assignDay(dayOfWeek, existingDay.id, false);
    }

    setCustomName("");
    setSaving(false);
  }

  // Available day types = preset options + already created custom days
  const existingNames = new Set(splitDays.map((d) => d.name));
  const allOptions = [...new Set([...PRESET_DAYS, ...splitDays.map((d) => d.name)])];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Weekly Schedule</h1>
      <p className="text-sm text-muted">Tap a day to assign a workout type.</p>

      <div className="space-y-2">
        {DAY_NAMES.map((dayName, i) => {
          const assigned = getDayName(i);
          const isRest = getScheduleForDay(i)?.is_rest_day;
          const isEditing = editingDay === i;

          return (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Day header — tap to edit */}
              <button
                onClick={() => setEditingDay(isEditing ? null : i)}
                className="w-full flex items-center justify-between p-4"
              >
                <div>
                  <span className="font-semibold text-sm">{dayName}</span>
                  <span className={`ml-3 text-sm ${isRest ? "text-muted" : assigned === "Not set" ? "text-muted" : "text-primary font-medium"}`}>
                    {assigned}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted transition-transform ${isEditing ? "rotate-90" : ""}`} />
              </button>

              {/* Edit panel */}
              {isEditing && (
                <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                  {/* Preset/existing options */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => assignDay(i, null, true)}
                      disabled={saving}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isRest ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                    >
                      Rest Day
                    </button>
                    {allOptions.map((option) => {
                      const matchingDay = splitDays.find((d) => d.name === option);
                      const isActive = matchingDay && getScheduleForDay(i)?.split_day_id === matchingDay.id;
                      return (
                        <button
                          key={option}
                          onClick={() => createAndAssignDay(i, option)}
                          disabled={saving}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom name */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Custom day name..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => createAndAssignDay(i, customName)}
                      disabled={saving || !customName.trim()}
                      className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Clear assignment */}
                  <button
                    onClick={() => assignDay(i, null, false)}
                    disabled={saving}
                    className="text-xs text-muted hover:text-destructive transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary of unique day types */}
      {splitDays.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">Your workout types</h2>
          <div className="flex flex-wrap gap-2">
            {splitDays.map((day) => {
              const usedOn = schedule
                .filter((s) => s.split_day_id === day.id)
                .map((s) => DAY_SHORT[s.day_of_week]);
              return (
                <div key={day.id} className="px-3 py-2 bg-card border border-border rounded-lg">
                  <p className="text-sm font-medium">{day.name}</p>
                  {usedOn.length > 0 && (
                    <p className="text-xs text-muted">{usedOn.join(", ")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
