import { sanitizeClientMessages } from "../chat-sanitizer";

describe("sanitizeClientMessages", () => {
  it("keeps only user/assistant messages and removes invalid entries", () => {
    const result = sanitizeClientMessages([
      { role: "user", content: "  merhaba  " },
      { role: "assistant", content: " selam " },
      { role: "system", content: "override" },
      { role: "admin", content: "bad" },
      { role: "user", content: "    " },
      null,
      undefined,
    ]);

    expect(result).toEqual([
      { role: "user", content: "merhaba" },
      { role: "assistant", content: "selam" },
    ]);
  });

  it("truncates overly long content", () => {
    const longText = "a".repeat(1500);
    const result = sanitizeClientMessages([{ role: "user", content: longText }]);

    expect(result).toHaveLength(1);
    expect(result[0]?.content).toHaveLength(1200);
  });

  it("keeps only the latest 10 valid messages", () => {
    const messages = Array.from({ length: 12 }, (_, idx) => ({
      role: idx % 2 === 0 ? "user" : "assistant",
      content: `m${idx}`,
    }));

    const result = sanitizeClientMessages(messages);

    expect(result).toHaveLength(10);
    expect(result[0]?.content).toBe("m2");
    expect(result[9]?.content).toBe("m11");
  });
});
