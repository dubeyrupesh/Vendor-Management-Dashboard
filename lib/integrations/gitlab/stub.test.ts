import { describe, expect, it } from "vitest";
import { StubGitLabSource } from "./stub";

describe("StubGitLabSource", () => {
  const source = new StubGitLabSource();

  it("returns deterministic coverage that varies by quarter", async () => {
    const a = await source.getAutomationCoverage("apex-checkout", "2026-Q2");
    const b = await source.getAutomationCoverage("apex-checkout", "2026-Q2");
    const c = await source.getAutomationCoverage("apex-checkout", "2025-Q3");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(55);
    expect(a).toBeLessThanOrEqual(100);
    expect(c).not.toBe(a);
  });

  it("returns a non-negative defect count", async () => {
    const defects = await source.getProdDefectCount("apex-checkout", "2026-Q2");
    expect(defects).toBeGreaterThanOrEqual(0);
  });
});
