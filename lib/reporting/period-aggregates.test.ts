import { describe, expect, it } from "vitest";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";
import {
  buildVendorPeriodRows,
  type BreakdownProject,
  type VendorPeriodSource,
} from "./period-aggregates";

function breakdown(
  projectId: string,
  projectName: string,
  overrides: Partial<BreakdownProject> = {},
): BreakdownProject {
  return {
    projectId,
    projectName,
    overallScore: 80,
    automationCoverageScore: 85,
    xrayAutomationRatioScore: 70,
    qualitativeScore: 80,
    prodDefectLeakageScore: 90,
    meetsCoverageTarget: true,
    ...overrides,
  };
}

function vendorFixture(partial: {
  id: string;
  name: string;
  scores: VendorPeriodSource["scores"];
  projects?: VendorPeriodSource["projects"];
}): VendorPeriodSource {
  return {
    id: partial.id,
    name: partial.name,
    scores: partial.scores,
    projects: partial.projects ?? [],
  };
}

describe("buildVendorPeriodRows", () => {
  it("returns an empty list when no quarters are selected", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [{ quarter: "2026-Q2", overallScore: 90, scoreBreakdown: { projects: [] } }],
      }),
    ];

    expect(buildVendorPeriodRows(vendors, [])).toEqual([]);
  });

  it("excludes vendors with no scores in the selected quarters", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [{ quarter: "2026-Q1", overallScore: 90, scoreBreakdown: { projects: [] } }],
      }),
    ];

    expect(buildVendorPeriodRows(vendors, ["2026-Q2"])).toEqual([]);
  });

  it("averages vendor overall scores across multiple quarters", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [
          {
            quarter: "2026-Q1",
            overallScore: 80,
            scoreBreakdown: { projects: [breakdown("p1", "Checkout", { overallScore: 80 })] },
          },
          {
            quarter: "2026-Q2",
            overallScore: 90,
            scoreBreakdown: { projects: [breakdown("p1", "Checkout", { overallScore: 90 })] },
          },
        ],
        projects: [
          {
            id: "p1",
            name: "Checkout",
            metrics: [
              {
                automationCoverage: 82,
                manualTests: 20,
                automatedTests: 80,
                prodDefectsLeaked: 1,
              },
              {
                automationCoverage: 88,
                manualTests: 10,
                automatedTests: 90,
                prodDefectsLeaked: 0,
              },
            ],
            ratings: [
              { responsiveness: 4, availability: 4, complexityUnderstanding: 4 },
              { responsiveness: 5, availability: 5, complexityUnderstanding: 5 },
            ],
          },
        ],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q1", "2026-Q2"]);

    expect(rows).toHaveLength(1);
    expect(rows[0].overallScore).toBe(85);
    expect(rows[0].scoreBreakdownProjects[0].overallScore).toBe(85);
    expect(rows[0].projects[0].coverage).toBe(85);
    expect(rows[0].projects[0].xrayRatio).toBe(85);
    expect(rows[0].projects[0].responsiveness).toBe(5);
    expect(rows[0].projects[0].hasMetric).toBe(true);
    expect(rows[0].projects[0].hasRating).toBe(true);
    expect(rows[0].ratedCount).toBe(1);
  });

  it("ranks vendors by overall score descending", () => {
    const vendors = [
      vendorFixture({
        id: "low",
        name: "Nimbus",
        scores: [{ quarter: "2026-Q2", overallScore: 70, scoreBreakdown: { projects: [] } }],
      }),
      vendorFixture({
        id: "high",
        name: "Harbor",
        scores: [{ quarter: "2026-Q2", overallScore: 92, scoreBreakdown: { projects: [] } }],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q2"]);

    expect(rows.map((row) => row.vendorId)).toEqual(["high", "low"]);
  });

  it("marks coverage target using greater-than 80 boundary", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [
          {
            quarter: "2026-Q2",
            overallScore: 75,
            scoreBreakdown: {
              projects: [
                breakdown("at", "At Target", {
                  automationCoverageScore: AUTOMATION_COVERAGE_TARGET,
                  meetsCoverageTarget: false,
                }),
                breakdown("above", "Above Target", {
                  automationCoverageScore: AUTOMATION_COVERAGE_TARGET + 1,
                  meetsCoverageTarget: true,
                }),
              ],
            },
          },
        ],
        projects: [
          {
            id: "at",
            name: "At Target",
            metrics: [
              {
                automationCoverage: AUTOMATION_COVERAGE_TARGET,
                manualTests: 10,
                automatedTests: 40,
                prodDefectsLeaked: 2,
              },
            ],
            ratings: [{ responsiveness: 3, availability: 3, complexityUnderstanding: 3 }],
          },
          {
            id: "above",
            name: "Above Target",
            metrics: [
              {
                automationCoverage: AUTOMATION_COVERAGE_TARGET + 1,
                manualTests: 10,
                automatedTests: 40,
                prodDefectsLeaked: 1,
              },
            ],
            ratings: [{ responsiveness: 4, availability: 4, complexityUnderstanding: 4 }],
          },
        ],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q2"]);
    const at = rows[0].projects.find((project) => project.projectId === "at");
    const above = rows[0].projects.find((project) => project.projectId === "above");
    const atBreakdown = rows[0].scoreBreakdownProjects.find((project) => project.projectId === "at");
    const aboveBreakdown = rows[0].scoreBreakdownProjects.find(
      (project) => project.projectId === "above",
    );

    expect(at?.meetsCoverageTarget).toBe(false);
    expect(above?.meetsCoverageTarget).toBe(true);
    expect(atBreakdown?.meetsCoverageTarget).toBe(false);
    expect(aboveBreakdown?.meetsCoverageTarget).toBe(true);
    expect(rows[0].pctMeetingTarget).toBe(50);
  });

  it("treats projects with no metrics as unrated with zero coverage", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [
          {
            quarter: "2026-Q2",
            overallScore: 88,
            scoreBreakdown: {
              projects: [breakdown("rated", "Rated Project", { overallScore: 88 })],
            },
          },
        ],
        projects: [
          {
            id: "rated",
            name: "Rated Project",
            metrics: [
              {
                automationCoverage: 90,
                manualTests: 5,
                automatedTests: 45,
                prodDefectsLeaked: 0,
              },
            ],
            ratings: [{ responsiveness: 5, availability: 4, complexityUnderstanding: 5 }],
          },
          {
            id: "unrated",
            name: "Unrated Project",
            metrics: [],
            ratings: [],
          },
        ],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q2"]);
    const unrated = rows[0].projects.find((project) => project.projectId === "unrated");

    expect(unrated).toMatchObject({
      coverage: 0,
      score: 0,
      hasMetric: false,
      hasRating: false,
      meetsCoverageTarget: false,
    });
    expect(rows[0].ratedCount).toBe(1);
    expect(rows[0].projectCount).toBe(2);
    // Current behavior: unrated projects pull average coverage down.
    expect(rows[0].avgCoverage).toBe(45);
    expect(rows[0].pctMeetingTarget).toBe(50);
  });

  it("averages factor scores across projects in the period breakdown", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [
          {
            quarter: "2026-Q2",
            overallScore: 80,
            scoreBreakdown: {
              projects: [
                breakdown("p1", "One", {
                  automationCoverageScore: 80,
                  xrayAutomationRatioScore: 60,
                  qualitativeScore: 70,
                  prodDefectLeakageScore: 100,
                }),
                breakdown("p2", "Two", {
                  automationCoverageScore: 90,
                  xrayAutomationRatioScore: 80,
                  qualitativeScore: 90,
                  prodDefectLeakageScore: 80,
                }),
              ],
            },
          },
        ],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q2"]);

    expect(rows[0].factorAverages).toEqual({
      coverage: 85,
      xray: 70,
      qualitative: 80,
      defects: 90,
    });
  });

  it("ignores score rows outside the selected quarter list when averaging", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [
          {
            quarter: "2025-Q4",
            overallScore: 50,
            scoreBreakdown: { projects: [breakdown("p1", "Checkout", { overallScore: 50 })] },
          },
          {
            quarter: "2026-Q1",
            overallScore: 80,
            scoreBreakdown: { projects: [breakdown("p1", "Checkout", { overallScore: 80 })] },
          },
          {
            quarter: "2026-Q2",
            overallScore: 100,
            scoreBreakdown: { projects: [breakdown("p1", "Checkout", { overallScore: 100 })] },
          },
        ],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q1", "2026-Q2"]);

    expect(rows[0].overallScore).toBe(90);
    expect(rows[0].scoreBreakdownProjects[0].overallScore).toBe(90);
  });

  it("handles zero automated and manual tests as a zero xray ratio", () => {
    const vendors = [
      vendorFixture({
        id: "v1",
        name: "Apex",
        scores: [
          {
            quarter: "2026-Q2",
            overallScore: 60,
            scoreBreakdown: { projects: [breakdown("p1", "Empty Tests")] },
          },
        ],
        projects: [
          {
            id: "p1",
            name: "Empty Tests",
            metrics: [
              {
                automationCoverage: 70,
                manualTests: 0,
                automatedTests: 0,
                prodDefectsLeaked: 3,
              },
            ],
            ratings: [{ responsiveness: 3, availability: 3, complexityUnderstanding: 3 }],
          },
        ],
      }),
    ];

    const rows = buildVendorPeriodRows(vendors, ["2026-Q2"]);

    expect(rows[0].projects[0].xrayRatio).toBe(0);
    expect(rows[0].projects[0].defects).toBe(3);
  });
});
