use super::errors::{ApiClientError, CommonError};
use super::handlers::RequestGetError;
use super::types::Request;
use anyhow::Result;
use http::Method;
use url::Url;

pub struct ApiClient {
    client: reqwest::Client,
    base_url: Url,
}

impl ApiClient {
    pub fn new(client: reqwest::Client, base_url: Url) -> Self {
        Self { client, base_url }
    }

    pub async fn do_req<T, E>(
        &self,
        method: Method,
        path: impl AsRef<str>,
    ) -> Result<T, ApiClientError<E>>
    where
        T: serde::de::DeserializeOwned,
        E: serde::de::DeserializeOwned,
    {
        let u = self.base_url.join(path.as_ref())?;

        let req = self.client.request(method, u);

        // Make request
        let response = req.send().await?;

        // Copy the status code here in case we are unable to parse the response as
        // the Ok or Err variant.
        let status_code = response.status();

        // Read the entire response into a local buffer.
        let body = response.bytes().await?;

        // Try to parse the result as R.
        if let Ok(result) = serde_json::from_slice::<T>(&body) {
            return Ok(result);
        }

        // Try to parse the result as a ServiceError.
        if let Ok(result) = serde_json::from_slice::<E>(&body) {
            return Err(ApiClientError::ServiceError(result));
        }

        // Try to parse the result as CommonError.
        if let Ok(result) = serde_json::from_slice::<CommonError>(&body) {
            return Err(ApiClientError::CommonError(result));
        }

        // If both failed, return the status_code and the body for the user to
        // debug.
        Err(ApiClientError::InvalidResponse(status_code, body))
    }

    pub async fn request_get(
        &self,
        request_id: i64,
    ) -> Result<Request, ApiClientError<RequestGetError>> {
        let path = format!("api/requests/{}", request_id);

        self.do_req(Method::GET, path).await
    }
}
