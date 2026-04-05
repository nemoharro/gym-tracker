"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { Loader2, Minus, Plus, Scale, Check, CheckCircle, Pencil } from "lucide-react";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function WeightPage() {
  const supabase = createClient();
  const [weight, setWeight] = useState(80.0);
  const [todayLog, setTodayLog] = useState<{ id: number; weight_kg: number; status: string } | null>(null);
  const [chartData, setChartData] = useState<Array<{ date: string; weight: number; movingAvg: number | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const today = formatDate(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: logs } = await supabase
      .from("body_weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true });

    if (logs) {
      const todayEntry = logs.find((l) => l.logged_at === today);
      if (todayEntry) {
        setTodayLog({ id: todayEntry.id, weight_kg: todayEntry.weight_kg, status: todayEntry.status });
        setWeight(todayEntry.weight_kg);
      } else if (logs.length > 0) {
        setWeight(logs[logs.length - 1].weight_kg);
        setTodayLog(null);
      }

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
    setEditing(false);
  }, [supabase, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function adjustWeight(delta: number) {
    setWeight((prev) => Math.round((prev + delta) * 10) / 10);
  }

  // Save weight as draft
  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (todayLog) {
      const { error } = await supabase
        .from("body_weight_logs")
        .update({ weight_kg: weight, status: "draft" })
        .eq("id", todayLog.id);
      if (error) { alert("Failed to update weight."); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("body_weight_logs").insert({
        user_id: user.id,
        weight_kg: weight,
        logged_at: today,
        status: "draft",
      });
      if (error) { alert("Failed to log weight."); setSaving(false); return; }
    }

    setSaving(false);
    fetchData();
  }

  // Finalize today's weight
  async function handleFinalize() {
    if (!todayLog) return;
    setSaving(true);
    const { error } = await supabase
      .from("body_weight_logs")
      .update({ status: "finalized" })
      .eq("id", todayLog.id);
    if (error) { alert("Failed to finalize weight."); }
    setSaving(false);
    fetchData();
  }

  // Un-finalize (back to draft for editing)
  async function handleUnfinalize() {
    if (!todayLog) return;
    setSaving(true);
    const { error } = await supabase
      .from("body_weight_logs")
      .update({ status: "draft" })
      .eq("id", todayLog.id);
    if (error) { alert("Failed to edit weight."); }
    setSaving(false);
    setEditing(true);
    fetchData();
  }

  const isFinalized = todayLog?.status === "finalized";
  const isDraft = todayLog && !isFinalized;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Body Weight</h1>

      {/* Weight input */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => adjustWeight(-0.1)}
            disabled={isFinalized && !editing}
            className="p-3 rounded-full bg-secondary border border-border active:bg-background disabled:opacity-30"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums">{weight.toFixed(1)}</p>
            <p className="text-sm text-muted mt-1">kg</p>
          </div>
          <button
            onClick={() => adjustWeight(0.1)}
            disabled={isFinalized && !editing}
            className="p-3 rounded-full bg-secondary border border-border active:bg-background disabled:opacity-30"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Status + actions */}
        {isFinalized && !editing ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Submitted for today</span>
            </div>
            <button
              onClick={handleUnfinalize}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              Edit Weight
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {isDraft && (
              <p className="text-center text-xs text-muted">
                Draft: {todayLog.weight_kg.toFixed(1)} kg — submit when ready
              </p>
            )}

            {/* Save as draft */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Scale className="h-5 w-5" />
              )}
              {todayLog ? "Update Weight" : "Save Weight"}
            </button>

            {/* Submit / finalize */}
            {todayLog && (
              <button
                onClick={handleFinalize}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="h-5 w-5" />
                Submit for Today
              </button>
            )}
          </div>
        )}
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
