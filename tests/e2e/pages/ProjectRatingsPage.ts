import type { Page, Locator } from "@playwright/test";

export class ProjectRatingsPage {
  readonly page: Page;
  readonly coverageInput: Locator;
  readonly defectsInput: Locator;
  readonly manualTestsInput: Locator;
  readonly automatedTestsInput: Locator;
  readonly responsivenessInput: Locator;
  readonly availabilityInput: Locator;
  readonly complexityInput: Locator;
  readonly submitButton: Locator;
  readonly currentCoverage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.coverageInput = page.getByTestId("coverage-input");
    this.defectsInput = page.getByTestId("defects-input");
    this.manualTestsInput = page.getByTestId("manual-tests-input");
    this.automatedTestsInput = page.getByTestId("automated-tests-input");
    this.responsivenessInput = page.getByTestId("responsiveness-input");
    this.availabilityInput = page.getByTestId("availability-input");
    this.complexityInput = page.getByTestId("complexity-input");
    this.submitButton = page.getByTestId("rating-submit");
    this.currentCoverage = page.getByTestId("current-coverage");
  }

  async goto(quarter = "2026-Q2") {
    await this.page.goto(`/qm/ratings?quarter=${quarter}`);
  }

  async saveRating(values: {
    coverage: number;
    defects: number;
    manualTests: number;
    automatedTests: number;
    responsiveness: number;
    availability: number;
    complexity: number;
  }) {
    await this.coverageInput.fill(String(values.coverage));
    await this.defectsInput.fill(String(values.defects));
    await this.manualTestsInput.fill(String(values.manualTests));
    await this.automatedTestsInput.fill(String(values.automatedTests));
    await this.responsivenessInput.fill(String(values.responsiveness));
    await this.availabilityInput.fill(String(values.availability));
    await this.complexityInput.fill(String(values.complexity));
    await this.submitButton.click();
  }
}
