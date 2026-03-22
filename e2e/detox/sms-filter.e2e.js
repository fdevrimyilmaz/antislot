describe("SMS filter flow", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("opens SMS filter and classifies a risky message", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id("home-card-sms-filter")).tap();
    await expect(element(by.id("sms-filter-screen"))).toBeVisible();

    await element(by.id("sms-filter-test-message-input")).tap();
    await element(by.id("sms-filter-test-message-input")).replaceText("casino bonus bedava para");
    await element(by.id("sms-filter-run-test-btn")).tap();

    await expect(element(by.id("sms-filter-test-result"))).toBeVisible();
  });
});
