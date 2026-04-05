"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMuscleGroupProgress } from "@/hooks/useMuscleGroupProgress";
import { MuscleGroupChart } from "@/components/MuscleGroupChart";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { cn } from "@/lib/utils";

type Tab = "overload" | "weight";

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overload");

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Progress</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("overload")}
          className={cn(
            "flex-1 text-center py-2 px-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "overload"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
          )}
        >
          Progressive Overload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("weight")}
          className={cn(
            "flex-1 text-center py-2 px-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "weight"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
          )}
        >
          Weight
        </button>
      </div>

      {activeTab === "overload" ? <OverloadSection /> : <WeightSection />}
    </div>
  );
}

function OverloadSection() {
  const { data, muscleGroups, loading } = useMuscleGroupProgress();

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="text-sm font-medium text-muted mb-3">
        Avg Strength by Muscle Group (Last 90 Days)
      </h2>
      {loading ? (
        <div className="h-72 flex items-center justify-center text-muted text-sm">
          Loading chart...
        </div>
      ) : (
        <MuscleGroupChart data={data} muscleGroups={muscleGroups} />
      )}
    </div>
  );
}

function WeightSection() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<
    Array<{ date: string; weight: number; movingAvg: number | null }>
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: logs } = await supabase
      .from("body_weight_logs")
      .select("weight_kg, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true });

    if (logs) {
      const data = logs.map((log, i) => {
        let movingAvg: number | null = null;
        if (i >= 6) {
          const window = logs.slice(i - 6, i + 1);
          movingAvg =
            Math.round(
              (window.reduce((s, l) => s + l.weight_kg, 0) / 7) * 10
            ) / 10;
        }
        return {
          date: new Date(log.logged_at + "T00:00:00").toLocaleDateString(
            "en-AU",
            { day: "numeric", month: "short" }
          ),
          weight: log.weight_kg,
          movingAvg,
        };
      });
      setChartData(data);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="text-sm font-medium text-muted mb-3">Body Weight</h2>
      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted text-sm">
          Loading chart...
        </div>
      ) : (
        <BodyWeightChart data={chartData} />
      )}
    </div>
  );
}
