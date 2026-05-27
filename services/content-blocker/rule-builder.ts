/**
 * Convert the blocklist domain set into Safari Content Blocker rules.
 *
 * Safari accepts up to 150,000 rules per content blocker, well above any
 * realistic gambling-domain list. Each rule is { trigger, action }.
 *
 * For each domain we emit a single block rule that covers the apex domain
 * AND every subdomain. The `*` prefix on `if-domain` is Apple's documented
 * shorthand for "this domain or any subdomain of it" — preferred over a
 * regex because:
 *   - The matcher is hash-keyed, faster than running a regex per request.
 *   - The rule shows up cleanly in `Settings → Safari → Content Blockers`.
 *
 * https://developer.apple.com/documentation/safariservices/creating_a_content_blocker
 */

import type { BlocklistPattern } from "@/services/gambling-blocker/domain-matcher";

export interface ContentBlockerRule {
  trigger: {
    "url-filter": string;
    "if-domain"?: string[];
    "unless-domain"?: string[];
  };
  action: {
    type: "block" | "ignore-previous-rules";
  };
}

const APPLE_MAX_RULES = 150_000;
const APPLE_MAX_DOMAINS_PER_RULE = 200;

/**
 * Build the Content Blocker rule list from the canonical blocklist.
 *
 * @param domains  Plain domain list as synced from the backend.
 * @param whitelist  User's allow-list — emitted as `ignore-previous-rules`
 *                   rules AFTER the block rules so they override matches.
 * @param patterns  Pattern-based entries from the blocklist. Only the
 *                   `regex` and `contains` types translate cleanly; others
 *                   are skipped (the in-app domain checker still uses them).
 */
export function buildContentBlockerRules(
  domains: string[],
  whitelist: string[] = [],
  patterns: BlocklistPattern[] = []
): ContentBlockerRule[] {
  const rules: ContentBlockerRule[] = [];
  const normalizedDomains = dedupe(domains.map(normalizeDomain).filter(Boolean));
  const normalizedWhitelist = dedupe(whitelist.map(normalizeDomain).filter(Boolean));

  // Group block rules in chunks of 200 if-domain entries each — Apple's
  // documented per-rule cap. Real-world list will be small; chunking is
  // belt-and-suspenders for when the community list grows.
  for (let i = 0; i < normalizedDomains.length; i += APPLE_MAX_DOMAINS_PER_RULE) {
    const chunk = normalizedDomains.slice(i, i + APPLE_MAX_DOMAINS_PER_RULE);
    rules.push({
      trigger: {
        "url-filter": ".*",
        "if-domain": chunk.map((d) => `*${d}`),
      },
      action: { type: "block" },
    });
  }

  for (const pattern of patterns) {
    if (pattern.type === "regex") {
      const safe = safeRegex(pattern.pattern);
      if (safe) {
        rules.push({
          trigger: { "url-filter": safe },
          action: { type: "block" },
        });
      }
    } else if (pattern.type === "contains") {
      const escaped = escapeRegex(pattern.pattern.toLowerCase());
      if (escaped) {
        rules.push({
          trigger: { "url-filter": `^https?://[^/]*${escaped}` },
          action: { type: "block" },
        });
      }
    }
  }

  // Whitelist overrides MUST come last — Content Blocker rules apply in
  // order and `ignore-previous-rules` clears prior block matches for the
  // listed domains.
  if (normalizedWhitelist.length > 0) {
    for (let i = 0; i < normalizedWhitelist.length; i += APPLE_MAX_DOMAINS_PER_RULE) {
      const chunk = normalizedWhitelist.slice(i, i + APPLE_MAX_DOMAINS_PER_RULE);
      rules.push({
        trigger: {
          "url-filter": ".*",
          "if-domain": chunk.map((d) => `*${d}`),
        },
        action: { type: "ignore-previous-rules" },
      });
    }
  }

  if (rules.length > APPLE_MAX_RULES) {
    // Apple silently drops the overflow; truncate explicitly so the user
    // sees a deterministic subset rather than implementation-defined behavior.
    return rules.slice(0, APPLE_MAX_RULES);
  }
  return rules;
}

/** Serialize rules as Safari expects: a top-level JSON array, no wrapper. */
export function serializeRules(rules: ContentBlockerRule[]): string {
  return JSON.stringify(rules);
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\*\./, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apple's Content Blocker regex flavor is Safari's WebKit subset — POSIX-ish.
 * Reject patterns that contain features Safari rejects so a single broken
 * rule doesn't void the whole blocker list.
 */
function safeRegex(pattern: string): string | null {
  if (!pattern || pattern.length > 100) return null;
  if (/[\(\)\\][?!=<]/.test(pattern)) return null; // lookarounds, backrefs
  return pattern;
}
