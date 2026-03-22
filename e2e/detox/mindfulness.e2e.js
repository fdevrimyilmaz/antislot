async function dismissMindfulnessIntroIfVisible() {
  const introStart = element(by.id("mindfulness-intro-start"));
  try {
    if (await introStart.isVisible()) {
      await introStart.tap();
    }
  } catch {
    // Intro may already be closed.
  }
}

describe("Mindfulness flow", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("starts a mindfulness session and advances one step", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id("home-card-mindfulness")).tap();
    await expect(element(by.id("mindfulness-screen"))).toBeVisible();
    await dismissMindfulnessIntroIfVisible();

    await element(by.id("mindfulness-session-action-breath-reset")).tap();
    await expect(element(by.id("mindfulness-step-card"))).toBeVisible();
    await element(by.id("mindfulness-step-next-btn")).tap();
    await expect(element(by.id("mindfulness-step-card"))).toBeVisible();
  });
});
