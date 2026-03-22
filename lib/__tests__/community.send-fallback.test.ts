import AsyncStorage from "@react-native-async-storage/async-storage";

const mockSet = jest.fn();
const mockPush = jest.fn();
const mockRef = jest.fn((_database: unknown, path: string) => ({ path }));
const mockOnDisconnectRemove = jest.fn(async () => undefined);
const mockOnDisconnect = jest.fn((_reference?: unknown) => ({
  remove: mockOnDisconnectRemove,
  cancel: jest.fn(async () => undefined),
}));

jest.mock("@/lib/firebase", () => ({
  auth: null,
  rtdb: {},
}));

jest.mock("@/services/auth", () => ({
  anonymousLogin: jest.fn(),
}));

jest.mock("@/lib/logOnce", () => ({
  logOnce: jest.fn(),
}));

jest.mock("firebase/database", () => ({
  limitToLast: jest.fn(),
  onDisconnect: (reference: unknown) => mockOnDisconnect(reference),
  onValue: jest.fn(() => jest.fn()),
  orderByChild: jest.fn(),
  push: (reference: unknown, value?: unknown) => mockPush(reference, value),
  query: jest.fn(),
  ref: (database: unknown, path: string) => mockRef(database, path),
  remove: jest.fn(),
  set: (reference: unknown, value: unknown) => mockSet(reference, value),
}));

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const loadCommunity = (): typeof import("@/lib/community") =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/community");

describe("community send fallback", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.resetModules();
    mockSet.mockReset();
    mockPush.mockReset();
    mockRef.mockClear();
    mockOnDisconnect.mockClear();
    mockOnDisconnectRemove.mockClear();

    mockPush.mockImplementation(() => ({ key: "remote-message" }));
  });

  it("falls back to local mode when remote room write rejects", async () => {
    const community = loadCommunity();
    mockSet.mockRejectedValue(new Error("permission-denied"));

    await expect(
      community.sendRoomMessage("kriz", "u-room", "deneme_user", "Merhaba")
    ).resolves.toBeUndefined();

    const updates: Array<Array<{ userId: string; text: string }>> = [];
    const unsubscribe = community.listenToRoomMessages("kriz", (messages) => {
      updates.push(messages as Array<{ userId: string; text: string }>);
    });

    await flush();
    await flush();

    const latest = updates[updates.length - 1] ?? [];
    expect(latest.some((message) => message.userId === "u-room" && message.text === "Merhaba")).toBe(true);
    expect(mockSet).toHaveBeenCalled();

    unsubscribe();
  });

  it("falls back to local mode when push throws synchronously", async () => {
    const community = loadCommunity();
    mockPush.mockImplementation(() => {
      throw new Error("push-failed");
    });
    mockSet.mockResolvedValue(undefined);

    await expect(
      community.sendRoomMessage("kriz", "u-room", "deneme_user", "Sync fail test")
    ).resolves.toBeUndefined();

    const updates: Array<Array<{ userId: string; text: string }>> = [];
    const unsubscribe = community.listenToRoomMessages("kriz", (messages) => {
      updates.push(messages as Array<{ userId: string; text: string }>);
    });

    await flush();
    await flush();

    const latest = updates[updates.length - 1] ?? [];
    expect(latest.some((message) => message.userId === "u-room" && message.text === "Sync fail test")).toBe(
      true
    );
    expect(mockPush).toHaveBeenCalled();

    unsubscribe();
  });
});
