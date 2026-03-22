-- AntiSlot Diary Cloud Sync Schema

CREATE TABLE IF NOT EXISTS diary_entries (
  user_id VARCHAR(255) NOT NULL,
  date VARCHAR(10) NOT NULL,
  id VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  created_at_ms BIGINT NOT NULL,
  updated_at_ms BIGINT NOT NULL,
  deleted_at_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_updated
  ON diary_entries(user_id, updated_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_deleted
  ON diary_entries(user_id, deleted_at_ms)
  WHERE deleted_at_ms IS NOT NULL;

