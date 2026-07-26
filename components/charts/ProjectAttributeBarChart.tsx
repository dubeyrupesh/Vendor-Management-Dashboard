"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ProjectAttributePoint = {
  name: string;
  value: number;
};

type ProjectAttributeBarChartProps = {
  data: ProjectAttributePoint[];
  testId: string;
  color?: string;
  domain?: [number, number];
  unit?: string;
  referenceValue?: number;
  referenceLabel?: string;
  /** When set, bars at/below this value use alertColor. */
  alertBelowOrEqual?: number;
  alertColor?: string;
};

export function ProjectAttributeBarChart({
  data,
  testId,
  color = "#0f6a6a",
  domain,
  unit = "",
  referenceValue,
  referenceLabel,
  alertBelowOrEqual,
  alertColor = "#b23a2f",
}: ProjectAttributeBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No project data for this attribute.</p>;
  }

  return (
    <div className="h-64 w-full" data-testid={testId}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,33,43,0.12)" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-24}
            textAnchor="end"
            height={50}
            tick={{ fill: "#4a5d6a", fontSize: 10 }}
          />
          <YAxis domain={domain} tick={{ fill: "#4a5d6a", fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toFixed(unit === "%" ? 1 : 0)}${unit}`,
              "Value",
            ]}
          />
          {typeof referenceValue === "number" ? (
            <ReferenceLine
              y={referenceValue}
              stroke={alertColor}
              strokeDasharray="4 4"
              label={
                referenceLabel
                  ? { value: referenceLabel, fill: alertColor, fontSize: 10 }
                  : undefined
              }
            />
          ) : null}
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => {
              const isAlert =
                typeof alertBelowOrEqual === "number" && entry.value <= alertBelowOrEqual;
              return <Cell key={entry.name} fill={isAlert ? alertColor : color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
