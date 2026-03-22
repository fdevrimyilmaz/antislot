-- AntiSlot Therapy Callback Queue Schema

CREATE TABLE IF NOT EXISTS therapy_callback_requests (
  request_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  name VARCHAR(120),
  preferred_time VARCHAR(160),
  note VARCHAR(1000),
  admin_note VARCHAR(1000),
  locale VARCHAR(8) NOT NULL DEFAULT 'en',
  status VARCHAR(16) NOT NULL DEFAULT 'queued',
  created_at_ms BIGINT NOT NULL,
  updated_at_ms BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT therapy_callback_status_check CHECK (status IN ('queued', 'contacted', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_therapy_callback_user_created
  ON therapy_callback_requests(user_id, created_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_callback_status_created
  ON therapy_callback_requests(status, created_at_ms ASC);
