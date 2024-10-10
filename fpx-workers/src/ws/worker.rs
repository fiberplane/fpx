use fpx::api::models::ServerMessage;
use tracing::error;
use worker::*;

/// An implementation of a hibernating WebSocket Server using [`durable_object`].
///
/// This server handles WebSocket connections, allowing them to hibernate when inactive
/// and providing endpoints for connecting and broadcasting messages to all connected clients.
///
/// Based on:
/// [WebSocket Hibernation Server Example](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/)
#[durable_object]
pub struct WebSocketHibernationServer {
    env: Env,
    state: State,
    connections: Vec<WebSocket>,
}

#[durable_object]
impl DurableObject for WebSocketHibernationServer {
    fn new(state: State, env: Env) -> Self {
        let connections = state.get_websockets();

        Self {
            env,
            state,
            connections,
        }
    }

    async fn fetch(&mut self, req: worker::Request) -> Result<Response> {
        let env = self.env.clone();

        Router::with_data(self)
            .get_async("/connect", ws_connect)
            .post_async("/broadcast", ws_broadcast)
            .run(req, env)
            .await
    }

    async fn websocket_close(
        &mut self,
        ws: WebSocket,
        _code: usize,
        _reason: String,
        _was_clean: bool,
    ) -> Result<()> {
        // Try to close the websocket connection (do not send a code or reason)
        if let Err(err) = ws.close::<String>(None, None) {
            error!(?err, "Failed to close WebSocket connection");
        }

        self.connections.retain_mut(|conn| conn != &ws);

        Ok(())
    }
}

/// Handles creating and storing a new hibernating WebSocket connection.
///
/// It creates a new WebSocket pair, accepts the server WebSocket for hibernation,
/// stores the server WebSocket in the `connections` vector, and returns the client
/// WebSocket in the response.
async fn ws_connect(
    _req: Request,
    ctx: RouteContext<&mut WebSocketHibernationServer>,
) -> Result<Response> {
    let WebSocketPair { client, server } = WebSocketPair::new()?;

    // Hibernating non standard web socket handler
    ctx.data.state.accept_web_socket(&server);

    // Store the socket connection in the durable object
    ctx.data.connections.push(server);

    // Return the client WebSocket in the response
    let res = Response::from_websocket(client)?;

    Ok(res)
}

/// Handles broadcasting a [`ServerMessage`] to all connected WebSocket clients.
///
/// It deserializes the incoming request body as a `ServerMessage` and sends it
/// to all WebSocket connections stored in the `connections` vector.
async fn ws_broadcast(
    mut req: Request,
    ctx: RouteContext<&mut WebSocketHibernationServer>,
) -> Result<Response> {
    let payload = req.json::<ServerMessage>().await?;

    for client in ctx.data.connections.iter_mut() {
        client.send(&payload)?;
    }

    Response::ok("ok")
}
