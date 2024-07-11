CREATE TABLE spans (
    trace_id BLOB,
    span_id BLOB,
    parent_span_id BLOB NULL,
    name TEXT,
    state TEXT,
    flags INTEGER,
    kind TEXT,
    scope_name TEXT NULL,
    scope_version TEXT NULL,
    start_time INTEGER,
    end_time INTEGER,
    attributes TEXT,
    resource_attributes TEXT NULL,
    scope_attributes TEXT NULL,
    status TEXT NULL,
    events TEXT,
    links TEXT
) STRICT;

CREATE INDEX spans_trace_id_span_id ON spans (trace_id, span_id);
