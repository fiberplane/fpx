CREATE TABLE spans (
    id INTEGER PRIMARY KEY,
    trace_id INTEGER,
    span_id INTEGER,
    parent_trace_id INTEGER NULL,
    name TEXT,
    kind TEXT,
    scope_name TEXT,
    scope_version TEXT
) STRICT
