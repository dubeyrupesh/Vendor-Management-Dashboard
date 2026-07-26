import { describe, expect, it } from "vitest";
import {
  averageVendorScore,
  calculateProjectScore,
  scoreAutomationCoverage,
  scoreProdDefectLeakage,
  scoreQualitative,
  scoreXrayAutomationRatio,
} from "./calculate";
import { AUTOMATION_COVERAGE_TARGET } from "./weights";

describe("scoring helpers", () => {
  it("scores automation coverage as a clamped percentage", () => {
    expect(scoreAutomationCoverage(85)).toBe(85);
    expect(scoreAutomationCoverage(120)).toBe(100);
    expect(scoreAutomationCoverage(-5)).toBe(0);
  });

  it("returns 0 xray ratio when there are no tests", () => {
    expect(scoreXrayAutomationRatio(0, 0)).toBe(0);
  });

  it("scores xray automation ratio from automated vs total tests", () => {
    expect(scoreXrayAutomationRatio(25, 75)).toBe(75);
  });

  it("maps qualitative 1-5 ratings onto a 0-100 scale", () => {
    expect(scoreQualitative(5, 5, 5)).toBe(100);
    expect(scoreQualitative(1, 1, 1)).toBe(20);
  });

  it("gives full points for zero prod defects and zero at the cap", () => {
    expect(scoreProdDefectLeakage(0)).toBe(100);
    expect(scoreProdDefectLeakage(10)).toBe(0);
    expect(scoreProdDefectLeakage(5)).toBe(50);
  });

  it("flags projects that meet the greater-than-80 coverage target", () => {
    const below = calculateProjectScore({
      automationCoverage: AUTOMATION_COVERAGE_TARGET,
      manualTests: 20,
      automatedTests: 80,
      responsiveness: 4,
      availability: 4,
      complexityUnderstanding: 4,
      prodDefectsLeaked: 1,
    });
    const above = calculateProjectScore({
      automationCoverage: AUTOMATION_COVERAGE_TARGET + 1,
      manualTests: 20,
      automatedTests: 80,
      responsiveness: 4,
      availability: 4,
      complexityUnderstanding: 4,
      prodDefectsLeaked: 1,
    });

    expect(below.meetsCoverageTarget).toBe(false);
    expect(above.meetsCoverageTarget).toBe(true);
    expect(above.overallScore).toBeGreaterThan(0);
  });

  it("averages vendor project scores", () => {
    expect(averageVendorScore([])).toBe(0);
    expect(averageVendorScore([80, 90])).toBe(85);
  });
});
