describe("AI provider selection", () => {
  it("uses Gemini provider for /v1/ai/chat when configured", async () => {
    jest.resetModules();

    Object.assign(process.env, {
      NODE_ENV: "test",
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-test-key",
      OPENAI_API_KEY: "",
    });

    const originalFetch = global.fetch;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        modelVersion: "gemini-2.0-flash",
        candidates: [
          {
            content: {
              parts: [{ text: "Gemini backend reply" }],
            },
          },
        ],
      }),
    });
     
    (global as any).fetch = mockFetch;

    try {
      const { fastify } = await import("../server");
      const response = await fastify.inject({
        method: "POST",
        url: "/v1/ai/chat",
        payload: {
          message: "Merhaba",
          history: [],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reply).toBe("Gemini backend reply");
      expect(body.model).toBe("gemini-2.0-flash");
      expect(mockFetch).toHaveBeenCalled();
      expect(String(mockFetch.mock.calls[0]?.[0] ?? "")).toContain(":generateContent?key=");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
