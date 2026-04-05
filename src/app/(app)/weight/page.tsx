"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { Loader2, Minus, Plus, Scale } from "lucide-react";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function WeightPage() {
  const supabase = createClient();
  const [weight, setWeight] = useState(80.0);
  const [todayLog, setTodayLog] = useState<{ id: number; weight_kg: number } | null>(null);
  const [chartData, setChartData] = useState<Array<{ date: string; weight: number; movingAvg: number | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = formatDate(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all weight logs ordered by date
    const { data: logs } = await supabase
      .from("body_weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true });

    if (logs) {
      // Check if today is already logged
      const todayEntry = logs.find((l) => l.logged_at === today);
      if (todayEntry) {
        setTodayLog({ id: todayEntry.id, weight_kg: todayEntry.weight_kg });
        setWeight(todayEntry.weight_kg);
      } else if (logs.length > 0) {
        // Default to last logged weight
        setWeight(logs[logs.length - 1].weight_kg);
      }

      // Build chart data with 7-day moving average
      const data = logs.map((log, i) => {
        let movingAvg: number | null = null;
        if (i >= 6) {
          const window = logs.slice(i - 6, i + 1);
          movingAvg = Math.round((window.reduce((s, l) => s + l.weight_kg, 0) / 7) * 10) / 10;
        }
        return {
          date: new Date(log.logged_at + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
          weight: log.weight_kg,
          movingAvg,
        };
      });

      setChartData(data);
    }

    setLoading(false);
  }, [supabase, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function adjustWeight(delta: number) {
    setWeight((prev) => Math.round((prev + delta) * 10) / 10);
  }

  async function handleLog() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (todayLog) {
      // Update existing
      await supabase
        .from("body_weight_logs")
        .update({ weight_kg: weight })
        .eq("id", todayLog.id);
    } else {
      // Insert new
      await supabase.from("body_weight_logs").insert({
        user_id: user.id,
        weight_kg: weight,
        logged_at: today,
      });
    }

    setSaving(false);
    fetchData();
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Body Weight</h1>

      {/* Weight input */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => adjustWeight(-0.1)}
            className="p-3 rounded-full bg-secondary border border-border active:bg-background"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums">{weight.toFixed(1)}</p>
            <p className="text-sm text-muted mt-1">kg</p>
          </div>
          <button
            onClick={() => adjustWeight(0.1)}
            className="p-3 rounded-full bg-secondary border border-border active:bg-background"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {todayLog && (
          <p className="text-center text-xs text-muted">
            Logged today: {todayLog.weight_kg.toFixed(1)} kg
          </p>
        )}

        <button
          onClick={handleLog}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Scale className="h-5 w-5" />
          )}
          {todayLog ? "Update Today's Weight" : "Log Today's Weight"}
        </button>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h2 className="font-semibold">Weight Trend</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        ) : (
          <BodyWeightChart data={chartData} />
        )}
      </div>
    </div>
  );
}
