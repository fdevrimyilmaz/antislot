import { shouldTriggerHighRiskIntervention } from "@/services/proactiveInterventionEngine";

describe("shouldTriggerHighRiskIntervention", () => {
  const cooldownMs = 20 * 60 * 1000;

  it("triggers when risk enters high", () => {
    const result = shouldTriggerHighRiskIntervention({
      previousRisk: "warning",
      nextRisk: "high",
      now: 1_000,
      lastTriggeredAt: null,
      cooldownMs,
    });

    expect(result).toBe(true);
  });

  it("does not trigger while staying in high risk", () => {
    const result = shouldTriggerHighRiskIntervention({
      previousRisk: "high",
      nextRisk: "high",
      now: 5_000,
      lastTriggeredAt: null,
      cooldownMs,
    });

    expect(result).toBe(false);
  });

  it("does not trigger before cooldown ends", () => {
    const now = 50_000;
    const result = shouldTriggerHighRiskIntervention({
      previousRisk: "warning",
      nextRisk: "high",
      now,
      lastTriggeredAt: now - cooldownMs + 1_000,
      cooldownMs,
    });

    expect(result).toBe(false);
  });

  it("triggers after cooldown window", () => {
    const now = 100_000;
    const result = shouldTriggerHighRiskIntervention({
      previousRisk: "safe",
      nextRisk: "high",
      now,
      lastTriggeredAt: now - cooldownMs - 1_000,
      cooldownMs,
    });

    expect(result).toBe(true);
  });
});
