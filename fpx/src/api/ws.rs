use super::models::{ClientMessage, ServerError, ServerMessage, FPX_WEBSOCKET_ID_HEADER};
use crate::events::ServerEvents;
use axum::extract::ws::{Message, WebSocket};
use axum::extract::{State, WebSocketUpgrade};
use axum::response::Response;
use futures_util::stream::{SplitSink, SplitStream};
use futures_util::{SinkExt, StreamExt};

use rand::Rng;
use tokio::sync::broadcast::Receiver;
use tokio::sync::mpsc;
use tracing::{debug, error, info_span, trace, warn, Instrument, Span};

pub async fn ws_handler(ws: WebSocketUpgrade, State(events): State<ServerEvents>) -> Response {
    let ws_id = generate_ws_id();

    let mut result = ws
        .on_failed_upgrade(ws_failed_callback)
        .on_upgrade(move |socket| {
            let span = info_span!("websocket connection", ws_id = ws_id);
            ws_socket(socket, events, ws_id).instrument(span)
        });

    // Add the ws-id as a header in the response.
    result
        .headers_mut()
        .insert(FPX_WEBSOCKET_ID_HEADER, ws_id.into());

    result
}

fn generate_ws_id() -> u32 {
    let mut rng = rand::thread_rng();
    rng.gen()
}

fn ws_failed_callback(err: axum::Error) {
    error!(?err, "Failed to upgrade WebSocket connection");
}

async fn ws_socket(socket: WebSocket, events: ServerEvents, _ws_id: u32) {
    trace!("WebSocket connection connected");

    // Subscribe to the broadcast channel. This will contain all messages that
    // should be sent to all connected clients (including this one).
    let broadcast = events.subscribe().await;

    // Create a reply channel. This allows messages to be sent to only this
    // websocket connection. This is useful for sending ack messages.
    let (reply_write, reply_read) = mpsc::channel(100);

    // Split the WebSocket in a read and write half, so that we do both
    // concurrently.
    let (write, read) = socket.split();

    // Spawn the write task into its own background task.
    let write_task =
        tokio::spawn(ws_socket_write(write, broadcast, reply_read).instrument(Span::current()));

    // Wait until the read task completes. This will happen when the WebSocket
    // connection is closed.
    ws_socket_read(read, reply_write).await;

    // Once the read task is completed, abort the write task.
    write_task.abort();

    trace!("WebSocket connection closed");
}

/// Handle incoming data from a WebSocket connection.
///
/// This will loop until the WebSocket connection is closed. It can use
/// [`reply`] to send messages to the WebSocket connection.
async fn ws_socket_read(mut read: SplitStream<WebSocket>, reply: mpsc::Sender<ServerMessage>) {
    loop {
        // If next returns [`None`], the WebSocket connection is closed, so stop
        // the loop.
        let Some(message) = read.next().await else {
            break;
        };

        // Parse the message as JSON and then handle it according to the message
        // type.
        match message {
            Ok(Message::Text(msg)) => {
                let message: Result<ClientMessage, _> = serde_json::from_str(&msg);

                match message {
                    Ok(message) => {
                        debug!("Received message, sending ack");
                        let message = ServerMessage::ack(message.message_id);
                        let _ = reply.send(message).await;
                    }
                    Err(err) => {
                        warn!(?err, "Error parsing message");
                        let message = ServerMessage::error(None, ServerError::InvalidMessage);
                        let _ = reply.send(message).await;
                    }
                };
            }
            Ok(_) => warn!("Received non-text message"),
            Err(err) => error!(?err, "Error reading message"),
        };
    }

    trace!("Closing read loop");
}

/// Handle outgoing data to a WebSocket connection.
///
/// This will read both the broadcast channel and the reply channel, and send
/// the messages to the connected WebSocket connection.
async fn ws_socket_write(
    mut write: SplitSink<WebSocket, Message>,
    mut broadcast: Receiver<ServerMessage>,
    mut reply: mpsc::Receiver<ServerMessage>,
) {
    loop {
        let message = tokio::select! {
            // Make the select biased since we want to prioritize reply messages
            biased;

            // If reply returns None, that means the other side is closed. This
            // is fine, since we can still handle broadcast messages.
            Some(message) = reply.recv() => message,

            // If we receive an error from the broadcast channel, log it and
            // restart the loop. This is most likely cause by the web-socket
            // consumer lagging behind (if all publishers are closed than that
            // is a bug).
            result = broadcast.recv() => match result {
                Ok(message) => message,
                Err(err) => {
                    warn!(?err, "Received error from broadcast channel");
                    continue;
                },
            },

            // This can actually never be reached since the broadcast arm will
            // always match.
            else => break,
        };

        let message = serde_json::to_string(&message).expect("serialization cannot fail");

        trace!("Sending message to websocket connection");

        // Send the serialized message to the WebSocket connection as a text
        // Message.
        let result = write.send(Message::Text(message)).await;
        if let Err(err) = result {
            error!(?err, "Error sending message");
        }
    }

    trace!("Closing write loop");
}
