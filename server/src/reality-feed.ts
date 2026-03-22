import { createHash } from "crypto";

export type RealityFeedItem = {
  id: string;
  type: "news" | "court";
  impact: "high" | "moderate";
  date: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
};

export type RealityFeedResult = {
  source: "live" | "fallback";
  generatedAt: number;
  items: RealityFeedItem[];
};

type RssCandidate = {
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
};

type RssSource = {
  url: string;
  fallbackSource: string;
};

const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ITEMS = 14;

const RSS_SOURCES: RssSource[] = [
  {
    url: "https://news.google.com/rss/search?q=gambling+addiction+crime+court&hl=en-US&gl=US&ceid=US:en",
    fallbackSource: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=gambling+regulation+warning&hl=en-US&gl=US&ceid=US:en",
    fallbackSource: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=problem+gambling+financial+harm&hl=en-US&gl=US&ceid=US:en",
    fallbackSource: "Google News",
  },
];

const COURT_KEYWORDS = [
  "court",
  "judge",
  "sentenc",
  "tribunal",
  "lawsuit",
  "charged",
  "indict",
  "convict",
  "prosecut",
  "attorney",
  "fraud",
  "embezz",
];

const GAMBLING_KEYWORDS = [
  "gambl",
  "casino",
  "betting",
  "sportsbook",
  "bookmaker",
  "wager",
  "slot",
  "poker",
  "roulette",
  "blackjack",
  "lottery",
  "problem gambling",
  "gambling disorder",
];

const HIGH_IMPACT_KEYWORDS = [
  "suicide",
  "death",
  "fatal",
  "prison",
  "jailed",
  "sentenc",
  "fraud",
  "embezz",
  "bankrupt",
  "debt",
  "addiction",
  "relapse",
  "harm",
];

const TAG_RULES: Array<{ match: string; tag: string }> = [
  { match: "court", tag: "court" },
  { match: "sentenc", tag: "sentence" },
  { match: "fraud", tag: "fraud" },
  { match: "embezz", tag: "fraud" },
  { match: "debt", tag: "debt" },
  { match: "bankrupt", tag: "bankruptcy" },
  { match: "addiction", tag: "addiction" },
  { match: "regulat", tag: "regulation" },
  { match: "harm", tag: "harm" },
];

const FALLBACK_ITEMS: RealityFeedItem[] = [
  {
    id: "fallback-judiciary-2026-01-13",
    type: "court",
    impact: "high",
    date: "2026-01-13",
    source: "UK Courts and Tribunals Judiciary",
    title: "Coroner record: link between gambling disorder and fatal risk",
    summary:
      "A judiciary prevention report highlights severe harm risks linked with gambling disorder and calls for systemic safeguards.",
    url: "https://www.judiciary.uk/prevention-of-future-death-reports/oliver-long-prevention-of-future-deaths-report/",
    tags: ["fatal risk", "prevention", "judiciary"],
  },
  {
    id: "fallback-doj-2025-10-09",
    type: "court",
    impact: "high",
    date: "2025-10-09",
    source: "U.S. Department of Justice",
    title: "Official release: major embezzlement and tax crimes",
    summary:
      "The release outlines prison sentencing and restitution in a casino-linked financial crime case.",
    url: "https://www.justice.gov/usao-edok/pr/former-casino-accounts-payable-manager-sentenced-embezzlement-and-tax-fraud",
    tags: ["prison", "financial crime", "official source"],
  },
  {
    id: "fallback-itv-2024-09-04",
    type: "news",
    impact: "moderate",
    date: "2024-09-04",
    source: "ITV News Anglia",
    title: "Care home manager case: misuse of funds from vulnerable people",
    summary:
      "The report links gambling debt pressure with fraud targeting vulnerable residents in care settings.",
    url: "https://www.itv.com/news/anglia/2024-09-04/gambling-care-home-boss-stole-250k-from-vulnerable-residents",
    tags: ["vulnerable people", "fraud", "debt"],
  },
];

const cache: {
  expiresAt: number;
  value: RealityFeedResult | null;
  inFlight: Promise<RealityFeedResult> | null;
} = {
  expiresAt: 0,
  value: null,
  inFlight: null,
};

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_full, token: string) => {
    if (token.startsWith("#x") || token.startsWith("#X")) {
      const code = Number.parseInt(token.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    }
    if (token.startsWith("#")) {
      const code = Number.parseInt(token.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    }
    return ENTITY_MAP[token] ?? "";
  });
}

