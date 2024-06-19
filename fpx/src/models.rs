use crate::api::types::Request;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub(crate) struct DbRequest {
    pub(crate) id: i64,
    pub(crate) method: String,
    pub(crate) url: String,
    pub(crate) body: String,
    pub(crate) headers: String,
}

impl From<DbRequest> for Request {
    fn from(req: DbRequest) -> Self {
        Request::new(
            req.id,
            req.method,
            req.url,
            req.body,
            serde_json::from_str(&req.headers).expect("db to not contain invalid json"),
        )
    }
}
