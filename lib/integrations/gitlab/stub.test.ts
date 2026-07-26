import { describe, expect, it } from "vitest";
import { StubGitLabSource } from "./stub";

describe("StubGitLabSource", () => {
  const source = new StubGitLabSource();

  it("returns deterministic coverage between 60 and 100", async () => {
    const a = await source.getAutomationCoverage("apex-checkout", "2026-Q2");
    const b = await source.getAutomationCoverage("apex-checkout", "2026-Q2");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(60);
    expect(a).toBeLessThanOrEqual(100);
  });

  it("returns a non-negative defect count", async () => {
    const defects = await source.getProdDefectCount("apex-checkout", "2026-Q2");
    expect(defects).toBeGreaterThanOrEqual(0);
  });
});
