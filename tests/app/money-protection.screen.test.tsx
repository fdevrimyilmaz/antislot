import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert, Modal, Switch } from "react-native";

import MoneyProtectionScreen from "@/app/money-protection";
import { router } from "expo-router";
import {
  buildAccountabilityMessage,
  openAccountabilityPartnerSms,
} from "@/services/accountability";
import { useAccountabilityStore } from "@/store/accountabilityStore";
import { useMoneyProtectionStore } from "@/store/moneyProtectionStore";

const mockPremiumHydrate = jest.fn(async () => undefined);
let mockPremiumActive = false;
let mockLanguage: "tr" | "en" = "tr";
let mockSelectedLanguage: "tr" | "en" = "tr";
let mockLocale = "tr-TR";
const mockBuildAccountabilityMessage =
  buildAccountabilityMessage as jest.MockedFunction<
    typeof buildAccountabilityMessage
  >;
const mockOpenAccountabilityPartnerSms =
  openAccountabilityPartnerSms as jest.MockedFunction<
    typeof openAccountabilityPartnerSms
  >;

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("@expo/vector-icons/Ionicons", () => {
  const ReactLocal = jest.requireActual("react") as typeof React;
  const { Text } = jest.requireActual("react-native") as typeof import("react-native");
  return function IoniconsMock(props: { name?: string }) {
    return ReactLocal.createElement(Text, null, props.name ?? "icon");
  };
});

jest.mock("@/services/accountability", () => ({
  buildAccountabilityMessage: jest.fn(
    () => "Yuksek risk algilandi, lutfen kontrol et."
  ),
  openAccountabilityPartnerSms: jest.fn(async () => true),
}));

jest.mock("expo-image", () => {
  const ReactLocal = jest.requireActual("react") as typeof React;
  const { View } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    Image: (props: Record<string, unknown>) => ReactLocal.createElement(View, props),
  };
});

jest.mock("react-native-safe-area-context", () => {
  const ReactLocal = jest.requireActual("react") as typeof React;
  const { View } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactLocal.createElement(View, props, children),
  };
});

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      background: "#FFFFFF",
      text: "#111111",
      textSecondary: "#666666",
      card: "#F7F7F7",
      primary: "#1E7B4D",
      border: "#DDDDDD",
      disabled: "#CCCCCC",
      warning: "#D97706",
      backgroundGradient: ["#FFFFFF", "#FFFFFF"],
      secondary: "#0095FF",
    },
  }),
}));

jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: mockLanguage,
    selectedLanguage: mockSelectedLanguage,
    locale: mockLocale,
    setLanguage: jest.fn(async () => undefined),
    t: {
      generalBack: "Geri",
      moneyProtectionTitle: "Para Koruma Modu",
      moneyProtectionSubtitle: "Aciklama",
      moneyProtectionCardTitle: "Para Koruma",
      moneyProtectionCardSubtitle: "Bugun param guvende mi?",
      moneyProtectionCardAway: "Kart yanimda degil",
      moneyProtectionAlone: "Yalnizim",
      moneyProtectionEmotionalDistress: "Duygusal yuk",
      moneyProtectionEscapeNeed: "Kacis ihtiyaci",
      moneyProtectionEmotionalVoid: "Duygusal bosluk",
      moneyProtectionBankHidden: "Banka app gizli",
      moneyProtectionPaymentsDisabled: "Odeme kapali",
      moneyProtectionPrimaryCta: "Bugun param guvende",
      moneyProtectionSecondaryCta: "Su an riskliyim",
      moneyProtectionLastChecked: "Son kontrol: {{date}}",
    },
  }),
}));

jest.mock("@/store/moneyProtectionStore", () => ({
  useMoneyProtectionStore: jest.fn(),
}));

jest.mock("@/store/accountabilityStore", () => ({
  useAccountabilityStore: jest.fn(),
}));

jest.mock("@/hooks/usePremium", () => ({
  usePremium: () => ({
    isActive: mockPremiumActive,
    hasFeature: () => false,
    source: null,
    expiresAt: null,
    trialEndsAt: null,
    features: [],
    lastSync: null,
    loading: false,
    syncError: null,
  }),
}));

