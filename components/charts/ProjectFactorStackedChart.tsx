"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProjectFactorStackedChartProps = {
  data: {
    name: string;
    coverage: number;
    xray: number;
    qualitative: number;
    defects: number;
  }[];
};

/** Expects weighted factor contributions that sum to the project overall score. */
export function ProjectFactorStackedChart({ data }: ProjectFactorStackedChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No factor breakdown for this quarter.</p>;
  }

  return (
    <div className="h-80 w-full" data-testid="project-factor-stacked-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,33,43,0.12)" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-28}
            textAnchor="end"
            height={60}
            tick={{ fill: "#4a5d6a", fontSize: 11 }}
          />
          <YAxis domain={[0, 100]} tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => [`${Number(value).toFixed(1)} pts`, String(name)]}
          />
          <Legend />
          <Bar dataKey="coverage" stackId="a" name="Coverage (35%)" fill="#0f6a6a" />
          <Bar dataKey="xray" stackId="a" name="Xray (20%)" fill="#2f7d4a" />
          <Bar dataKey="qualitative" stackId="a" name="Qualitative (30%)" fill="#b0893d" />
          <Bar
            dataKey="defects"
            stackId="a"
            name="Defect control (15%)"
            fill="#b23a2f"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
