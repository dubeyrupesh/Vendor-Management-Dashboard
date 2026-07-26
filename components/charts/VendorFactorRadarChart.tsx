"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type VendorFactor = {
  vendor: string;
  coverage: number;
  xray: number;
  qualitative: number;
  defects: number;
};

type VendorFactorRadarChartProps = {
  data: VendorFactor[];
};

const SERIES = [
  { key: "coverage", color: "#0f6a6a" },
  { key: "xray", color: "#2f7d4a" },
  { key: "qualitative", color: "#b0893d" },
  { key: "defects", color: "#b23a2f" },
] as const;

export function VendorFactorRadarChart({ data }: VendorFactorRadarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">No factor data for this quarter.</p>;
  }

  // Recharts radar wants one row per axis; transform vendor factors into axis rows.
  const axes = [
    { axis: "Coverage", ...Object.fromEntries(data.map((d) => [d.vendor, d.coverage])) },
    { axis: "Xray auto", ...Object.fromEntries(data.map((d) => [d.vendor, d.xray])) },
    { axis: "Qualitative", ...Object.fromEntries(data.map((d) => [d.vendor, d.qualitative])) },
    { axis: "Defect control", ...Object.fromEntries(data.map((d) => [d.vendor, d.defects])) },
  ];

  return (
    <div className="h-80 w-full" data-testid="vendor-factor-radar">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={axes}>
          <PolarGrid stroke="rgba(20,33,43,0.18)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#4a5d6a", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#4a5d6a", fontSize: 10 }} />
          <Tooltip />
          <Legend />
          {data.map((vendor, index) => (
            <Radar
              key={vendor.vendor}
              name={vendor.vendor}
              dataKey={vendor.vendor}
              stroke={SERIES[index % SERIES.length].color}
              fill={SERIES[index % SERIES.length].color}
              fillOpacity={0.18}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
