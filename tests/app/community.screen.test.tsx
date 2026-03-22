import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

import CommunityLandingScreen from "@/app/community";
import CommunityRoomScreen from "@/app/community/room/[id]";
import CommunityRoomsScreen from "@/app/community/rooms";
import CommunityUsernameScreen from "@/app/community/username";

const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

let mockPathname = "/community";
let mockSearchParams: { id?: string; direct?: string; next?: string } = {};

const mockGetStoredUsername = jest.fn<Promise<string | null>, []>();
const mockGetProfile = jest.fn();
const mockSaveProfile = jest.fn();
const mockNormalizeUsername = jest.fn((value: string) =>
  value.trim().replace(/\s+/g, " ").slice(0, 32)
);

const mockEnsureAnonymousUser = jest.fn<Promise<string>, []>(async () => "uid-local-1");
const mockListenToDirectSupportMessages = jest.fn();
const mockJoinRoomPresence = jest.fn();
const mockJoinDirectSupportPresence = jest.fn();
const mockListenToRoomMessages = jest.fn();
const mockListenToRoomOnlineCount = jest.fn();
const mockSendDirectSupportMessage = jest.fn();
const mockSendRoomMessage = jest.fn();
const mockSafeAiReply = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    back: (...args: unknown[]) => mockRouterBack(...args),
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
  usePathname: () => mockPathname,
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "tr",
    selectedLanguage: "tr",
    locale: "tr-TR",
    setLanguage: jest.fn(async () => undefined),
    t: {
      back: "Geri",
    },
  }),
}));

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

jest.mock("@/hooks/useLocalizedCopy", () => ({
  useLocalizedCopy: (value: Record<string, unknown> | string) => {
    if (value && typeof value === "object" && "tr" in value) {
      return (value as { tr: unknown }).tr;
    }
    return value;
  },
  useAutoTranslatedValue: <T,>(value: T) => value,
}));

jest.mock("react-native-safe-area-context", () => {
  const ReactLocal = jest.requireActual("react") as typeof React;
  const { View: NativeView } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactLocal.createElement(NativeView, props, children),
  };
});

jest.mock("@/components/ui/screen-hero", () => {
  const ReactLocal = jest.requireActual("react") as typeof React;
  const { View: NativeView, Text: NativeText } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    ScreenHero: ({ title, subtitle }: { title?: string; subtitle?: string }) =>
      ReactLocal.createElement(
        NativeView,
        null,
        ReactLocal.createElement(NativeText, null, title ?? ""),
        ReactLocal.createElement(NativeText, null, subtitle ?? "")
      ),
  };
});

jest.mock("@/components/ui/section-lead", () => {
  const ReactLocal = jest.requireActual("react") as typeof React;
  const { View: NativeView, Text: NativeText } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    SectionLead: ({ title, subtitle }: { title?: string; subtitle?: string }) =>
      ReactLocal.createElement(
        NativeView,
        null,
        ReactLocal.createElement(NativeText, null, title ?? ""),
        ReactLocal.createElement(NativeText, null, subtitle ?? "")
      ),
  };
});

jest.mock("@/store/profileStore", () => ({
  USERNAME_MAX_LENGTH: 32,
  getStoredUsername: () => mockGetStoredUsername(),
  getProfile: () => mockGetProfile(),
  saveProfile: (...args: unknown[]) => mockSaveProfile(...args),
  normalizeUsername: (value: string) => mockNormalizeUsername(value),
}));

jest.mock("@/services/aiSafety", () => ({
  safeAiReply: (...args: unknown[]) => mockSafeAiReply(...args),
}));

