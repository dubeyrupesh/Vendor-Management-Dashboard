"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";

type ProjectScoreBarChartProps = {
  data: { name: string; score: number; coverage: number }[];
};

export function ProjectScoreBarChart({ data }: ProjectScoreBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No project scores for this quarter.</p>;
  }

  return (
    <div className="h-80 w-full" data-testid="project-score-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,33,43,0.12)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: "#4a5d6a", fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const coverage = (item?.payload as { coverage?: number } | undefined)?.coverage;
              return [
                `${Number(value).toFixed(1)} (coverage ${coverage ?? "—"}%)`,
                "Project score",
              ];
            }}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.coverage > AUTOMATION_COVERAGE_TARGET ? "#0f6a6a" : "#b23a2f"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
