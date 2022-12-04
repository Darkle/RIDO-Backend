CREATE TABLE IF NOT EXISTS Log(
  createdAt INTEGER NOT NULL,
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
  other TEXT NULL
);

CREATE TABLE IF NOT EXISTS TraceLog(
  createdAt INTEGER NOT NULL,
  level TEXT COLLATE NOCASE CHECK(level = 'trace') NOT NULL,
  message TEXT NULL,
  service TEXT NULL,
  stack TEXT NULL,
  other TEXT NULL
);