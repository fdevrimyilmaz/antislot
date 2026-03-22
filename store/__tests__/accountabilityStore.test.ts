import { storage, STORAGE_KEYS } from "@/lib/storage";
import { useAccountabilityStore } from "@/store/accountabilityStore";

jest.mock("@/lib/storage", () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  STORAGE_KEYS: {
    ACCOUNTABILITY_POLICY: "antislot_accountability_policy",
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

describe("accountabilityStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.get.mockResolvedValue(null);
    mockStorage.set.mockResolvedValue(undefined);
    mockStorage.remove.mockResolvedValue(undefined);

    useAccountabilityStore.setState({
      partnerName: "",
      partnerPhone: "",
      notifyOnHighRisk: true,
      notifyOnCriticalRisk: true,
      proactiveInterventionEnabled: true,
      alertCooldownMinutes: 20,
      lastAlertAt: null,
      hydrated: false,
      hasPartner: false,
    });
  });

  it("hydrates and normalizes persisted policy", async () => {
    mockStorage.get.mockResolvedValue({
      partnerName: "  Kardes  ",
      partnerPhone: " +90 500 111 22 33 ",
      notifyOnHighRisk: true,
      notifyOnCriticalRisk: false,
      proactiveInterventionEnabled: true,
      alertCooldownMinutes: 15,
      lastAlertAt: Date.now() - 1000,
    });

    await useAccountabilityStore.getState().hydrate();
    const state = useAccountabilityStore.getState();

    expect(state.hydrated).toBe(true);
    expect(state.partnerName).toBe("Kardes");
    expect(state.partnerPhone).toBe("+905001112233");
    expect(state.hasPartner).toBe(true);
    expect(state.notifyOnCriticalRisk).toBe(false);
  });

  it("saves partner and persists state", async () => {
    await useAccountabilityStore.getState().setPartner("Ablam", "0555 123 45 67");
    const state = useAccountabilityStore.getState();

    expect(state.partnerName).toBe("Ablam");
    expect(state.partnerPhone).toBe("05551234567");
    expect(state.hasPartner).toBe(true);
    expect(mockStorage.set).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCOUNTABILITY_POLICY,
      expect.objectContaining({
        partnerName: "Ablam",
        partnerPhone: "05551234567",
      }),
      { type: "secure" }
    );
  });

  it("enforces cooldown when checking if alert can be sent", async () => {
    const now = Date.now();
    await useAccountabilityStore.getState().setPartner("Partner", "+905551234567");
    await useAccountabilityStore.getState().updatePolicy({ alertCooldownMinutes: 30 });
    await useAccountabilityStore.getState().recordAlert(now);

    expect(useAccountabilityStore.getState().canSendAlert(now + 10 * 60 * 1000)).toBe(false);
    expect(useAccountabilityStore.getState().canSendAlert(now + 31 * 60 * 1000)).toBe(true);
  });

  it("checks risk notification policy flags", async () => {
    await useAccountabilityStore.getState().setPartner("Partner", "+905551234567");
    await useAccountabilityStore.getState().updatePolicy({
      notifyOnHighRisk: false,
      notifyOnCriticalRisk: true,
    });

    const state = useAccountabilityStore.getState();
    expect(state.shouldNotifyForRisk("high")).toBe(false);
    expect(state.shouldNotifyForRisk("critical")).toBe(true);
  });
});