function stripHtml(input: string): string {
  return collapseWhitespace(
    decodeEntities(
      input
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function extractTag(itemXml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const match = regex.exec(itemXml);
  return match?.[1] ? stripHtml(match[1]) : "";
}

function parseRssXml(xml: string, fallbackSource: string): RssCandidate[] {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const rows: RssCandidate[] = [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, "title");
    const summary = extractTag(itemXml, "description");
    const url = extractTag(itemXml, "link");
    const date = extractTag(itemXml, "pubDate");
    const source = extractTag(itemXml, "source") || fallbackSource;

    if (!title || !url) continue;

    rows.push({
      title: collapseWhitespace(title),
      summary: collapseWhitespace(summary),
      source: collapseWhitespace(source) || fallbackSource,
      url: collapseWhitespace(url),
      date: collapseWhitespace(date),
    });
  }

  return rows;
}

function truncateSummary(value: string, max = 240): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}...`;
}

function parsePublishedDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function buildTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = TAG_RULES.filter((rule) => lower.includes(rule.match)).map((rule) => rule.tag);
  const unique = [...new Set(tags)];
  return unique.slice(0, 4);
}

function isGamblingRelatedText(text: string): boolean {
  const lower = text.toLowerCase();
  return GAMBLING_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isGamblingCandidate(candidate: RssCandidate): boolean {
  return isGamblingRelatedText(`${candidate.title} ${candidate.summary}`);
}

function isGamblingFeedItem(item: RealityFeedItem): boolean {
  return isGamblingRelatedText(`${item.title} ${item.summary}`);
}

function toFeedItem(candidate: RssCandidate): RealityFeedItem {
  const summary = truncateSummary(candidate.summary || candidate.title);
  const searchable = `${candidate.title} ${summary}`.toLowerCase();
  const type = COURT_KEYWORDS.some((term) => searchable.includes(term)) ? "court" : "news";
  const impact = HIGH_IMPACT_KEYWORDS.some((term) => searchable.includes(term)) ? "high" : "moderate";

  return {
    id: createHash("sha1").update(`${candidate.url}|${candidate.title}`).digest("hex").slice(0, 16),
    type,
    impact,
    date: parsePublishedDate(candidate.date),
    source: candidate.source,
    title: candidate.title,
    summary,
    url: candidate.url,
    tags: buildTags(searchable),
  };
}

function dedupeItems(items: RealityFeedItem[]): RealityFeedItem[] {
  const seen = new Set<string>();
  const unique: RealityFeedItem[] = [];

  for (const item of items) {
    const dedupeKey = `${item.url}|${item.title}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    unique.push(item);
  }

  return unique;
}

async function fetchRssSource(source: RssSource): Promise<RssCandidate[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(source.url, {
      method: "GET",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRssXml(xml, source.fallbackSource);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function buildRealityFeed(): Promise<RealityFeedResult> {
  const settled = await Promise.allSettled(RSS_SOURCES.map((source) => fetchRssSource(source)));
  const candidates = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter(isGamblingCandidate);
  const liveItems = dedupeItems(candidates.map(toFeedItem))
    .filter(isGamblingFeedItem)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, MAX_ITEMS);

  if (liveItems.length > 0) {
    return {
      source: "live",
      generatedAt: Date.now(),
      items: liveItems,
    };
  }

  return {
    source: "fallback",
    generatedAt: Date.now(),
    items: FALLBACK_ITEMS.filter(isGamblingFeedItem),
  };
}

export async function getRealityFeed(force = false): Promise<RealityFeedResult> {
  if (!force && cache.value && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  if (cache.inFlight) {
    return cache.inFlight;
  }

  cache.inFlight = buildRealityFeed()
    .then((result) => {
      cache.value = result;
      cache.expiresAt = Date.now() + CACHE_TTL_MS;
      return result;
    })
    .finally(() => {
      cache.inFlight = null;
    });

  return cache.inFlight;
}

export const __testables = {
  parseRssXml,
  toFeedItem,
  dedupeItems,
  stripHtml,
  buildTags,
  isGamblingRelatedText,
  isGamblingCandidate,
  isGamblingFeedItem,
};
