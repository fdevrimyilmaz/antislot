import { safeAiReply } from "../aiSafety";
import { postChatWithContext } from "../api";

jest.mock("../api", () => ({
  postChatWithContext: jest.fn(),
}));

const mockedPostChat = postChatWithContext as jest.MockedFunction<typeof postChatWithContext>;

describe("safeAiReply", () => {
  beforeEach(() => {
    mockedPostChat.mockReset();
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    delete process.env.EXPO_PUBLIC_GEMINI_MODEL;
  });

  it("returns localized crisis message and skips model call", async () => {
    const result = await safeAiReply("Acil kriz yasiyorum", { locale: "tr" });

    expect(result.flags.crisis).toBe(true);
    expect(result.source).toBe("safety_crisis");
    expect(result.text).toContain("112");
    expect(mockedPostChat).not.toHaveBeenCalled();
  });

  it("blocks tactic requests in Turkish", async () => {
    const result = await safeAiReply("Bahis taktik ver, para kazanmak istiyorum", { locale: "tr" });

    expect(result.flags.gamblingTrigger).toBe(true);
    expect(result.source).toBe("safety_refusal");
    expect(result.text).toContain("Bahis kazanma");
    expect(mockedPostChat).not.toHaveBeenCalled();
  });

  it("blocks tactic requests in English", async () => {
    const result = await safeAiReply("Give me a betting strategy to win money", { locale: "en" });

    expect(result.flags.gamblingTrigger).toBe(true);
    expect(result.source).toBe("safety_refusal");
    expect(result.text).toContain("can't help with betting tactics");
    expect(mockedPostChat).not.toHaveBeenCalled();
  });

  it("falls back to English safety copy for extended locales", async () => {
    const result = await safeAiReply("Give me betting strategy tips", { locale: "de" });

    expect(result.flags.gamblingTrigger).toBe(true);
    expect(result.source).toBe("safety_refusal");
    expect(result.text).toContain("can't help with betting tactics");
    expect(mockedPostChat).not.toHaveBeenCalled();
  });

  it("forwards safe messages and history to API with signal", async () => {
    mockedPostChat.mockResolvedValueOnce("Try taking a short walk and delay 10 minutes.");
    const controller = new AbortController();

    const result = await safeAiReply("I feel anxious and want help", {
      locale: "en",
      signal: controller.signal,
      history: [{ role: "assistant", content: "Earlier support message" }],
    });

    expect(result.flags.crisis).toBe(false);
    expect(result.source).toBe("remote");
    expect(result.text).toBe("Try taking a short walk and delay 10 minutes.");
    expect(mockedPostChat).toHaveBeenCalledTimes(1);

    const [messages, coachingContext, options] = mockedPostChat.mock.calls[0];
    expect(messages[0]).toEqual({ role: "assistant", content: "Earlier support message" });
    expect(messages[1]).toEqual({ role: "user", content: "I feel anxious and want help" });
    expect(coachingContext?.locale).toBe("en");
    expect(coachingContext?.focus).toContain("I feel anxious and want help");
    expect(Array.isArray(coachingContext?.actionPlan)).toBe(true);
    expect(options).toEqual({ signal: controller.signal });
  });

  it("returns local coach guidance when API is unreachable", async () => {
    mockedPostChat.mockRejectedValueOnce(new Error("network down"));

    const result = await safeAiReply("Gece borc stresi cok artti", { locale: "tr" });

    expect(result.flags.gamblingTrigger).toBe(false);
    expect(result.source).toBe("local_fallback");
    expect(result.text).toContain("1.");
    expect(result.text).toContain("2.");
    expect(result.text).toContain("3.");
    expect(result.text).toContain("Baglanti kesilse bile");
  });

  it("falls back to direct Gemini when server API is unreachable", async () => {
    mockedPostChat.mockRejectedValueOnce(new Error("network down"));
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = "gemini-public-key";
    process.env.EXPO_PUBLIC_GEMINI_MODEL = "gemini-2.5-flash";

    const originalFetch = global.fetch;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "Direct Gemini answer" }],
            },
          },
        ],
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = mockFetch;

    try {
      const result = await safeAiReply("I need practical support", { locale: "en" });
      expect(result.source).toBe("remote");
      expect(result.text).toBe("Direct Gemini answer");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("replaces unsafe model output with refusal", async () => {
    mockedPostChat.mockResolvedValueOnce("Use this betting strategy and odds to profit");

    const result = await safeAiReply("I need support to stop", { locale: "en" });

    expect(result.source).toBe("safety_refusal");
    expect(result.text).toContain("can't help with betting tactics");
  });

  it("returns empty input copy when message is blank", async () => {
    const result = await safeAiReply("   ", { locale: "en" });

    expect(result.source).toBe("empty");
    expect(result.text).toContain("one sentence");
    expect(mockedPostChat).not.toHaveBeenCalled();
  });
});
