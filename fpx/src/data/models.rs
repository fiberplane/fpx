use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer};
use std::collections::BTreeMap;
use std::ops::{Deref, DerefMut};

use crate::models;

#[derive(Debug)]
pub(crate) struct Json<T: DeserializeOwned>(T);

impl<T: DeserializeOwned> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: DeserializeOwned> DerefMut for Json<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: DeserializeOwned> AsRef<T> for Json<T> {
    fn as_ref(&self) -> &T {
        &self.0
    }
}

impl<T: DeserializeOwned> AsMut<T> for Json<T> {
    fn as_mut(&mut self) -> &mut T {
        &mut self.0
    }
}

impl<'de, T: DeserializeOwned> Deserialize<'de> for Json<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string: String = Deserialize::deserialize(deserializer)?;
        let json: T = serde_json::from_str(&string).map_err(serde::de::Error::custom)?;

        Ok(Json(json))
    }
}

#[derive(Debug, Deserialize)]
pub(crate) struct Request {
    pub(crate) id: u32,
    pub(crate) method: String,
    pub(crate) url: String,
    pub(crate) body: Option<String>,
    pub(crate) headers: Json<BTreeMap<String, String>>,
}

impl From<Request> for models::Request {
    fn from(req: Request) -> Self {
        models::Request::new(req.id, req.method, req.url, req.body, req.headers.0)
    }
}

impl From<Request> for models::RequestSummary {
    fn from(request: Request) -> Self {
        models::RequestSummary::new(request.id, request.method, request.url)
    }
}

#[derive(Debug, Deserialize)]
pub(crate) struct Response {
    pub(crate) id: u32,
    pub(crate) request_id: u32,
    pub(crate) status: u16,
    pub(crate) body: Option<String>,
    pub(crate) headers: Json<BTreeMap<String, String>>,
}

impl From<Response> for models::Response {
    fn from(res: Response) -> Self {
        models::Response::new(res.id, res.request_id, res.status, res.body, res.headers.0)
    }
}
