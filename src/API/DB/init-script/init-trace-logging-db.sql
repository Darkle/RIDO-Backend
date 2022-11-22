CREATE TABLE IF NOT EXISTS TraceLog(
  createdAt INTEGER NOT NULL,
  level TEXT COLLATE NOCASE CHECK(level = 'trace') NOT NULL DEFAULT 'trace',
  message TEXT NULL,
  service TEXT NULL,
  stack TEXT NULL,
  other TEXT NULL
);