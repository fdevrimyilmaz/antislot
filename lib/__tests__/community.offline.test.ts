import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@/lib/firebase", () => ({
  auth: null,
  rtdb: null,
}));

jest.mock("@/services/auth", () => ({
  anonymousLogin: jest.fn(),
}));

jest.mock("@/lib/logOnce", () => ({
  logOnce: jest.fn(),
}));

jest.mock("firebase/database", () => ({
  limitToLast: jest.fn(),
  onDisconnect: jest.fn(() => ({
    remove: jest.fn(),
    cancel: jest.fn(),
  })),
  onValue: jest.fn(() => jest.fn()),
  orderByChild: jest.fn(),
  push: jest.fn(() => ({ key: "local-message" })),
  query: jest.fn(),
  ref: jest.fn(),
  remove: jest.fn(),
  set: jest.fn(),
}));

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const loadCommunity = (): typeof import("@/lib/community") =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/community");

describe("community offline mode", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.resetModules();
  });

  it("creates and reuses local anonymous user id", async () => {
    const community = loadCommunity();

    const uid1 = await community.ensureAnonymousUser();
    const uid2 = await community.ensureAnonymousUser();

    expect(uid1).toMatch(/^local_/);
    expect(uid2).toBe(uid1);
  });

  it("delivers local room messages in offline mode", async () => {
    const community = loadCommunity();
    const updates: { userId: string; username: string; text: string }[][] = [];

    const unsubscribe = community.listenToRoomMessages("kriz", (messages) => {
      updates.push(messages as { userId: string; username: string; text: string }[]);
    });

    await community.sendRoomMessage("kriz", "u-local", "deneme_user", "Cok gerildim");
    await flush();

    const latest = updates[updates.length - 1] ?? [];
    expect(latest).toHaveLength(1);
    expect(latest[0]?.userId).toBe("u-local");
    expect(latest[0]?.username).toBe("deneme_user");
    expect(latest[0]?.text).toBe("Cok gerildim");

    unsubscribe();
  });

  it("supports offline direct support thread replies", async () => {
    const community = loadCommunity();
    const updates: { userId: string; username: string; text: string }[][] = [];

    const unsubscribe = community.listenToDirectSupportMessages("u-local", "agent-local", (messages) => {
      updates.push(messages as { userId: string; username: string; text: string }[]);
    });

    await community.sendDirectSupportMessage(
      "u-local",
      "agent-local",
      "u-local",
      "deneme_user",
      "Yalniz hissediyorum"
    );
    await flush();

    const latest = updates[updates.length - 1] ?? [];
    expect(latest.some((message) => message.userId === "u-local")).toBe(true);
    expect(latest.some((message) => message.userId === "u-local" && message.username === "deneme_user")).toBe(true);
    expect(latest.some((message) => message.userId === "agent-local")).toBe(true);

    unsubscribe();
  });

  it("blocks sending when username is missing", async () => {
    const community = loadCommunity();
    const updates: { userId: string; username: string; text: string }[][] = [];

    const unsubscribe = community.listenToRoomMessages("kriz", (messages) => {
      updates.push(messages as { userId: string; username: string; text: string }[]);
    });

    await community.sendRoomMessage("kriz", "u-local", "", "Deneme");
    await flush();

    const latest = updates[updates.length - 1] ?? [];
    expect(latest.some((message) => message.userId === "u-local")).toBe(false);

    unsubscribe();
  });

  it("keeps room presence flow active in offline mode", async () => {
    const community = loadCommunity();
    const counts: number[] = [];

    const unsubscribe = community.listenToRoomOnlineCount("kriz", (count) => {
      counts.push(count);
    });

    const leave = await community.joinRoomPresence("kriz", "u-local");
    await flush();
    await leave();
    await flush();

    expect(counts.length).toBeGreaterThan(1);
    expect(counts[counts.length - 1]).toBeGreaterThanOrEqual(1);

    unsubscribe();
  });

  it("blocks unsafe tactic style messages", async () => {
    const community = loadCommunity();

    await expect(
      community.sendRoomMessage(
        "kriz",
        "u-local",
        "deneme_user",
        "Bana bahis kupon taktigi ver ve oran paylas."
      )
    ).rejects.toMatchObject({ code: "community_message_blocked" });
  });

  it("blocks duplicate messages sent too quickly", async () => {
    const community = loadCommunity();

    await community.sendRoomMessage("kriz", "u-local", "deneme_user", "Ayni metin testi");
    await expect(
      community.sendRoomMessage("kriz", "u-local", "deneme_user", "Ayni metin testi")
    ).rejects.toMatchObject({ code: "community_duplicate_message" });
  });

  it("rate limits burst message sending per user", async () => {
    const community = loadCommunity();

    for (let i = 0; i < 6; i += 1) {
      await community.sendRoomMessage("kriz", "u-local", "deneme_user", `Mesaj ${i}`);
    }

    await expect(
      community.sendRoomMessage("kriz", "u-local", "deneme_user", "Mesaj 7")
    ).rejects.toMatchObject({ code: "community_rate_limited" });
  });
});
