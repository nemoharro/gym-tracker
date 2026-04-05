"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BodyWeightChartProps {
  data: Array<{ date: string; weight: number; movingAvg: number | null }>;
}

export function BodyWeightChart({ data }: BodyWeightChartProps) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted">No weight data yet</div>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" stroke="#a1a1a1" fontSize={12} />
          <YAxis stroke="#a1a1a1" fontSize={12} domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#ededed" }}
            labelStyle={{ color: "#a1a1a1" }}
          />
          <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
          <Line type="monotone" dataKey="movingAvg" name="7-day avg" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
