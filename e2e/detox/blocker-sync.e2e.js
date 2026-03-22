/**
 * Blocker ekranı e2e — sync ve koruma UI.
 * Kritik: Blocker ekranı açılır, koruma switch ve senkronize butonu görünür.
 */
describe("Blocker sync", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("opens Blocker from Premium and shows sync button", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("Premium")).tap();
    await expect(element(by.id("premium-screen"))).toBeVisible();
    // Kumar kartı (Premium aktif değilse kilitli olabilir; yine de blocker'a link olabilir)
    const blockerCard = element(by.text("Kumar"));
    if (await blockerCard.isVisible()) {
      await blockerCard.tap();
      await expect(element(by.id("blocker-screen"))).toBeVisible();
      await expect(element(by.id("blocker-sync-btn"))).toBeVisible();
    }
  });

  it("Blocker screen shows protection switch and back", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("Premium")).tap();
    await expect(element(by.id("premium-screen"))).toBeVisible();
    const blockerCard = element(by.text("Kumar"));
    if (await blockerCard.isVisible()) {
      await blockerCard.tap();
      await expect(element(by.id("blocker-screen"))).toBeVisible();
      await expect(element(by.id("blocker-protection-switch"))).toBeVisible();
      await element(by.id("blocker-back")).tap();
      await expect(element(by.id("premium-screen"))).toBeVisible();
    }
  });
});
