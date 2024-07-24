CREATE TABLE spans (
    trace_id TEXT,
    span_id TEXT,
    parent_span_id TEXT NULL,

    name TEXT,
    kind TEXT,

    start_time INTEGER,
    end_time INTEGER,

    inner TEXT
) STRICT;

CREATE INDEX spans_trace_id_span_id ON spans (trace_id, span_id);
CREATE INDEX spans_trace_id_parent_span_id ON spans (trace_id, parent_span_id);
