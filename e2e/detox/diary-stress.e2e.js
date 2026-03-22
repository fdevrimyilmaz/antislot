async function closeDiaryIntroIfVisible() {
  const introSecondary = element(by.id("diary-intro-secondary"));
  try {
    if (await introSecondary.isVisible()) {
      await introSecondary.tap();
    }
  } catch {
    // Intro may already be closed.
  }
}

async function dismissAlertIfVisible() {
  const labels = ["Tamam", "OK"];
  for (const label of labels) {
    const button = element(by.text(label));
    try {
      if (await button.isVisible()) {
        await button.tap();
        return;
      }
    } catch {
      // keep trying
    }
  }
}

describe("Diary stress flow", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("handles repeated save/update cycles without breaking UI", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id("home-card-diary")).tap();
    await expect(element(by.id("diary-screen"))).toBeVisible();
    await closeDiaryIntroIfVisible();

    const loops = 15;
    for (let i = 1; i <= loops; i += 1) {
      const message = `Diary soak iteration ${i}`;
      await element(by.id("diary-input")).tap();
      await element(by.id("diary-input")).replaceText(message);
      await element(by.id("diary-save-btn")).tap();
      await dismissAlertIfVisible();
      await expect(element(by.id("diary-input"))).toHaveText(message);
    }

    await expect(element(by.id("diary-history"))).toBeVisible();
  });
});

