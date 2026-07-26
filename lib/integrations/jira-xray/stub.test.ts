import { describe, expect, it } from "vitest";
import { StubJiraXraySource } from "./stub";

describe("StubJiraXraySource", () => {
  const source = new StubJiraXraySource();

  it("returns deterministic manual and automated counts that vary by quarter", async () => {
    const a = await source.getXrayTestCounts("nimbus-claims", "2026-Q2");
    const b = await source.getXrayTestCounts("nimbus-claims", "2026-Q2");
    const c = await source.getXrayTestCounts("nimbus-claims", "2025-Q4");
    expect(a).toEqual(b);
    expect(a.manual).toBeGreaterThan(0);
    expect(a.automated).toBeGreaterThan(0);
    expect(c).not.toEqual(a);
  });
});
