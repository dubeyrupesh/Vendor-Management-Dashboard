import type { Page, Locator } from "@playwright/test";

export class LeadershipRankingPage {
  readonly page: Page;
  readonly rankTable: Locator;
  readonly rankRows: Locator;
  readonly periodTypeSelect: Locator;
  readonly periodValueSelect: Locator;
  readonly periodApply: Locator;
  readonly chart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rankTable = page.getByTestId("vendor-rank-table");
    this.rankRows = page.getByTestId("vendor-rank-row");
    this.periodTypeSelect = page.getByTestId("period-type-select");
    this.periodValueSelect = page.getByTestId("period-value-select");
    this.periodApply = page.getByTestId("period-apply");
    this.chart = page.getByTestId("vendor-rank-chart");
  }

  async goto(periodType: "quarterly" | "half-yearly" | "yearly" = "quarterly", period = "2026-Q2") {
    await this.page.goto(
      `/leadership?periodType=${encodeURIComponent(periodType)}&period=${encodeURIComponent(period)}`,
    );
  }

  async applyPeriod(periodType: "quarterly" | "half-yearly" | "yearly", period: string) {
    await this.periodTypeSelect.selectOption(periodType);
    await this.periodValueSelect.selectOption(period);
    await this.periodApply.click();
  }

  async openFirstVendorDetail() {
    await this.page.getByTestId("vendor-detail-link").first().click();
  }
}
