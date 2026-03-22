/**
 * SOS ekranı e2e — offline/fallback senaryosu.
 * Kritik: SOS ekranı ağ olmadan da açılır; acil yardım hatları ve nefes/erteleme görünür.
 */
describe("SOS offline", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("opens SOS from home and shows helplines and breathing", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.id("sos-quick-access")).tap();
    await expect(element(by.id("sos-screen"))).toBeVisible();
    await expect(element(by.id("sos-helplines"))).toBeVisible();
    await expect(element(by.id("sos-breathing-start"))).toBeVisible();
  });

  it("SOS intro card and back work", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.id("sos-quick-access")).tap();
    await expect(element(by.id("sos-intro-card"))).toBeVisible();
    await element(by.id("sos-back")).tap();
    await expect(element(by.id("home-screen"))).toBeVisible();
  });
});
