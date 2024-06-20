use crate::api::types::Request;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer};
use std::collections::BTreeMap;
use std::marker::PhantomData;
use std::ops::Deref;

#[derive(Debug)]
pub(crate) struct Json<T>(T);

impl<T> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
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
pub(crate) struct DbRequest {
    pub(crate) id: i64,
    pub(crate) method: String,
    pub(crate) url: String,
    pub(crate) body: String,
    pub(crate) headers: Json<BTreeMap<String, String>>,
}

impl From<DbRequest> for Request {
    fn from(req: DbRequest) -> Self {
        Request::new(req.id, req.method, req.url, req.body, req.headers.0)
    }
}
