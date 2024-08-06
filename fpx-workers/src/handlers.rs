use std::sync::Arc;
use worker::Env;

pub mod ws;

#[derive(Clone)]
pub struct WorkerApiState {
    pub env: Arc<Env>,
}
