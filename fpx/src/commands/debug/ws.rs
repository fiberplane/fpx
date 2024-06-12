use crate::api::types::{ClientMessage, ClientMessageDetails, FPX_WEBSOCKET_ID_HEADER};
use anyhow::{Context, Result};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::Message;
use tracing::{error, info};
use url::Url;

#[derive(clap::Args, Debug)]
pub struct Args {
    /// The address to connect to.
    #[arg(short, long, env, default_value = "ws://127.0.0.1:6767/api/ws")]
    pub endpoint: Url,
}

pub async fn handle_command(args: Args) -> Result<()> {
    let (ws_stream, resp) = tokio_tungstenite::connect_async(&args.endpoint)
        .await
        .with_context(|| format!("Unable to connect to server at {}", args.endpoint))?;

    let ws_id = extract_id(&resp).unwrap_or_default();

    info!(ws_id = ?ws_id, "Connected to server");

    let (write, mut read) = ws_stream.split();
    let write = Arc::new(Mutex::new(write));

    let w1 = write.clone();
    let enter_task = tokio::spawn(async move {
        let write = w1;
        let stdin = tokio::io::stdin();
        let reader = BufReader::new(stdin);
        let mut lines = reader.lines();
        loop {
            let _ = lines.next_line().await;

            info!("Sending message");
            let message = ClientMessage::new(ClientMessageDetails::Debug);
            let message = serde_json::to_string(&message).expect("Unable to serialize message");
            let mut lock = write.lock().await;

            lock.send(Message::Text(message))
                .await
                .expect("Unable to send message");
        }
    });

    let ctrlc_task = tokio::spawn(async {
        let write = write;

        loop {
            tokio::signal::ctrl_c().await.unwrap();
            info!("Received ctrl-c, closing connection");
            write
                .lock()
                .await
                .close()
                .await
                .expect("Unable to close write channel");
            info!("closed?");
        }
    });

    loop {
        let msg = read.next().await;

        match msg {
            Some(Ok(msg)) => info!("Received message: {:?}", msg),
            Some(Err(err)) => error!("Received error: {:?}", err),
            None => {
                info!("Connection closed");
                break;
            }
        }
    }

    enter_task.abort();
    ctrlc_task.abort();

    Ok(())
}

// Retrieves the ID from the response headers, if it is not present or it fails
// parse the value as a u32, it will return None.
fn extract_id<T>(resp: &http::Response<T>) -> Option<u32> {
    let id = resp
        .headers()
        .get(FPX_WEBSOCKET_ID_HEADER)
        .and_then(|header| header.to_str().ok().and_then(|value| value.parse().ok()));

    id
}