jest.mock("@/lib/community", () => {
  const rooms = [
    {
      id: "kriz",
      name: "Chat",
      description: "Shared live chat",
      emoji: "\u{1F4AC}",
    },
    {
      id: "kumar",
      name: "Kumar",
      description: "Kumar room",
      emoji: "\u{1F3B0}",
    },
    {
      id: "finans",
      name: "Finance",
      description: "Finance room",
      emoji: "\u{1F4B3}",
    },
    {
      id: "motivasyon",
      name: "Motivation",
      description: "Motivation room",
      emoji: "\u{1F525}",
    },
    {
      id: "gunluk",
      name: "Daily",
      description: "Daily room",
      emoji: "\u{1F4D3}",
    },
    {
      id: "dinleme",
      name: "Listening",
      description: "Listening room",
      emoji: "\u{1F442}",
    },
  ] as const;

  return {
    COMMUNITY_ROOMS: rooms,
    COMMUNITY_AI_BOT: {
      id: "community_ai_gpt4_bot",
      nameTR: "ChatGPT-4",
      nameEN: "ChatGPT-4",
    },
    LIVE_SUPPORT_AGENT: {
      id: "live_agent",
      nameTR: "Canli Destek",
      nameEN: "Live Support",
    },
    ensureAnonymousUser: () => mockEnsureAnonymousUser(),
    getRoomMeta: (id: string) => rooms.find((room) => room.id === id) ?? null,
    listenToDirectSupportMessages: (...args: unknown[]) =>
      mockListenToDirectSupportMessages(...args),
    joinRoomPresence: (...args: unknown[]) => mockJoinRoomPresence(...args),
    joinDirectSupportPresence: (...args: unknown[]) =>
      mockJoinDirectSupportPresence(...args),
    listenToRoomMessages: (...args: unknown[]) => mockListenToRoomMessages(...args),
    listenToRoomOnlineCount: (...args: unknown[]) =>
      mockListenToRoomOnlineCount(...args),
    sendDirectSupportMessage: (...args: unknown[]) =>
      mockSendDirectSupportMessage(...args),
    sendRoomMessage: (...args: unknown[]) => mockSendRoomMessage(...args),
  };
});

