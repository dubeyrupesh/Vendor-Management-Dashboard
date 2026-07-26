import { describe, expect, it } from "vitest";
import {
  buildPeriodOptions,
  parsePeriodSearchParams,
  quartersForHalfYear,
  quartersForYear,
  resolvePeriod,
} from "./periods";

describe("periods", () => {
  it("resolves quarterly half-yearly and yearly quarter lists", () => {
    expect(resolvePeriod({ type: "quarterly", value: "2026-Q2" }).quarters).toEqual(["2026-Q2"]);
    expect(quartersForHalfYear("2026-H1")).toEqual(["2026-Q1", "2026-Q2"]);
    expect(quartersForHalfYear("2025-H2")).toEqual(["2025-Q3", "2025-Q4"]);
    expect(quartersForYear("2026")).toEqual(["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]);
  });

  it("parses search params with quarter backward compatibility", () => {
    expect(parsePeriodSearchParams({ quarter: "2025-Q4" })).toEqual({
      type: "quarterly",
      value: "2025-Q4",
    });
    expect(parsePeriodSearchParams({ periodType: "half-yearly", period: "2026-H1" })).toEqual({
      type: "half-yearly",
      value: "2026-H1",
    });
    expect(parsePeriodSearchParams({ periodType: "yearly", period: "2025" })).toEqual({
      type: "yearly",
      value: "2025",
    });
  });

  it("builds available period options from seeded quarters", () => {
    const options = buildPeriodOptions(["2026-Q2", "2025-Q3", "2025-Q4", "2026-Q1"]);
    expect(options.quarterly).toEqual(["2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2"]);
    expect(options.halfYearly).toEqual(["2025-H2", "2026-H1"]);
    expect(options.yearly).toEqual(["2025", "2026"]);
  });
});
