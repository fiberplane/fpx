use crate::data::LibsqlStore;
use fpx_lib::api::models::{AttributeMap, SpanKind};
use fpx_lib::data::models::{HexEncodedId, Span};
use fpx_lib::data::Store;
use test_log::test;

/// Tests creating a span and then retrieving it using the various methods.
///
/// This test exercises the following methods:
/// - span_create()
/// - span_get()
/// - span_list_by_trace()
#[test(tokio::test)]
async fn span_successful() {
    // create store
    let store = create_test_store().await;

    // - Create span
    let tx = store
        .start_readwrite_transaction()
        .await
        .expect("unable to create transaction");

    let trace_id = HexEncodedId::new("2b76e003e3cff12e054bcd0ca6879ee4").unwrap();
    let span_id = HexEncodedId::new("a6c0ed7c2f81e7c8").unwrap();

    let now = time::OffsetDateTime::now_utc();
    let inner_span: fpx_lib::api::models::Span = fpx_lib::api::models::Span {
        trace_id: trace_id.clone().into_inner(),
        span_id: span_id.clone().into_inner(),
        parent_span_id: None,
        name: String::from("Test span"),
        kind: SpanKind::Internal,
        start_time: now,
        end_time: now,
        trace_state: String::new(),
        flags: 0,
        scope_name: None,
        scope_version: None,
        attributes: AttributeMap::default(),
        scope_attributes: None,
        resource_attributes: None,
        status: None,
        events: vec![],
        links: vec![],
    };
    let span: Span = inner_span.into();
    let saved_span = store
        .span_create(&tx, span.clone())
        .await
        .expect("unable to create span");

    // We only are interested in the inner span, since the db model will have
    // slightly different start/end times (due to float conversion).
    assert_eq!(span.as_inner(), saved_span.as_inner());

    store
        .commit_transaction(tx)
        .await
        .expect("unable to commit transaction");

    let tx = store
        .start_readwrite_transaction()
        .await
        .expect("unable to create transaction");

    // Get previously created span
    let retrieved_span = store
        .span_get(&tx, &trace_id, &span_id)
        .await
        .expect("unable to get span");

    // Here we can assert the whole DB object, since both came from the database.
    assert_eq!(saved_span, retrieved_span);

    // List spans by trace
    let retrieved_spans = store
        .span_list_by_trace(&tx, &trace_id)
        .await
        .expect("unable to get spans");

    assert_eq!(retrieved_spans.len(), 1);
    assert_eq!(retrieved_spans[0], saved_span);

    store
        .rollback_transaction(tx)
        .await
        .expect("unable to rollback transaction");
}

pub async fn create_test_store() -> LibsqlStore {
    let store = LibsqlStore::in_memory()
        .await
        .expect("unable to create test store");

    store.migrate().await.expect("unable to run migrations");

    store
}
