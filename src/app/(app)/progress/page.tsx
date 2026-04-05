"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useExercises } from "@/hooks/useExercises";
import { useProgressData } from "@/hooks/useProgressData";
import { ProgressChart } from "@/components/ProgressChart";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Search, ChevronDown } from "lucide-react";

type Metric = "maxWeight" | "totalVolume" | "estimatedOneRM";

const METRICS: { key: Metric; label: string }[] = [
  { key: "maxWeight", label: "Max Weight" },
  { key: "totalVolume", label: "Total Volume" },
  { key: "estimatedOneRM", label: "Est. 1RM" },
];

export default function ProgressPage() {
  const { exercises, loading: exercisesLoading, search, setSearch } = useExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>("maxWeight");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedExercise = useMemo(
    () => exercises.find((e) => e.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId]
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Progress</h1>

      {/* Exercise selector */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            if (!dropdownOpen) setSearch("");
          }}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left flex items-center justify-between"
        >
          <span className={selectedExercise ? "text-foreground" : "text-muted"}>
            {selectedExercise ? selectedExercise.name : "Select an exercise"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted transition-transform",
              dropdownOpen && "rotate-180"
            )}
          />
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
                <div className="p-4 text-center text-muted text-sm">
                  Loading...
                </div>
              ) : exercises.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">
                  No exercises found
                </div>
              ) : (
                exercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setSelectedExerciseId(ex.id);
                      setDropdownOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-secondary active:bg-secondary transition-colors",
                      ex.id === selectedExerciseId
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    <span>{ex.name}</span>
                    <span className="text-xs text-muted ml-2">
                      {ex.muscle_group}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metric toggle */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={cn(
              "flex-1 text-center py-2 px-2 rounded-lg text-xs font-medium transition-colors",
              metric === m.key
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <ProgressChart exerciseId={selectedExerciseId} metric={metric} />
      </div>

      {/* Progressive overload summary */}
      {selectedExerciseId && (
        <OverloadSummary exerciseId={selectedExerciseId} metric={metric} />
      )}
    </div>
  );
}

function OverloadSummary({
  exerciseId,
  metric,
}: {
  exerciseId: number;
  metric: Metric;
}) {
  const { data, loading } = useProgressData(exerciseId);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
    );
  }

  if (data.length < 2) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted text-center">
          Need at least 2 sessions to compare progress.
        </p>
      </div>
    );
  }

  const prev = data[data.length - 2];
  const curr = data[data.length - 1];

  const prevVal = prev[metric];
  const currVal = curr[metric];
  const diff = currVal - prevVal;
  const pctChange = prevVal !== 0 ? (diff / prevVal) * 100 : 0;

  const labels: Record<Metric, string> = {
    maxWeight: "Max Weight",
    totalVolume: "Total Volume",
    estimatedOneRM: "Est. 1RM",
  };

  const units: Record<Metric, string> = {
    maxWeight: "kg",
    totalVolume: "kg",
    estimatedOneRM: "kg",
  };

  let trendColor: string;
  let TrendIcon: typeof TrendingUp;
  let trendLabel: string;

  if (diff > 0) {
    trendColor = "text-success";
    TrendIcon = TrendingUp;
    trendLabel = `+${Math.abs(diff).toFixed(1)} ${units[metric]} (+${Math.abs(pctChange).toFixed(1)}%)`;
  } else if (diff < 0) {
    trendColor = "text-destructive";
    TrendIcon = TrendingDown;
    trendLabel = `-${Math.abs(diff).toFixed(1)} ${units[metric]} (-${Math.abs(pctChange).toFixed(1)}%)`;
  } else {
    trendColor = "text-warning";
    TrendIcon = Minus;
    trendLabel = "No change";
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-muted mb-3">
        Last 2 Sessions - {labels[metric]}
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-muted">{prev.date}</p>
            <p className="text-lg font-semibold text-foreground">
              {prevVal} {units[metric]}
            </p>
          </div>
          <span className="text-muted">→</span>
          <div>
            <p className="text-xs text-muted">{curr.date}</p>
            <p className="text-lg font-semibold text-foreground">
              {currVal} {units[metric]}
            </p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1", trendColor)}>
          <TrendIcon className="h-5 w-5" />
          <span className="text-sm font-medium">{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}
