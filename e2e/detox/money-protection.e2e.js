describe("Money protection flow", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("opens money protection and updates financial controls", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id("home-card-money-protection")).tap();
    await expect(element(by.id("money-protection-screen"))).toBeVisible();

    await element(by.id("money-protection-daily-limit-input")).tap();
    await element(by.id("money-protection-daily-limit-input")).replaceText("500");
    await element(by.id("money-protection-daily-limit-save-btn")).tap();

    await element(by.id("money-protection-spend-input")).tap();
    await element(by.id("money-protection-spend-input")).replaceText("100");
    await element(by.id("money-protection-spend-add-btn")).tap();

    await element(by.id("money-protection-lock-start-btn")).tap();
    await expect(element(by.id("money-protection-status-card"))).toBeVisible();
  });
});
