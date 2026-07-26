import { expect, test } from "../fixtures/auth.fixture";
import { LeadershipRankingPage } from "../pages/LeadershipRankingPage";

test.describe("Leadership Rankings", () => {
  test("shows vendor rank table and opens vendor detail", async ({ page, loginAsLeadership }) => {
    await loginAsLeadership();

    const ranking = new LeadershipRankingPage(page);
    await ranking.goto("2026-Q2");

    await expect(ranking.rankTable).toBeVisible();
    await expect(ranking.rankRows.first()).toBeVisible();
    await expect(ranking.chart).toBeVisible();

    await ranking.openFirstVendorDetail();
    await expect(page.getByTestId("vendor-detail-score")).toBeVisible();
    await expect(page.getByTestId("project-breakdown-table")).toBeVisible();
  });
});