jest.mock("@/store/premiumStore", () => ({
  usePremiumStore: (selector?: (state: { hydrate: typeof mockPremiumHydrate }) => unknown) => {
    const state = { hydrate: mockPremiumHydrate };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

type MoneyProtectionStoreMockState = {
  cardAway: boolean;
  alone: boolean;
  emotionalDistress: boolean;
  escapeNeed: boolean;
  emotionalVoid: boolean;
  bankAppHidden: boolean;
  paymentsDisabled: boolean;
  lastSafeCheck: number | null;
  dailyLimitTRY: number;
  savedTodayTRY: number;
  savedTodayDateKey: string | null;
  lockMinutes: number;
  lockStartedAt: number | null;
  updatedAt: number;
  completedChecks: number;
  totalChecks: number;
  protectionScore: number;
  canConfirmSafe: boolean;
  riskLevel: "safe" | "warning" | "high";
  lockActive: boolean;
  lockRemainingSec: number;
  hydrated: boolean;
  hydrate: jest.Mock;
  updateChecks: jest.Mock;
  markSafeToday: jest.Mock;
  setDailyLimitTRY: jest.Mock;
  addSpendTRY: jest.Mock;
  startLock: jest.Mock;
  stopLock: jest.Mock;
  refreshLockState: jest.Mock;
  getRiskLevel: jest.Mock;
  syncWithServer: jest.Mock;
  reset: jest.Mock;
};

const mockUseMoneyProtectionStore =
  useMoneyProtectionStore as unknown as jest.Mock<MoneyProtectionStoreMockState, []>;
const mockUseAccountabilityStore =
  useAccountabilityStore as unknown as jest.Mock;
const mockRouterPush = router.push as jest.Mock;
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

const accountabilityMockState = {
  hydrated: true,
  partnerName: "Partner",
  partnerPhone: "+905001112233",
  hasPartner: true,
  notifyOnHighRisk: true,
  notifyOnCriticalRisk: true,
  proactiveInterventionEnabled: true,
  alertCooldownMinutes: 20,
  hydrate: jest.fn(async () => undefined),
  setPartner: jest.fn(async () => undefined),
  clearPartner: jest.fn(async () => undefined),
  updatePolicy: jest.fn(async () => undefined),
  shouldNotifyForRisk: jest.fn(() => true),
  canSendAlert: jest.fn(() => true),
  recordAlert: jest.fn(async () => undefined),
  reset: jest.fn(async () => undefined),
};

async function flushAsyncChain(turns = 4): Promise<void> {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve();
  }
}

function createStoreState(
  overrides?: Partial<MoneyProtectionStoreMockState>
): MoneyProtectionStoreMockState {
  return {
    cardAway: true,
    alone: false,
    emotionalDistress: false,
    escapeNeed: false,
    emotionalVoid: false,
    bankAppHidden: true,
    paymentsDisabled: true,
    lastSafeCheck: null,
    dailyLimitTRY: 300,
    savedTodayTRY: 20,
    savedTodayDateKey: "2026-02-22",
    lockMinutes: 0,
    lockStartedAt: null,
    updatedAt: Date.now(),
    completedChecks: 7,
    totalChecks: 7,
    protectionScore: 100,
    canConfirmSafe: true,
    riskLevel: "safe",
    lockActive: false,
    lockRemainingSec: 0,
    hydrated: true,
    hydrate: jest.fn(async () => undefined),
    updateChecks: jest.fn(async () => undefined),
    markSafeToday: jest.fn(async () => undefined),
    setDailyLimitTRY: jest.fn(async () => undefined),
    addSpendTRY: jest.fn(async () => undefined),
    startLock: jest.fn(async () => undefined),
    stopLock: jest.fn(async () => undefined),
    refreshLockState: jest.fn(async () => undefined),
    getRiskLevel: jest.fn(() => "safe"),
    syncWithServer: jest.fn(async () => undefined),
    reset: jest.fn(async () => undefined),
    ...(overrides ?? {}),
  };
}

describe("MoneyProtectionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPremiumActive = false;
    mockLanguage = "tr";
    mockSelectedLanguage = "tr";
    mockLocale = "tr-TR";
    accountabilityMockState.hydrated = true;
    accountabilityMockState.partnerName = "Partner";
    accountabilityMockState.partnerPhone = "+905001112233";
    accountabilityMockState.hasPartner = true;
    accountabilityMockState.proactiveInterventionEnabled = true;
    accountabilityMockState.notifyOnHighRisk = true;
    accountabilityMockState.notifyOnCriticalRisk = true;
    accountabilityMockState.alertCooldownMinutes = 20;
    accountabilityMockState.shouldNotifyForRisk.mockReturnValue(true);
    accountabilityMockState.canSendAlert.mockReturnValue(true);
    mockBuildAccountabilityMessage.mockReturnValue(
      "Yuksek risk algilandi, lutfen kontrol et."
    );
    mockOpenAccountabilityPartnerSms.mockResolvedValue(true);
    mockUseAccountabilityStore.mockImplementation((selector?: (state: typeof accountabilityMockState) => unknown) => {
      if (typeof selector === "function") {
        return selector(accountabilityMockState);
      }
      return accountabilityMockState;
    });
  });

  it("routes to urge flow and starts lock when risk button is pressed", async () => {
    const store = createStoreState({
      lockActive: false,
      canConfirmSafe: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByText, getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-risk-btn"));
    await flushAsyncChain();

    expect(store.startLock).toHaveBeenCalledWith(20);
    expect(mockRouterPush).toHaveBeenCalledWith("/urge/detect");

    expect(getByText("Para Koruma Modu")).toBeTruthy();
  });

  it("keeps risk action disabled while lock is active", async () => {
    const store = createStoreState({
      lockActive: true,
      lockRemainingSec: 180,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-risk-btn"));

    expect(store.startLock).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("calls markSafeToday only when safe confirmation is enabled", async () => {
    const disabledStore = createStoreState({
      canConfirmSafe: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(disabledStore);

    const disabledRender = render(<MoneyProtectionScreen />);
    fireEvent.press(disabledRender.getByTestId("money-protection-safe-btn"));

    expect(disabledStore.markSafeToday).not.toHaveBeenCalled();

    const enabledStore = createStoreState({
      canConfirmSafe: true,
      lockActive: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(enabledStore);

    const enabledRender = render(<MoneyProtectionScreen />);
    fireEvent.press(enabledRender.getByTestId("money-protection-safe-btn"));

    expect(enabledStore.markSafeToday).toHaveBeenCalledTimes(1);
  });

  it("runs cloud sync when sync button is pressed", async () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-sync-btn"));

    await waitFor(() => {
      expect(store.syncWithServer).toHaveBeenCalledTimes(1);
    });
  });

  it("sends partner alert on high risk before navigating to urge flow", async () => {
    const store = createStoreState({
      riskLevel: "high",
      canConfirmSafe: false,
      lockActive: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-risk-btn"));
    await flushAsyncChain();

    expect(store.startLock).toHaveBeenCalledWith(20);
    expect(mockBuildAccountabilityMessage).toHaveBeenCalledTimes(1);
    expect(mockOpenAccountabilityPartnerSms).toHaveBeenCalledTimes(1);
    expect(accountabilityMockState.recordAlert).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/urge/detect");
  });

  it("applies proactive plan in warning mode with short lock and breathing flow", async () => {
    const store = createStoreState({
      riskLevel: "warning",
      lockActive: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-proactive-apply-btn"));
    await flushAsyncChain();

    expect(store.startLock).toHaveBeenCalledWith(10);
    expect(mockRouterPush).toHaveBeenCalledWith("/urge/breathing");
    expect(mockOpenAccountabilityPartnerSms).not.toHaveBeenCalled();
  });

  it("applies proactive plan in high risk mode with lock, partner alert, and urge flow", async () => {
    const store = createStoreState({
      riskLevel: "high",
      lockActive: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-proactive-apply-btn"));
    await flushAsyncChain();

    expect(store.startLock).toHaveBeenCalledWith(20);
    expect(mockBuildAccountabilityMessage).toHaveBeenCalledTimes(1);
    expect(mockOpenAccountabilityPartnerSms).toHaveBeenCalledTimes(1);
    expect(accountabilityMockState.recordAlert).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/urge/detect");
  });

  it("does not apply proactive plan when proactive intervention is disabled", async () => {
    accountabilityMockState.proactiveInterventionEnabled = false;
    const store = createStoreState({
      riskLevel: "high",
      lockActive: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-proactive-apply-btn"));

    expect(store.startLock).not.toHaveBeenCalled();
    expect(mockOpenAccountabilityPartnerSms).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("parses and saves daily limit input", async () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.changeText(
      getByTestId("money-protection-daily-limit-input"),
      "120,5 TRY"
    );
    fireEvent.press(getByTestId("money-protection-daily-limit-save-btn"));
    await flushAsyncChain();

    expect(store.setDailyLimitTRY).toHaveBeenCalledWith(120.5);
  });

  it("adds spend only when parsed amount is positive", async () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.changeText(getByTestId("money-protection-spend-input"), "abc");
    fireEvent.press(getByTestId("money-protection-spend-add-btn"));
    await flushAsyncChain();
    expect(store.addSpendTRY).not.toHaveBeenCalled();

    fireEvent.changeText(getByTestId("money-protection-spend-input"), "45,75");
    await act(async () => {
      fireEvent.press(getByTestId("money-protection-spend-add-btn"));
      await flushAsyncChain();
    });
    expect(store.addSpendTRY).toHaveBeenCalledWith(45.75);
  });

  it("starts and stops lock from lock controls", async () => {
    const startStore = createStoreState({
      lockActive: false,
      riskLevel: "safe",
    });
    mockUseMoneyProtectionStore.mockReturnValue(startStore);

    const startRender = render(<MoneyProtectionScreen />);
    fireEvent.press(startRender.getByTestId("money-protection-lock-start-btn"));
    await flushAsyncChain();
    expect(startStore.startLock).toHaveBeenCalledWith(20);

    const stopStore = createStoreState({
      lockActive: true,
      lockRemainingSec: 120,
    });
    mockUseMoneyProtectionStore.mockReturnValue(stopStore);

    const stopRender = render(<MoneyProtectionScreen />);
    fireEvent.press(stopRender.getByTestId("money-protection-lock-stop-btn"));
    await flushAsyncChain();
    expect(stopStore.stopLock).toHaveBeenCalledTimes(1);
  });

  it("shows premium prompt for extended lock when premium is inactive", async () => {
    const store = createStoreState({ lockActive: false });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-lock-extended-btn"));
    await flushAsyncChain();

    expect(store.startLock).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalled();

    const alertCall = mockAlert.mock.calls[mockAlert.mock.calls.length - 1];
    const buttons = (alertCall?.[2] ?? []) as Array<{ onPress?: () => void }>;
    buttons[1]?.onPress?.();
    expect(mockRouterPush).toHaveBeenCalledWith("/premium");
  });

  it("starts extended lock when premium is active", async () => {
    mockPremiumActive = true;
    const store = createStoreState({ lockActive: false });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-lock-extended-btn"));
    await flushAsyncChain();

    expect(store.startLock).toHaveBeenCalledWith(60);
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("shows missing partner alert when trying to save without required fields", async () => {
    accountabilityMockState.partnerName = "";
    accountabilityMockState.partnerPhone = "";
    accountabilityMockState.hasPartner = false;
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.changeText(getByTestId("money-protection-partner-name-input"), " ");
    fireEvent.changeText(getByTestId("money-protection-partner-phone-input"), "");
    fireEvent.press(getByTestId("money-protection-partner-save-btn"));
    await flushAsyncChain();

    expect(accountabilityMockState.setPartner).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalled();
  });

  it("saves and removes partner", async () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.changeText(
      getByTestId("money-protection-partner-name-input"),
      "  Ali  "
    );
    fireEvent.changeText(
      getByTestId("money-protection-partner-phone-input"),
      "  +905551112233  "
    );
    fireEvent.press(getByTestId("money-protection-partner-save-btn"));
    await flushAsyncChain();

    expect(accountabilityMockState.setPartner).toHaveBeenCalledWith(
      "Ali",
      "+905551112233"
    );

    await act(async () => {
      fireEvent.press(getByTestId("money-protection-partner-remove-btn"));
      await flushAsyncChain();
    });
    expect(accountabilityMockState.clearPartner).toHaveBeenCalledTimes(1);
  });

  it("prevents partner check-in when alert cooldown is active", async () => {
    accountabilityMockState.canSendAlert.mockReturnValue(false);
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-partner-checkin-btn"));
    await flushAsyncChain();

    expect(mockBuildAccountabilityMessage).not.toHaveBeenCalled();
    expect(mockOpenAccountabilityPartnerSms).not.toHaveBeenCalled();
    expect(accountabilityMockState.recordAlert).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalled();
  });

  it("sends partner check-in message when allowed", async () => {
    accountabilityMockState.canSendAlert.mockReturnValue(true);
    const store = createStoreState({
      riskLevel: "safe",
      protectionScore: 84,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-partner-checkin-btn"));
    await flushAsyncChain();

    expect(mockBuildAccountabilityMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "tr",
        reason: "manual_check_in",
        score: 84,
      })
    );
    expect(mockOpenAccountabilityPartnerSms).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "+905001112233",
        language: "tr",
      })
    );
    expect(accountabilityMockState.recordAlert).toHaveBeenCalledTimes(1);
  });

  it("clamps cooldown value when saving accountability policy", async () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.changeText(getByTestId("money-protection-alert-cooldown-input"), "999");
    await act(async () => {
      fireEvent.press(getByTestId("money-protection-alert-cooldown-save-btn"));
      await flushAsyncChain();
    });

    expect(accountabilityMockState.updatePolicy).toHaveBeenCalledWith({
      alertCooldownMinutes: 240,
    });
  });

  it("shows sync error notice when cloud sync fails", async () => {
    const store = createStoreState({
      syncWithServer: jest.fn(async () => {
        throw new Error("sync boom");
      }),
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId, findByText } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-sync-btn"));

    await waitFor(() => {
      expect(store.syncWithServer).toHaveBeenCalledTimes(1);
    });
    expect(await findByText("sync boom")).toBeTruthy();
  });

  it("hydrates money protection store when state is not hydrated", async () => {
    const hydrateMock = jest.fn(async () => undefined);
    const store = createStoreState({
      hydrated: false,
      hydrate: hydrateMock,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    render(<MoneyProtectionScreen />);

    await waitFor(() => {
      expect(hydrateMock).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes lock state on interval while lock is active", async () => {
    jest.useFakeTimers();
    try {
      const refreshMock = jest.fn(async () => undefined);
      const store = createStoreState({
        hydrated: true,
        lockActive: true,
        refreshLockState: refreshMock,
      });
      mockUseMoneyProtectionStore.mockReturnValue(store);

      render(<MoneyProtectionScreen />);
      await flushAsyncChain();
      expect(refreshMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      await flushAsyncChain();

      expect(refreshMock).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("navigates back when back button is pressed", () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByText } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByText("< Geri"));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("opens premium page from risk analysis button when premium is inactive", () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByText } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByText(/Risk Analiz/i));

    expect(mockRouterPush).toHaveBeenCalledWith("/premium");
  });

  it("opens and closes risk analysis modal in premium mode", async () => {
    mockPremiumActive = true;
    mockLanguage = "en";
    mockSelectedLanguage = "en";
    mockLocale = "en-US";
    const store = createStoreState({
      riskLevel: "warning",
      dailyLimitTRY: 0,
      savedTodayTRY: 75,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByText, queryByText, UNSAFE_getByType } = render(<MoneyProtectionScreen />);

    fireEvent.press(getByText("Detailed Risk Analysis"));
    expect(getByText("Risk Analysis Report")).toBeTruthy();

    const modal = UNSAFE_getByType(Modal);
    fireEvent(modal, "requestClose");
    await flushAsyncChain();
    expect(queryByText("Risk Analysis Report")).toBeNull();

    fireEvent.press(getByText("Detailed Risk Analysis"));
    fireEvent.press(getByText("Close"));
    await flushAsyncChain();
    expect(queryByText("Risk Analysis Report")).toBeNull();
  });

  it("opens premium page from monthly projection lock prompt", () => {
    mockLanguage = "en";
    mockSelectedLanguage = "en";
    mockLocale = "en-US";
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByText } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByText("Premium to view"));

    expect(mockRouterPush).toHaveBeenCalledWith("/premium");
  });

  it("triggers all switch update handlers", () => {
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { UNSAFE_getAllByType } = render(<MoneyProtectionScreen />);
    const switches = UNSAFE_getAllByType(Switch);
    expect(switches.length).toBeGreaterThanOrEqual(10);

    fireEvent(switches[0], "valueChange", false);
    fireEvent(switches[1], "valueChange", false);
    fireEvent(switches[2], "valueChange", true);
    fireEvent(switches[3], "valueChange", true);
    fireEvent(switches[4], "valueChange", true);
    fireEvent(switches[5], "valueChange", true);
    fireEvent(switches[6], "valueChange", false);
    fireEvent(switches[7], "valueChange", false);
    fireEvent(switches[8], "valueChange", false);
    fireEvent(switches[9], "valueChange", false);

    expect(accountabilityMockState.updatePolicy).toHaveBeenCalledWith({
      proactiveInterventionEnabled: false,
    });
    expect(accountabilityMockState.updatePolicy).toHaveBeenCalledWith({
      notifyOnHighRisk: false,
    });
    expect(accountabilityMockState.updatePolicy).toHaveBeenCalledWith({
      notifyOnCriticalRisk: false,
    });
    expect(store.updateChecks).toHaveBeenCalledWith({ cardAway: false });
    expect(store.updateChecks).toHaveBeenCalledWith({ alone: true });
    expect(store.updateChecks).toHaveBeenCalledWith({ emotionalDistress: true });
    expect(store.updateChecks).toHaveBeenCalledWith({ escapeNeed: true });
    expect(store.updateChecks).toHaveBeenCalledWith({ emotionalVoid: true });
    expect(store.updateChecks).toHaveBeenCalledWith({ bankAppHidden: false });
    expect(store.updateChecks).toHaveBeenCalledWith({ paymentsDisabled: false });
  });

  it("shows partner missing warning when partner phone is blank", async () => {
    accountabilityMockState.hasPartner = true;
    accountabilityMockState.partnerPhone = "   ";
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-partner-checkin-btn"));
    await flushAsyncChain();

    expect(mockBuildAccountabilityMessage).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      "Partner Accountability",
      "Partner bilgisi eksik."
    );
  });

  it("shows partner alert failure when sms launcher returns false", async () => {
    mockOpenAccountabilityPartnerSms.mockResolvedValue(false);
    const store = createStoreState();
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-partner-checkin-btn"));
    await flushAsyncChain();

    expect(mockOpenAccountabilityPartnerSms).toHaveBeenCalledTimes(1);
    expect(accountabilityMockState.recordAlert).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      "Partner Accountability",
      "Partner bildirimi acilamadi."
    );
  });

  it("sends proactive lock started alert on lock start in high risk", async () => {
    const store = createStoreState({
      riskLevel: "high",
      lockActive: false,
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByTestId } = render(<MoneyProtectionScreen />);
    fireEvent.press(getByTestId("money-protection-lock-start-btn"));
    await flushAsyncChain();

    expect(store.startLock).toHaveBeenCalledWith(20);
    expect(mockBuildAccountabilityMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "proactive_lock_started",
        riskLevel: "high",
      })
    );
    expect(mockOpenAccountabilityPartnerSms).toHaveBeenCalledTimes(1);
  });

  it("uses currency fallback text when Intl formatter throws", () => {
    const originalNumberFormat = Intl.NumberFormat;
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      (() => {
        throw new Error("intl-disabled");
      }) as unknown as typeof Intl.NumberFormat;

    try {
      const store = createStoreState({
        savedTodayTRY: 20,
      });
      mockUseMoneyProtectionStore.mockReturnValue(store);

      const { getByText } = render(<MoneyProtectionScreen />);
      expect(getByText(/20\.00 TRY/)).toBeTruthy();
    } finally {
      (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
        originalNumberFormat;
    }
  });

  it("hides last check text when date formatting fails", () => {
    const getDateSpy = jest
      .spyOn(Date.prototype, "getDate")
      .mockImplementation(() => {
        throw new Error("date-fail");
      });

    try {
      const store = createStoreState({
        lastSafeCheck: Date.now(),
      });
      mockUseMoneyProtectionStore.mockReturnValue(store);

      const { queryByText } = render(<MoneyProtectionScreen />);
      expect(queryByText(/Son kontrol:/i)).toBeNull();
    } finally {
      getDateSpy.mockRestore();
    }
  });

  it("renders last check text when lastSafeCheck exists", () => {
    const store = createStoreState({
      lastSafeCheck: Date.UTC(2026, 1, 22, 10, 5, 0),
    });
    mockUseMoneyProtectionStore.mockReturnValue(store);

    const { getByText } = render(<MoneyProtectionScreen />);
    expect(getByText(/Son kontrol:/i)).toBeTruthy();
  });
});
