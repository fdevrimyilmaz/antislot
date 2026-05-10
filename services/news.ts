export type NewsSource = "sondakika" | "milliyet";

export type NewsItem = {
  id: string;
  source: NewsSource;
  sourceLabel: string;
  title: string;
  description?: string;
  url: string;
};

const SOURCES = {
  sondakika: "https://www.sondakika.com/kumar/",
  milliyet: "https://www.milliyet.com.tr/haberleri/sanal-kumar",
} as const;

const REQUEST_TIMEOUT_MS = 12000;
const MAX_ITEMS_PER_SOURCE = 8;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

async function fetchHtml(url: string): Promise<string> {
  const response = await withTimeout(
    fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
      },
    }),
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`news_fetch_failed:${response.status}`);
  }
  return response.text();
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanText(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(raw: string, base: string): string {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) {
    const origin = new URL(base).origin;
    return `${origin}${raw}`;
  }
  return "";
}

function extractMetaContent(html: string, key: string): string | null {
  const metaRegex = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];
    const keyMatch = tag.match(/\b(?:name|property)\s*=\s*(["'])(.*?)\1/i);
    if (!keyMatch) continue;
    const attrKey = keyMatch[2]?.trim().toLowerCase();
    if (attrKey !== key.toLowerCase()) continue;
    const contentMatch = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!contentMatch) continue;
    const value = cleanText(contentMatch[2] ?? "");
    if (value) return value;
  }

  return null;
}

function extractLdJsonBlocks(html: string): string[] {
  return [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => (match[1] ?? "").trim())
    .filter(Boolean);
}

function uniqueByUrl(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const output: NewsItem[] = [];
  for (const item of items) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    output.push(item);
  }
  return output;
}

function isLikelyMilliyetArticle(url: string): boolean {
  if (!url.startsWith("https://www.milliyet.com.tr/")) return false;
  if (url.includes("/haberleri/")) return false;
  return /\-\d+\/?$/.test(url);
}

function isRelevantMilliyetTitle(title: string, url: string): boolean {
  const haystack = `${title} ${url}`.toLowerCase();
  return haystack.includes("kumar") || haystack.includes("bahis") || haystack.includes("sanal");
}

async function fetchSondakikaNews(): Promise<NewsItem[]> {
  const listHtml = await fetchHtml(SOURCES.sondakika);
  const ldBlocks = extractLdJsonBlocks(listHtml);
  const itemListBlock = ldBlocks.find((block) => block.toLowerCase().includes("itemlist"));
  if (!itemListBlock) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(itemListBlock);
  } catch {
    return [];
  }

  const rawItems = parsed?.itemListElement ?? parsed?.itemlistelement ?? [];
  const urls: string[] = Array.isArray(rawItems)
    ? rawItems
        .map((item: any) => (typeof item?.url === "string" ? item.url : ""))
        .filter(Boolean)
        .slice(0, MAX_ITEMS_PER_SOURCE)
    : [];

  const results = await Promise.all(
    urls.map(async (articleUrl, index) => {
      try {
        const articleHtml = await fetchHtml(articleUrl);
        const title =
          extractMetaContent(articleHtml, "og:title") ||
          extractMetaContent(articleHtml, "twitter:title") ||
          extractMetaContent(articleHtml, "title") ||
          cleanText(articleHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
        const description =
          extractMetaContent(articleHtml, "description") ||
          extractMetaContent(articleHtml, "og:description") ||
          undefined;

        if (!title) return null;

        return {
          id: `sondakika-${index}-${articleUrl}`,
          source: "sondakika" as const,
          sourceLabel: "SonDakika",
          title,
          description,
          url: articleUrl,
        };
      } catch {
        return null;
      }
    })
  );

  const validResults = results.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );
  return uniqueByUrl(validResults);
}

async function fetchMilliyetNews(): Promise<NewsItem[]> {
  const html = await fetchHtml(SOURCES.milliyet);
  const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi;
  const collected: NewsItem[] = [];

  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = normalizeUrl(match[1] ?? "", SOURCES.milliyet);
    if (!isLikelyMilliyetArticle(href)) continue;

    const title = cleanText(match[2] ?? "");
    if (title.length < 20) continue;
    if (!isRelevantMilliyetTitle(title, href)) continue;

    collected.push({
      id: `milliyet-${href}`,
      source: "milliyet",
      sourceLabel: "Milliyet",
      title,
      url: href,
    });

    if (collected.length >= MAX_ITEMS_PER_SOURCE * 2) {
      break;
    }
  }

  return uniqueByUrl(collected).slice(0, MAX_ITEMS_PER_SOURCE);
}

export async function fetchGamblingNewsBySource(): Promise<{
  sondakika: NewsItem[];
  milliyet: NewsItem[];
}> {
  const [sondakika, milliyet] = await Promise.allSettled([
    fetchSondakikaNews(),
    fetchMilliyetNews(),
  ]);

  return {
    sondakika: sondakika.status === "fulfilled" ? sondakika.value : [],
    milliyet: milliyet.status === "fulfilled" ? milliyet.value : [],
  };
}
