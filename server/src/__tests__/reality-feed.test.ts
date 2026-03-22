import { __testables } from "../reality-feed";

describe("reality-feed helpers", () => {
  it("parses RSS items and extracts fields", () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title><![CDATA[ Court sentences manager in gambling fraud case ]]></title>
            <description><![CDATA[<p>Major fraud and debt harms were reported.</p>]]></description>
            <link>https://example.com/story-1</link>
            <pubDate>Tue, 24 Feb 2026 10:20:00 GMT</pubDate>
            <source url="https://example.com">Example Source</source>
          </item>
        </channel>
      </rss>
    `;

    const rows = __testables.parseRssXml(xml, "Fallback Source");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Court sentences manager in gambling fraud case");
    expect(rows[0]?.source).toBe("Example Source");
    expect(rows[0]?.url).toBe("https://example.com/story-1");
    expect(rows[0]?.summary).toBe("Major fraud and debt harms were reported.");
  });

  it("normalizes feed item classification and tags", () => {
    const item = __testables.toFeedItem({
      title: "Judge sentences executive after gambling-linked embezzlement",
      summary: "Court filing includes prison term and debt spiral details.",
      source: "Court News",
      url: "https://example.com/story-2",
      date: "Tue, 24 Feb 2026 10:20:00 GMT",
    });

    expect(item.type).toBe("court");
    expect(item.impact).toBe("high");
    expect(item.tags).toEqual(expect.arrayContaining(["court", "sentence", "fraud", "debt"]));
    expect(item.date).toContain("2026");
  });

  it("dedupes repeated feed items", () => {
    const sample = [
      {
        id: "1",
        type: "news" as const,
        impact: "moderate" as const,
        date: "2026-02-24T10:20:00.000Z",
        source: "A",
        title: "A story",
        summary: "Text",
        url: "https://example.com/story",
        tags: [],
      },
      {
        id: "2",
        type: "news" as const,
        impact: "moderate" as const,
        date: "2026-02-24T10:20:00.000Z",
        source: "A",
        title: "A story",
        summary: "Text",
        url: "https://example.com/story",
        tags: [],
      },
    ];

    const unique = __testables.dedupeItems(sample);
    expect(unique).toHaveLength(1);
  });

  it("keeps only gambling-related content", () => {
    expect(
      __testables.isGamblingRelatedText(
        "Court filing highlights gambling disorder and debt escalation."
      )
    ).toBe(true);

    expect(
      __testables.isGamblingRelatedText(
        "Local traffic update and weather warning for downtown roads."
      )
    ).toBe(false);

    expect(
      __testables.isGamblingCandidate({
        title: "Court publishes annual logistics report",
        summary: "The document focuses on transport and infrastructure operations.",
        source: "Example Court",
        url: "https://example.com/gambling-keyword-in-url-only",
        date: "Tue, 24 Feb 2026 10:20:00 GMT",
      })
    ).toBe(false);
  });
});
