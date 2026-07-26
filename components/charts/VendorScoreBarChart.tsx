"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0f6a6a", "#0b4f52", "#2f7d4a", "#b23a2f", "#4a5d6a"];

type VendorScoreBarChartProps = {
  data: { name: string; score: number }[];
};

export function VendorScoreBarChart({ data }: VendorScoreBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No chart data for this quarter.</p>;
  }

  return (
    <div className="h-72 w-full" data-testid="vendor-rank-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,33,43,0.12)" />
          <XAxis dataKey="name" tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}`, "Overall score"]} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
