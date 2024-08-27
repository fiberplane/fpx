/// SqlBuilder allows a store to build SQL queries.
///
/// Any query functions that are required on the [`super::Store`] trait should
/// have a equivalent defined on this builder.
///
/// Note: that this does not set any parameters. It is up to the implementation
/// to set these parameters is a safe way, to prevent SQL injection. Some
/// parameters can be provided as part of the query. For example, a query that
/// includes sorting needs to be set in the query and cannot be provided through
/// a parameters. In this a set of allowed values can be provided and thus no
/// sql injection is possible.
///
/// Future improvements: Currently this builder only supports a single dialect,
/// the sqlite dialect. We might also be able to support configurable table
/// names. For this reason all functions have a reference to `self` and all
/// return a owned string.
#[derive(Default)]
pub struct SqlBuilder {}

impl SqlBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    /// Retrieve a single span by trace_id and span_id.
    ///
    /// Query parameters:
    /// - $1: trace_id
    /// - $2: span_id
    pub fn span_get(&self) -> String {
        String::from("SELECT * FROM spans WHERE trace_id=$1 AND span_id=$2")
    }

    /// Retrieve all spans for a given trace_id.
    ///
    /// Query parameters:
    /// - $1: trace_id
    pub fn span_list_by_trace(&self) -> String {
        String::from("SELECT * FROM spans WHERE trace_id=$1")
    }

    /// Create a new span.
    ///
    /// Query parameters:
    /// - $1: trace_id
    /// - $2: span_id
    /// - $3: parent_span_id
    /// - $4: name
    /// - $5: kind
    /// - $6: start_time
    /// - $7: end_time
    /// - $8: inner
    pub fn span_create(&self) -> String {
        String::from(
            "
            INSERT INTO spans
            (
                trace_id,
                span_id,
                parent_span_id,
                name,
                kind,
                start_time,
                end_time,
                inner
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *",
        )
    }

    /// Get a list of all the traces. (currently limited to 20, sorted by most
    /// recent [`end_time`]). Leave limit as None to use the default of 20.
    ///
    /// Query parameters: None
    pub fn traces_list(&self, limit: Option<u32>) -> String {
        let limit = limit.unwrap_or(20);
        format!(
            "
            SELECT trace_id, MAX(end_time) as end_time
            FROM spans
            GROUP BY trace_id
            ORDER BY end_time DESC
            LIMIT {limit}
            ",
        )
    }

    /// Delete all spans with a specific trace_id.
    ///
    /// Query parameters:
    /// - $1: trace_id
    pub fn span_delete_by_trace(&self) -> String {
        String::from("DELETE FROM spans WHERE trace_id=$1")
    }

    /// Delete a specific span.
    ///
    /// Query parameters:
    /// - $1: trace_id
    /// - $2: span_id
    pub fn span_delete(&self) -> String {
        String::from("DELETE FROM spans WHERE trace_id=$1 AND span_id=$2")
    }
}
