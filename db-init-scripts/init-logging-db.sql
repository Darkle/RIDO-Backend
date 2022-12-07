-- The column names need to be snake case as the sqlite-parse lib we use ignores casing for column names which makes it impossible to do the auto casting if using camel case.
CREATE TABLE IF NOT EXISTS Log(
  created_at INTEGER NOT NULL,
  level TEXT COLLATE NOCASE CHECK(
    level IN (
      'fatal',
      'error',
      'warn',
      'info',
      'debug',
      'trace'
    )
  ) NOT NULL,
  message TEXT NULL,
  service TEXT NULL,
  stack TEXT NULL,
  other JSON NULL
);

CREATE TABLE IF NOT EXISTS TraceLog(
  created_at INTEGER NOT NULL,
  level TEXT COLLATE NOCASE CHECK(level = 'trace') NOT NULL,
  message TEXT NULL,
  service TEXT NULL,
  stack TEXT NULL,
  other JSON NULL
);