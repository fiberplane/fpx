use super::errors::ApiClientError;
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

        Err(ApiClientError::from_response(status_code, body))
    }

    pub async fn request_get(
        &self,
        request_id: i64,
    ) -> Result<Request, ApiClientError<RequestGetError>> {
        let path = format!("api/requests/{}", request_id);

        self.do_req(Method::GET, path).await
    }
}