describe("Community username-gated flow", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();

    mockPathname = "/community";
    mockSearchParams = {};

    mockGetStoredUsername.mockResolvedValue("test_user");
    mockGetProfile.mockResolvedValue({
      username: "test_user",
      age: "",
      gender: "",
      ethnicity: "",
      countryState: "",
      referral: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    mockSaveProfile.mockResolvedValue(undefined);

    mockListenToRoomMessages.mockImplementation(
      (_roomId: string, callback: (messages: unknown[]) => void) => {
        callback([]);
        return () => {};
      }
    );
    mockListenToDirectSupportMessages.mockImplementation(
      (_userId: string, _agentId: string, callback: (messages: unknown[]) => void) => {
        callback([]);
        return () => {};
      }
    );
    mockListenToRoomOnlineCount.mockImplementation(
      (_roomId: string, callback: (count: number) => void) => {
        callback(3);
        return () => {};
      }
    );

    mockJoinRoomPresence.mockResolvedValue(async () => undefined);
    mockJoinDirectSupportPresence.mockResolvedValue(async () => undefined);
    mockSendRoomMessage.mockResolvedValue(undefined);
    mockSendDirectSupportMessage.mockResolvedValue(undefined);
    mockSafeAiReply.mockResolvedValue({
      text: "Nefesini duzenle, 10 dakika ertele ve burada kal.",
      flags: {
        crisis: false,
        selfHarm: false,
        medical: false,
        illegal: false,
        gamblingTrigger: false,
      },
    });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it("redirects landing to username screen when username is missing", async () => {
    mockGetStoredUsername.mockResolvedValueOnce(null);
    render(<CommunityLandingScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: "/community/username",
        params: { next: "/community/rooms" },
      });
    });
  });

  it("redirects rooms to username screen when username is missing", async () => {
    mockGetStoredUsername.mockResolvedValueOnce(null);
    render(<CommunityRoomsScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: "/community/username",
        params: { next: "/community/rooms" },
      });
    });
  });
  it("hides sohbet, gunluk and dinleme rooms from chat list", async () => {
    const screen = render(<CommunityRoomsScreen />);

    await waitFor(() => {
      expect(mockListenToRoomOnlineCount).toHaveBeenCalledTimes(3);
    });

    expect(mockListenToRoomOnlineCount).toHaveBeenCalledWith(
      "kumar",
      expect.any(Function)
    );
    expect(mockListenToRoomOnlineCount).toHaveBeenCalledWith(
      "finans",
      expect.any(Function)
    );
    expect(mockListenToRoomOnlineCount).toHaveBeenCalledWith(
      "motivasyon",
      expect.any(Function)
    );

    expect(screen.getByText("Kumar")).toBeTruthy();
    expect(screen.getByText("Finans")).toBeTruthy();
    expect(screen.getByText("Motivasyon")).toBeTruthy();

    expect(screen.queryByText("Sohbet")).toBeNull();
    expect(screen.queryByText("Gunluk")).toBeNull();
    expect(screen.queryByText("Dinleme")).toBeNull();
  });

  it("saves normalized username and continues to requested community route", async () => {
    mockSearchParams = { next: "/community/room/kriz" };

    const screen = render(<CommunityUsernameScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Kullanici adin")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Kullanici adin"), "   ali    veli   ");
    fireEvent.press(screen.getByText("Sohbete Devam Et"));

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "ali veli",
        })
      );
      expect(mockRouterReplace).toHaveBeenCalledWith("/community/room/kriz");
    });
  });

  it("redirects room screen to username capture when username is missing", async () => {
    mockGetStoredUsername.mockResolvedValueOnce(null);
    mockSearchParams = { id: "kriz" };

    render(<CommunityRoomScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: "/community/username",
        params: { next: "/community/room/kriz" },
      });
    });
  });

  it("sends room message with required username", async () => {
    mockGetStoredUsername.mockResolvedValueOnce("ali_veli");
    mockSearchParams = { id: "kriz" };

    const screen = render(<CommunityRoomScreen />);

    await waitFor(() => {
      expect(mockJoinRoomPresence).toHaveBeenCalled();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Mesaj yaz..."), "Merhaba topluluk");
    const sendLabels = screen.getAllByText("Gonder");
    fireEvent.press(sendLabels[sendLabels.length - 1]);

    await waitFor(() => {
      expect(mockSendRoomMessage).toHaveBeenCalledWith(
        "kriz",
        "uid-local-1",
        "ali_veli",
        "Merhaba topluluk"
      );
    });
  });

  it("sends ChatGPT-4 room reply after user message", async () => {
    mockGetStoredUsername.mockResolvedValueOnce("ali_veli");
    mockSearchParams = { id: "kriz" };
    mockSafeAiReply.mockResolvedValueOnce({
      text: "Su an burada kal. 10 dakika erteleme plani uygula.",
      flags: {
        crisis: false,
        selfHarm: false,
        medical: false,
        illegal: false,
        gamblingTrigger: true,
      },
    });

    const screen = render(<CommunityRoomScreen />);

    await waitFor(() => {
      expect(mockJoinRoomPresence).toHaveBeenCalled();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Mesaj yaz..."), "Durtum artti");
    const sendLabels = screen.getAllByText("Gonder");
    fireEvent.press(sendLabels[sendLabels.length - 1]);

    await waitFor(() => {
      expect(mockSafeAiReply).toHaveBeenCalledWith("Durtum artti", { locale: "tr" });
    });

    await waitFor(() => {
      expect(mockSendRoomMessage).toHaveBeenCalledWith(
        "kriz",
        "community_ai_gpt4_bot",
        "ChatGPT-4",
        "Su an burada kal. 10 dakika erteleme plani uygula."
      );
    });
  });

  it("keeps message input editable while sending is in progress", async () => {
    mockGetStoredUsername.mockResolvedValueOnce("ali_veli");
    mockSearchParams = { id: "kriz" };

    let resolveSend: () => void = () => {};
    mockSendRoomMessage.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolveSend = () => resolve();
      })
    );

    const screen = render(<CommunityRoomScreen />);

    await waitFor(() => {
      expect(mockJoinRoomPresence).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText("Mesaj yaz...");
    fireEvent.changeText(input, "Ilk mesaj");
    const sendLabels = screen.getAllByText("Gonder");
    fireEvent.press(sendLabels[sendLabels.length - 1]);

    await waitFor(() => {
      expect(mockSendRoomMessage).toHaveBeenCalledWith(
        "kriz",
        "uid-local-1",
        "ali_veli",
        "Ilk mesaj"
      );
    });

    const pendingInput = screen.getByPlaceholderText("Mesaj yaz...");
    expect(pendingInput.props.editable ?? true).toBe(true);

    fireEvent.changeText(pendingInput, "Ikinci mesaj");
    expect(screen.getByDisplayValue("Ikinci mesaj")).toBeTruthy();

    resolveSend();
  });

  it("allows sending while room presence is still connecting", async () => {
    mockGetStoredUsername.mockResolvedValueOnce("ali_veli");
    mockSearchParams = { id: "kriz" };
    mockJoinRoomPresence.mockImplementationOnce(
      () => new Promise<() => Promise<void>>(() => {})
    );

    const screen = render(<CommunityRoomScreen />);

    const input = await waitFor(() => screen.getByPlaceholderText("Mesaj yaz..."));
    expect(input.props.editable ?? true).toBe(true);

    fireEvent.changeText(input, "Baglanti beklenirken yazi");
    expect(screen.getByDisplayValue("Baglanti beklenirken yazi")).toBeTruthy();

    const sendLabels = screen.getAllByText("Gonder");
    fireEvent.press(sendLabels[sendLabels.length - 1]);

    await waitFor(() => {
      expect(mockSendRoomMessage).toHaveBeenCalledWith(
        "kriz",
        "uid-local-1",
        "ali_veli",
        "Baglanti beklenirken yazi"
      );
    });
  });
});

