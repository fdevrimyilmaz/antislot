/**
 * Auth (anonymous) + app init e2e.
 * Kritik akış: Uygulama açılır, kullanıcı bağlamı yüklenir, ana ekran veya karşılama görünür.
 */
describe("Auth / App init", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  it("shows welcome or home after init", async () => {
    await new Promise((r) => setTimeout(r, 3000));
    const homeVisible = await element(by.id("home-screen")).isVisible();
    const welcomeVisible = await element(by.id("welcome-screen")).isVisible();
    expect(homeVisible || welcomeVisible).toBe(true);
  });

  it("from welcome, continue shows continue screen", async () => {
    const welcome = element(by.id("welcome-screen"));
    if (await welcome.isVisible()) {
      await element(by.id("onboarding-continue")).tap();
      await expect(element(by.id("continue-screen"))).toBeVisible();
    }
  });
});
