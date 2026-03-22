-- AntiSlot Urge Cloud Sync Schema

CREATE TABLE IF NOT EXISTS urge_logs (
  user_id VARCHAR(255) NOT NULL,
  id VARCHAR(128) NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  intensity SMALLINT NOT NULL,
  trigger VARCHAR(32),
  context TEXT,
  interventions JSONB NOT NULL,
  outcome JSONB,
  duration_sec INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_urge_logs_user_timestamp
  ON urge_logs(user_id, timestamp_ms DESC);
