-- AntiSlot Premium Schema
-- Run on fresh DB or apply via migration tool

CREATE TABLE IF NOT EXISTS premium_entitlements (
  user_id VARCHAR(255) NOT NULL PRIMARY KEY,
  platform VARCHAR(16) NOT NULL DEFAULT 'unknown',
  source VARCHAR(64) NOT NULL,
  product_id VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  transaction_id VARCHAR(256) NOT NULL,
  event_id VARCHAR(256) NOT NULL,
  started_at BIGINT NOT NULL,
  expires_at BIGINT,
  updated_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premium_entitlements_status ON premium_entitlements(status);
CREATE INDEX IF NOT EXISTS idx_premium_entitlements_expires_at ON premium_entitlements(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS premium_processed_events (
  event_key VARCHAR(512) NOT NULL PRIMARY KEY,
  processed_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premium_processed_events_processed_at ON premium_processed_events(processed_at);
