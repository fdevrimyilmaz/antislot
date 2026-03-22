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

describe("Diary flow", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("opens diary screen, saves a note, and shows it in history", async () => {
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id("home-card-diary")).tap();
    await expect(element(by.id("diary-screen"))).toBeVisible();
    await closeDiaryIntroIfVisible();

    const note = "Detox diary smoke note";
    await element(by.id("diary-input")).tap();
    await element(by.id("diary-input")).replaceText(note);
    await element(by.id("diary-save-btn")).tap();
    await dismissAlertIfVisible();

    await expect(element(by.text(note))).toBeVisible();
    await expect(element(by.id("diary-history"))).toBeVisible();
  });
});

