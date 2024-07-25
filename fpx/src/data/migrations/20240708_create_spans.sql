CREATE TABLE spans (
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    parent_span_id TEXT,

    name TEXT NOT NULL,
    kind TEXT NOT NULL,

    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,

    inner TEXT
) STRICT;

CREATE INDEX spans_trace_id_span_id ON spans (trace_id, span_id);
CREATE INDEX spans_trace_id_parent_span_id ON spans (trace_id, parent_span_id);
