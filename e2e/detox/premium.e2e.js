/**
 * Premium ekranı e2e — purchase/restore akışı (UI).
 * Kritik: Premium ekranı açılır, plan kartları ve geri yükle butonu görünür.
 * Gerçek satın alma/restore store'a bağlı; bu test sadece ekran ve butonlara erişimi doğrular.
 */
describe("Premium purchase / restore", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("opens Premium screen from tab and shows restore button", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    // Premium tab (crown) — expo-router /premium'a gider
    await element(by.text("Premium")).tap();
    await expect(element(by.id("premium-screen"))).toBeVisible();
    await expect(element(by.id("premium-restore-btn"))).toBeVisible();
  });

  it("Premium plan cards are visible", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("Premium")).tap();
    await expect(element(by.id("premium-screen"))).toBeVisible();
    await expect(element(by.id("premium-plan-monthly"))).toBeVisible();
    await expect(element(by.id("premium-plan-yearly"))).toBeVisible();
    await expect(element(by.id("premium-plan-lifetime"))).toBeVisible();
  });

  it("Premium back returns to home", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("Premium")).tap();
    await expect(element(by.id("premium-screen"))).toBeVisible();
    await element(by.id("premium-back")).tap();
    await expect(element(by.id("home-screen"))).toBeVisible();
  });
});
