import { inferUrgeFromContext, URGE_TRIGGER_LIBRARY_SIZE } from "@/services/urgeTriggerInference";

describe("inferUrgeFromContext", () => {
  it("detects emotional trigger with high confidence", () => {
    const result = inferUrgeFromContext(
      "Cok stresliyim ve yalniz hissediyorum. Bu gece tekrar oynama istegi geldi."
    );

    expect(result.hasSignals).toBe(true);
    expect(result.trigger).toBe("emotional");
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedIntensity).toBeGreaterThanOrEqual(5);
    expect(result.matchedSignalCount).toBeGreaterThan(0);
  });

  it("detects financial trigger", () => {
    const result = inferUrgeFromContext("Borclarim artti, faturayi odeyemedim ve para dusuncesi tetikliyor.");

    expect(result.hasSignals).toBe(true);
    expect(result.trigger).toBe("financial");
    expect(result.suggestedIntensity).toBeGreaterThanOrEqual(5);
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });

  it("escalates to critical when crisis signal is present", () => {
    const result = inferUrgeFromContext(
      "Kontrol edemiyorum, simdi relaps olacak gibi. Krizdeyim."
    );

    expect(result.hasSignals).toBe(true);
    expect(result.riskLevel).toBe("critical");
    expect(result.suggestedIntensity).toBeGreaterThanOrEqual(9);
    expect(result.recommendedActions).toContain("open_sos");
    expect(result.recommendedActions).toContain("notify_partner");
  });

  it("returns no signal for empty context", () => {
    const result = inferUrgeFromContext("   ");

    expect(result.hasSignals).toBe(false);
    expect(result.trigger).toBeUndefined();
    expect(result.confidence).toBe(0);
    expect(result.suggestedIntensity).toBe(4);
    expect(result.riskLevel).toBe("low");
    expect(result.matchedSignalCount).toBe(0);
    expect(result.librarySignalCount).toBe(URGE_TRIGGER_LIBRARY_SIZE);
    expect(result.recommendedActions).toContain("breathing_reset");
  });

  it("keeps trigger library above 195 signals", () => {
    expect(URGE_TRIGGER_LIBRARY_SIZE).toBeGreaterThanOrEqual(195);
  });
});
