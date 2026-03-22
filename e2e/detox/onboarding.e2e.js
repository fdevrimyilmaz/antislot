describe("Onboarding flow", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  it("navigates to continue screen", async () => {
    await expect(element(by.id("welcome-screen"))).toBeVisible();
    await element(by.id("onboarding-continue")).tap();
    await expect(element(by.id("continue-screen"))).toBeVisible();
  });
});
