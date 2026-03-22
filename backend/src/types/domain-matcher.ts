export interface BlocklistPattern {
  pattern: string;
  type: "exact" | "subdomain" | "contains" | "regex";
  weight: number;
}

export interface BlocklistEntry {
  domain: string;
  patterns: BlocklistPattern[];
  lastSeen: number;
  reason: string;
}

