import { describe, expect, it } from "vitest";
import { StubJiraXraySource } from "./stub";

describe("StubJiraXraySource", () => {
  const source = new StubJiraXraySource();

  it("returns deterministic manual and automated counts", async () => {
    const a = await source.getXrayTestCounts("nimbus-claims", "2026-Q2");
    const b = await source.getXrayTestCounts("nimbus-claims", "2026-Q2");
    expect(a).toEqual(b);
    expect(a.manual).toBeGreaterThan(0);
    expect(a.automated).toBeGreaterThan(0);
  });
});
