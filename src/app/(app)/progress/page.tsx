"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMuscleGroupProgress } from "@/hooks/useMuscleGroupProgress";
import { useExercises } from "@/hooks/useExercises";
import { useProgressData } from "@/hooks/useProgressData";
import { MuscleGroupChart } from "@/components/MuscleGroupChart";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { ProgressChart } from "@/components/ProgressChart";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

      {/* Exercise Weight Progress */}
      <ExerciseProgressSection />
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

function ExerciseProgressSection() {
  const { exercises, loading: exercisesLoading, search, setSearch } = useExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: progressData, loading: progressLoading } = useProgressData(selectedExerciseId);

  return (
    <div className="mt-4 space-y-3">
      <h2 className="text-base font-semibold">Search Weight Progress</h2>

      {/* Exercise search */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setDropdownOpen(!dropdownOpen); if (!dropdownOpen) setSearch(""); }}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left flex items-center justify-between"
        >
          <span className={selectedName ? "text-foreground" : "text-muted"}>
            {selectedName || "Search for an exercise..."}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", dropdownOpen && "rotate-180")} />
        </button>

        {dropdownOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full bg-secondary rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {exercisesLoading ? (
                <div className="p-4 text-center text-muted text-sm">Loading...</div>
              ) : exercises.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">No exercises found</div>
              ) : (
                exercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setSelectedExerciseId(ex.id);
                      setSelectedName(ex.name);
                      setDropdownOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors",
                      ex.id === selectedExerciseId ? "text-primary" : "text-foreground"
                    )}
                  >
                    <span>{ex.name}</span>
                    <span className="text-xs text-muted ml-2">{ex.muscle_group}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {selectedExerciseId && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted mb-3">{selectedName} — Max Weight</h3>
          <ProgressChart exerciseId={selectedExerciseId} metric="maxWeight" />

          {/* Last 2 sessions comparison */}
          {!progressLoading && progressData.length >= 2 && (() => {
            const prev = progressData[progressData.length - 2];
            const curr = progressData[progressData.length - 1];
            const diff = curr.maxWeight - prev.maxWeight;
            const pct = prev.maxWeight !== 0 ? (diff / prev.maxWeight) * 100 : 0;

            return (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted mb-2">Last 2 Sessions</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-muted">{prev.date}</p>
                      <p className="text-base font-semibold">{prev.maxWeight}kg</p>
                    </div>
                    <span className="text-muted">→</span>
                    <div>
                      <p className="text-xs text-muted">{curr.date}</p>
                      <p className="text-base font-semibold">{curr.maxWeight}kg</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-1", diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted")}>
                    {diff > 0 ? <TrendingUp className="h-4 w-4" /> : diff < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)}kg ({diff > 0 ? "+" : ""}{pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
