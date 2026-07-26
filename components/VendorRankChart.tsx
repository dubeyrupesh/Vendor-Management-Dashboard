"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type VendorRankChartProps = {
  data: { name: string; score: number }[];
};

export function VendorRankChart({ data }: VendorRankChartProps) {
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
          <Tooltip />
          <Bar dataKey="score" fill="#0f6a6a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
