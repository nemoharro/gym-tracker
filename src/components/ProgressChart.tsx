"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useProgressData } from "@/hooks/useProgressData";

interface ProgressChartProps {
  exerciseId: number | null;
  metric: "maxWeight" | "totalVolume" | "estimatedOneRM";
}

export function ProgressChart({ exerciseId, metric }: ProgressChartProps) {
  const { data, loading } = useProgressData(exerciseId);

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center text-muted">
        Loading chart...
      </div>
    );
  if (data.length === 0)
    return (
      <div className="h-64 flex items-center justify-center text-muted">
        No data yet
      </div>
    );

  const labels = {
    maxWeight: "Max Weight (kg)",
    totalVolume: "Total Volume (kg)",
    estimatedOneRM: "Est. 1RM (kg)",
  };

  return (
    <div className="h-64">
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
          />
          <Line
            type="monotone"
            dataKey={metric}
            name={labels[metric]}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
