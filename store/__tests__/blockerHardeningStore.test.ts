import { storage, STORAGE_KEYS } from "@/lib/storage";
import {
  computeBlockerHardeningScore,
  useBlockerHardeningStore,
} from "@/store/blockerHardeningStore";

jest.mock("@/lib/storage", () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  STORAGE_KEYS: {
    BLOCKER_HARDENING_POLICY: "antislot_blocker_hardening_policy",
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

describe("blockerHardeningStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.get.mockResolvedValue(null);
    mockStorage.set.mockResolvedValue(undefined);
    mockStorage.remove.mockResolvedValue(undefined);

    useBlockerHardeningStore.setState({
      strictMode: true,
      blockDoh: true,
      blockDot: true,
      blockQuic: true,
      lockdownVpn: false,
      tamperAlerts: true,
      hydrated: false,
    });
  });

  it("hydrates policy from storage", async () => {
    mockStorage.get.mockResolvedValue({
      strictMode: true,
      blockDoh: true,
      blockDot: false,
      blockQuic: true,
      lockdownVpn: true,
      tamperAlerts: false,
    });

    await useBlockerHardeningStore.getState().hydrate();
    const state = useBlockerHardeningStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.blockDot).toBe(false);
    expect(state.lockdownVpn).toBe(true);
  });

  it("persists updates", async () => {
    await useBlockerHardeningStore.getState().updatePolicy({
      strictMode: false,
      lockdownVpn: true,
    });

    const state = useBlockerHardeningStore.getState();
    expect(state.strictMode).toBe(false);
    expect(state.lockdownVpn).toBe(true);
    expect(mockStorage.set).toHaveBeenCalledWith(
      STORAGE_KEYS.BLOCKER_HARDENING_POLICY,
      expect.objectContaining({
        strictMode: false,
        lockdownVpn: true,
      }),
      { type: "standard" }
    );
  });

  it("computes hardening score", () => {
    const score = computeBlockerHardeningScore({
      policy: {
        strictMode: true,
        blockDoh: true,
        blockDot: true,
        blockQuic: true,
        lockdownVpn: true,
        tamperAlerts: true,
      },
      protectionEnabled: true,
      lastSyncStale: false,
    });

    expect(score).toBeGreaterThanOrEqual(90);
  });
});
