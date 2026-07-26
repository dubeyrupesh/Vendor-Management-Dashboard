"use client";

import { useMemo, useState } from "react";
import type { PeriodSelection, PeriodType } from "@/lib/periods";

type PeriodFilterProps = {
  selection: PeriodSelection;
  options: {
    quarterly: string[];
    halfYearly: string[];
    yearly: string[];
  };
  testId?: string;
};

function optionsForType(
  type: PeriodType,
  options: PeriodFilterProps["options"],
): string[] {
  if (type === "half-yearly") return options.halfYearly;
  if (type === "yearly") return options.yearly;
  return options.quarterly;
}

export function PeriodFilter({
  selection,
  options,
  testId = "period-filter",
}: PeriodFilterProps) {
  const [type, setType] = useState<PeriodType>(selection.type);
  const values = useMemo(() => optionsForType(type, options), [type, options]);
  const [period, setPeriod] = useState(() => {
    const initialValues = optionsForType(selection.type, options);
    return initialValues.includes(selection.value) ? selection.value : initialValues[0] ?? "";
  });

  return (
    <form className="mb-6 flex flex-wrap items-end gap-3" data-testid={testId} method="get">
      <label className="text-sm font-semibold">
        View
        <select
          name="periodType"
          value={type}
          onChange={(event) => {
            const nextType = event.target.value as PeriodType;
            const nextValues = optionsForType(nextType, options);
            setType(nextType);
            setPeriod(nextValues[nextValues.length - 1] ?? "");
          }}
          className="mt-1 block min-w-40 rounded-md border border-[var(--line)] bg-white px-3 py-2"
          data-testid="period-type-select"
        >
          <option value="quarterly">Quarterly</option>
          <option value="half-yearly">Half-yearly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>

      <label className="text-sm font-semibold">
        Period
        <select
          name="period"
          value={values.includes(period) ? period : values[0] ?? ""}
          onChange={(event) => setPeriod(event.target.value)}
          className="mt-1 block min-w-40 rounded-md border border-[var(--line)] bg-white px-3 py-2"
          data-testid="period-value-select"
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-md border border-[var(--line)] bg-white px-4 py-2 font-semibold"
        data-testid="period-apply"
      >
        Apply
      </button>
    </form>
  );
}
