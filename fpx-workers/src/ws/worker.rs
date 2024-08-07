use fpx_lib::api::models::ServerMessage;
use worker::*;

/// Based on:
/// https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
#[durable_object]
pub struct WebSocketHibernationServer {
    env: Env,
    state: State,
    connections: Vec<WebSocket>,
}

#[durable_object]
impl DurableObject for WebSocketHibernationServer {
    fn new(state: State, env: Env) -> Self {
        Self {
            env,
            state,
            connections: vec![],
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
}

async fn ws_connect(
    _req: Request,
    ctx: RouteContext<&mut WebSocketHibernationServer>,
) -> Result<Response> {
    let WebSocketPair { client, server } = WebSocketPair::new()?;

    // Hibernating non standard web socket handler
    ctx.data.state.accept_web_socket(&server);

    ctx.data.connections.push(server);

    let res = Response::from_websocket(client)?;

    Ok(res)
}

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
