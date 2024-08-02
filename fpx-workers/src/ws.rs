use serde::Serialize;
use worker::*;

/// Based on:
/// https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
#[allow(dead_code)]
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
            .get_async("/connect", websocket_connect)
            .get_async("/broadcast", websocket_broadcast)
            .run(req, env)
            .await
    }
}

async fn websocket_connect(
    _req: Request,
    ctx: RouteContext<&mut WebSocketHibernationServer>,
) -> Result<Response> {
    let WebSocketPair { client, server } = WebSocketPair::new()?;

    // Hibernating non standard web socket handler
    ctx.data.state.accept_web_socket(&server);

    ctx.data.connections.push(server);

    let resp = Response::from_websocket(client)?;

    Ok(resp)
}

#[derive(Serialize)]
enum Payload {
    SomeValue,
}

async fn websocket_broadcast(
    _req: Request,
    ctx: RouteContext<&mut WebSocketHibernationServer>,
) -> Result<Response> {
    for client in ctx.data.connections.iter_mut() {
        client.send(&Payload::SomeValue)?;
    }

    Response::ok("ok")
}
