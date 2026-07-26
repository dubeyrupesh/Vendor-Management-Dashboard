export type PeriodType = "quarterly" | "half-yearly" | "yearly";

export type PeriodSelection = {
  type: PeriodType;
  /** e.g. 2026-Q2 | 2026-H1 | 2026 */
  value: string;
};

const QUARTER_RE = /^(\d{4})-Q([1-4])$/;
const HALF_RE = /^(\d{4})-H([12])$/;
const YEAR_RE = /^(\d{4})$/;

export function parseQuarter(quarter: string): { year: number; quarter: number } | null {
  const match = QUARTER_RE.exec(quarter);
  if (!match) return null;
  return { year: Number(match[1]), quarter: Number(match[2]) };
}

export function quartersForHalfYear(value: string): string[] {
  const match = HALF_RE.exec(value);
  if (!match) return [];
  const year = match[1];
  return match[2] === "1" ? [`${year}-Q1`, `${year}-Q2`] : [`${year}-Q3`, `${year}-Q4`];
}

export function quartersForYear(value: string): string[] {
  if (!YEAR_RE.test(value)) return [];
  return [`${value}-Q1`, `${value}-Q2`, `${value}-Q3`, `${value}-Q4`];
}

export function resolvePeriod(selection: PeriodSelection): {
  label: string;
  quarters: string[];
} {
  if (selection.type === "quarterly") {
    const parsed = parseQuarter(selection.value);
    if (!parsed) return { label: selection.value, quarters: [] };
    return { label: selection.value, quarters: [selection.value] };
  }

  if (selection.type === "half-yearly") {
    const quarters = quartersForHalfYear(selection.value);
    return { label: selection.value, quarters };
  }

  const quarters = quartersForYear(selection.value);
  return { label: selection.value, quarters };
}

export function parsePeriodSearchParams(params: {
  periodType?: string;
  period?: string;
  quarter?: string;
}): PeriodSelection {
  // Backward compatible: ?quarter=2026-Q2
  if (!params.periodType && params.quarter && QUARTER_RE.test(params.quarter)) {
    return { type: "quarterly", value: params.quarter };
  }

  const type = (params.periodType as PeriodType | undefined) ?? "quarterly";
  if (type === "half-yearly" && params.period && HALF_RE.test(params.period)) {
    return { type, value: params.period };
  }
  if (type === "yearly" && params.period && YEAR_RE.test(params.period)) {
    return { type, value: params.period };
  }
  if (type === "quarterly" && params.period && QUARTER_RE.test(params.period)) {
    return { type, value: params.period };
  }

  return { type: "quarterly", value: "2026-Q2" };
}

export function buildPeriodOptions(availableQuarters: string[]) {
  const quarters = [...new Set(availableQuarters)].filter((q) => QUARTER_RE.test(q)).sort();
  const years = [...new Set(quarters.map((q) => parseQuarter(q)!.year))].sort();

  const halfYears = new Set<string>();
  for (const quarter of quarters) {
    const parsed = parseQuarter(quarter)!;
    halfYears.add(`${parsed.year}-H${parsed.quarter <= 2 ? 1 : 2}`);
  }

  return {
    quarterly: quarters,
    halfYearly: [...halfYears].sort(),
    yearly: years.map(String),
  };
}

export function periodQueryString(selection: PeriodSelection): string {
  return `periodType=${encodeURIComponent(selection.type)}&period=${encodeURIComponent(selection.value)}`;
}

export function averageNumbers(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}
