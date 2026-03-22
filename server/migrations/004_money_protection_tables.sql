-- AntiSlot Money Protection Cloud Sync Schema

CREATE TABLE IF NOT EXISTS money_protection_states (
  user_id VARCHAR(255) PRIMARY KEY,
  state_json JSONB NOT NULL,
  updated_at_ms BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_money_protection_states_updated
  ON money_protection_states(updated_at_ms DESC);

CREATE TABLE IF NOT EXISTS money_protection_events (
  user_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(128) NOT NULL,
  source VARCHAR(32) NOT NULL,
  created_at_ms BIGINT NOT NULL,
  local_updated_at_ms BIGINT NOT NULL,
  resolved_updated_at_ms BIGINT NOT NULL,
  conflicts INTEGER NOT NULL,
  state_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_money_protection_events_user_created
  ON money_protection_events(user_id, created_at_ms DESC);
