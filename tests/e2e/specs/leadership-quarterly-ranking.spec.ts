import { expect, test } from "../fixtures/auth.fixture";
import { LeadershipRankingPage } from "../pages/LeadershipRankingPage";

test.describe("Leadership Rankings", () => {
  test("shows vendor rank table and opens vendor detail", async ({ page, loginAsLeadership }) => {
    await loginAsLeadership();

    const ranking = new LeadershipRankingPage(page);
    await ranking.goto("quarterly", "2026-Q2");

    await expect(ranking.rankTable).toBeVisible();
    await expect(ranking.rankRows.first()).toBeVisible();
    await expect(ranking.chart).toBeVisible();
    await expect(page.getByTestId("coverage-grouped-chart")).toBeVisible();
    await expect(page.getByTestId("vendor-factor-radar")).toBeVisible();
    await expect(page.getByTestId("period-summary")).toContainText("2026-Q2");

    await ranking.applyPeriod("half-yearly", "2026-H1");
    await expect(page.getByTestId("period-summary")).toContainText("2026-H1");
    await expect(ranking.rankRows.first()).toBeVisible();

    await ranking.applyPeriod("yearly", "2025");
    await expect(page.getByTestId("period-summary")).toContainText("2025");
    await expect(ranking.rankRows.first()).toBeVisible();

    await ranking.openFirstVendorDetail();
    await expect(page.getByTestId("vendor-detail-score")).toBeVisible();
    await expect(page.getByTestId("project-score-chart")).toBeVisible();
    await expect(page.getByTestId("project-factor-stacked-chart")).toBeVisible();
    await expect(page.getByTestId("attribute-charts-section")).toBeVisible();
    await expect(page.getByTestId("attr-coverage-chart")).toBeVisible();
    await expect(page.getByTestId("attr-xray-chart")).toBeVisible();
    await expect(page.getByTestId("attr-responsiveness-chart")).toBeVisible();
    await expect(page.getByTestId("attr-availability-chart")).toBeVisible();
    await expect(page.getByTestId("attr-complexity-chart")).toBeVisible();
    await expect(page.getByTestId("attr-defects-chart")).toBeVisible();
    await expect(page.getByTestId("project-breakdown-table")).toBeVisible();
  });
});
