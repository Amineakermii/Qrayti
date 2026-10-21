CREATE TABLE IF NOT EXISTS content_files (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  licence TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  track TEXT NOT NULL DEFAULT 'common',
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_ar TEXT NOT NULL DEFAULT '',
  subject_abbr TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_ar TEXT NOT NULL DEFAULT '',
  group_name TEXT NOT NULL,
  group_title TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  source_university TEXT NOT NULL DEFAULT '',
  source_institution TEXT NOT NULL DEFAULT '',
  source_instructor TEXT NOT NULL DEFAULT '',
  source_basis TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_content_context ON content_files(licence,year,semester,track,status);
CREATE INDEX IF NOT EXISTS idx_content_subject ON content_files(subject_id,category,status);
CREATE INDEX IF NOT EXISTS idx_content_updated ON content_files(updated_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_app_settings_updated ON app_settings(updated_at DESC);
