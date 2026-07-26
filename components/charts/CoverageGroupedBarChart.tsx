"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";

type CoverageGroupedBarChartProps = {
  data: { name: string; avgCoverage: number; pctMeetingTarget: number }[];
};

export function CoverageGroupedBarChart({ data }: CoverageGroupedBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No coverage data for this quarter.</p>;
  }

  return (
    <div className="h-72 w-full" data-testid="coverage-grouped-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,33,43,0.12)" />
          <XAxis dataKey="name" tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, ""]} />
          <Legend />
          <ReferenceLine
            y={AUTOMATION_COVERAGE_TARGET}
            stroke="#b23a2f"
            strokeDasharray="4 4"
            label={{ value: `${AUTOMATION_COVERAGE_TARGET}% target`, fill: "#b23a2f", fontSize: 11 }}
          />
          <Bar dataKey="avgCoverage" name="Avg coverage %" fill="#0f6a6a" radius={[6, 6, 0, 0]} />
          <Bar
            dataKey="pctMeetingTarget"
            name="% projects above target"
            fill="#2f7d4a"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
