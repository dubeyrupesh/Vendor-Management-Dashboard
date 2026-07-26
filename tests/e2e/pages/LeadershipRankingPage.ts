import type { Page, Locator } from "@playwright/test";

export class LeadershipRankingPage {
  readonly page: Page;
  readonly rankTable: Locator;
  readonly rankRows: Locator;
  readonly quarterInput: Locator;
  readonly chart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rankTable = page.getByTestId("vendor-rank-table");
    this.rankRows = page.getByTestId("vendor-rank-row");
    this.quarterInput = page.getByTestId("leadership-quarter-input");
    this.chart = page.getByTestId("vendor-rank-chart");
  }

  async goto(quarter = "2026-Q2") {
    await this.page.goto(`/leadership?quarter=${quarter}`);
  }

  async openFirstVendorDetail() {
    await this.page.getByTestId("vendor-detail-link").first().click();
  }
}
