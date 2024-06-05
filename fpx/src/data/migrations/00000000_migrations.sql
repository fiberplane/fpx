CREATE TABLE _fpx_migrations  (
    name TEXT PRIMARY KEY, -- This contains the name of the migration
    created_at REAL DEFAULT (unixepoch('subsec'))
) STRICT
