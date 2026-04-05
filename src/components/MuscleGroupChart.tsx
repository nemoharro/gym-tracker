"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MuscleGroupDataPoint } from "@/hooks/useMuscleGroupProgress";

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: "#ef4444",
  Back: "#3b82f6",
  Shoulders: "#f59e0b",
  Biceps: "#8b5cf6",
  Triceps: "#ec4899",
  Legs: "#22c55e",
  Abs: "#06b6d4",
  Glutes: "#f97316",
  Hamstrings: "#a3e635",
  Quads: "#14b8a6",
  Calves: "#d946ef",
  Forearms: "#64748b",
};

const FALLBACK_COLORS = [
  "#a78bfa",
  "#fb923c",
  "#34d399",
  "#fbbf24",
  "#c084fc",
  "#38bdf8",
];

function getColor(group: string, index: number): string {
  return (
    MUSCLE_GROUP_COLORS[group] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

interface MuscleGroupChartProps {
  data: MuscleGroupDataPoint[];
  muscleGroups: string[];
}

export function MuscleGroupChart({ data, muscleGroups }: MuscleGroupChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted">
        No workout data yet
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" stroke="#a1a1a1" fontSize={12} />
          <YAxis stroke="#a1a1a1" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
              color: "#ededed",
            }}
            labelStyle={{ color: "#a1a1a1" }}
            formatter={(value) => [`${Number(value).toFixed(1)} kg avg e1RM`]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {muscleGroups.map((group, i) => (
            <Line
              key={group}
              type="monotone"
              dataKey={group}
              name={group}
              stroke={getColor(group, i)}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
