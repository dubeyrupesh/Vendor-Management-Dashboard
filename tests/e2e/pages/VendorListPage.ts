import type { Page, Locator } from "@playwright/test";

export class VendorListPage {
  readonly page: Page;
  readonly vendorList: Locator;
  readonly vendorNameInput: Locator;
  readonly vendorSubmit: Locator;
  readonly ratingsNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.vendorList = page.getByTestId("vendor-list");
    this.vendorNameInput = page.getByTestId("vendor-name-input");
    this.vendorSubmit = page.getByTestId("vendor-submit");
    this.ratingsNav = page.getByRole("link", { name: "Ratings" });
  }

  async goto() {
    await this.page.goto("/qm");
  }

  async createVendor(name: string) {
    await this.vendorNameInput.fill(name);
    await this.vendorSubmit.click();
  }

  async openRatings() {
    await this.ratingsNav.click();
  }
}
