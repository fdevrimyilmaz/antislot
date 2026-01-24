/**
 * Type definitions for AntiSlot Backend
 */

export interface BlocklistEntry {
  domain: string;
  patterns: BlocklistPattern[];
  addedAt: number;
  updatedAt: number;
  reason: string;
}

export interface BlocklistPattern {
  pattern: string;
  type: 'exact' | 'subdomain' | 'contains' | 'regex';
  weight: number;
}

export interface BlocklistData {
  version: number;
  updatedAt: number;
  entries: BlocklistEntry[];
}

export interface PatternData {
  version: number;
  updatedAt: number;
  patterns: BlocklistPattern[];
}

export interface BlocklistResponse {
  version: number;
  updatedAt: number;
  domains: string[];
  signature: string;
}

export interface PatternsResponse {
  version: number;
  updatedAt: number;
  patterns: BlocklistPattern[];
  signature: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: number;
  version: string;
  blocklistVersion: number;
  blocklistCount: number;
  patternsVersion: number;
  patternsCount: number;
}
