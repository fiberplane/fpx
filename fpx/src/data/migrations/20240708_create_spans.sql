CREATE TABLE spans (
    id INTEGER PRIMARY KEY,
    trace_id BLOB,
    span_id BLOB,
    parent_span_id BLOB NULL,
    name TEXT,
    kind TEXT,
    scope_name TEXT NULL,
    scope_version TEXT NULL,
    start_time INTEGER,
    end_time INTEGER,
    attributes TEXT,
    resource_attributes TEXT NULL,
    scope_attributes TEXT NULL
) STRICT
