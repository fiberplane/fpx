use crate::data::models::Span;
use crate::data::{migrations, Json, RowsExt, Store};
use crate::models::SpanKind;
use libsql::params;
use serde::Deserialize;
use std::collections::BTreeMap;
use std::time::Duration;
use test_log::test;
use tokio::join;
use tokio::time::sleep;
use tracing::info;

/// Initialize a in memory database, and run the migrations on it.
async fn create_test_database() -> Store {
    let store = Store::in_memory().await.unwrap();

    // Run migrations until the latest version
    migrations::migrate(&store).await.unwrap();

    store
}

#[tokio::test]
async fn test_extensions() {
    let store = Store::in_memory().await.unwrap();

    {
        let tx = store.start_transaction().await.unwrap();

        #[derive(Deserialize)]
        struct Test {
            test: i32,
        }

        let fone: Test = tx
            .query("select 1 as test", ())
            .await
            .unwrap()
            .fetch_one()
            .await
            .unwrap();

        assert_eq!(fone.test, 1);

        // create a temporary table and immediately drop it. this returns 0 rows without using existing tables
        let fopt: Option<Test> = tx
            .query(
                "create temporary table temp_table (id integer); drop table temp_table",
                (),
            )
            .await
            .unwrap()
            .fetch_optional()
            .await
            .unwrap();

        assert!(fopt.is_none());

        let fall: Vec<Test> = tx
            .query("select 1 as test union all select 2 union all select 3", ())
            .await
            .unwrap()
            .fetch_all()
            .await
            .unwrap();

        assert_eq!(fall.len(), 3);
        assert_eq!(fall[0].test, 1);
        assert_eq!(fall[1].test, 2);
        assert_eq!(fall[2].test, 3);

        #[derive(Deserialize)]
        struct TestJson {
            test: Json<BTreeMap<String, i32>>,
        }

        let json: TestJson = tx
            .query("select ? as test", params![r#"{"test":1}"#])
            .await
            .unwrap()
            .fetch_one()
            .await
            .unwrap();

        assert_eq!(json.test["test"], 1);

        store.commit_transaction(tx).await.unwrap();
    }
}

#[test(tokio::test)]
async fn test_create_span() {
    let store = create_test_database().await;

    let tx = store.start_transaction().await.unwrap();
    let span = Span {
        name: "test name".to_string(),
        kind: SpanKind::Server,
        trace_id: vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
        span_id: vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
        ..Default::default()
    };
    let span = store.span_create(&tx, span).await.unwrap();
    assert_eq!(span.kind, SpanKind::Server);
}

#[test(tokio::test(flavor = "multi_thread"))]
async fn test_concurrent_transactions() {
    let store = create_test_database().await;

    let store1 = store.clone();
    let tx1_task = tokio::spawn(async move {
        info!("Starting tx1");
        let tx1 = store1
            .start_transaction()
            .await
            .expect("Failed to start tx1");
        // sleep(Duration::from_secs(1)).await;
        store1
            .commit_transaction(tx1)
            .await
            .expect("Failed to commit tx1");
    });

    let store2 = store.clone();
    let tx2_task = tokio::spawn(async move {
        info!("Starting tx2");
        let tx2 = store2
            .start_transaction()
            .await
            .expect("Failed to start tx2");
        // sleep(Duration::from_secs(1)).await;
        store2
            .commit_transaction(tx2)
            .await
            .expect("Failed to commit tx2");
    });

    let (result1, result2) = join!(tx1_task, tx2_task);
    assert!(result1.is_ok());
    assert!(result2.is_ok());
}
