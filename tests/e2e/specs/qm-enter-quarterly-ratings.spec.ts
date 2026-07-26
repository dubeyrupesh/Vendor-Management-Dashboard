import { expect, test } from "../fixtures/auth.fixture";
import { ProjectRatingsPage } from "../pages/ProjectRatingsPage";
import { VendorListPage } from "../pages/VendorListPage";

test.describe("Quality Manager Ratings", () => {
  test("saves quarterly coverage and shows updated source values", async ({ page, loginAsQm }) => {
    await loginAsQm();

    const vendors = new VendorListPage(page);
    await vendors.goto();
    await expect(vendors.vendorList).toBeVisible();
    await vendors.openRatings();

    const ratings = new ProjectRatingsPage(page);
    await expect(ratings.coverageInput).toBeVisible();
    await ratings.saveRating({
      coverage: 88,
      defects: 1,
      manualTests: 20,
      automatedTests: 80,
      responsiveness: 5,
      availability: 4,
      complexity: 5,
    });

    await expect(page.getByRole("heading", { name: /Quarterly ratings/i })).toBeVisible();
    await expect(ratings.coverageInput).toHaveValue("88");
  });
});
