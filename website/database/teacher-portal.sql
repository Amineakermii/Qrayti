CREATE TABLE IF NOT EXISTS teachers (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, university TEXT NOT NULL, institution TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 generation INTEGER NOT NULL DEFAULT 1, token_hash TEXT NOT NULL UNIQUE,
 expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teacher_sessions (
 hash TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id), generation INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS teacher_sessions_owner ON teacher_sessions(teacher_id);
CREATE TABLE IF NOT EXISTS teacher_submissions (
 id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id), request_id TEXT NOT NULL,
 original_name TEXT NOT NULL, size INTEGER NOT NULL, mime TEXT NOT NULL DEFAULT '', sha256 TEXT NOT NULL DEFAULT '',
 meta_json TEXT NOT NULL, rights_at TEXT NOT NULL, r2_key TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('reserved','receiving','failed','pending','publishing','approved','rejected')),
 generation INTEGER NOT NULL, day TEXT NOT NULL, expires_at INTEGER NOT NULL, lease TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, reviewed_at TEXT, feedback TEXT NOT NULL DEFAULT '',
 final_meta TEXT, published_file_id TEXT UNIQUE, reviewer TEXT, pub_lease TEXT NOT NULL DEFAULT '', pub_until INTEGER NOT NULL DEFAULT 0,
 UNIQUE(teacher_id, request_id)
);
CREATE INDEX IF NOT EXISTS teacher_submissions_queue ON teacher_submissions(status,created_at);
CREATE INDEX IF NOT EXISTS teacher_submissions_owner ON teacher_submissions(teacher_id,day,status);
CREATE TABLE IF NOT EXISTS teacher_review_events (
 id TEXT PRIMARY KEY, submission_id TEXT NOT NULL REFERENCES teacher_submissions(id), action TEXT NOT NULL, reviewer TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teacher_login_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS teacher_upload_limits (teacher_id TEXT PRIMARY KEY REFERENCES teachers(id), attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
