CREATE TABLE IF NOT EXISTS settings (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    key TEXT UNIQUE,
    value TEXT,
    created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
) STRICT;
