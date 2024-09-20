use crate::data::DbError;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AiProviderType {
    OpenAi,
    Anthropic,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AnthropicModelSchema {
    #[serde(rename = "claude-3-5-sonnet-20240620")]
    Claude35Sonnet,
    #[serde(rename = "claude-3-opus-20240229")]
    Claude3Opus,
    #[serde(rename = "claude-3-sonnet-20240229")]
    Claude3Sonnet,
    #[serde(rename = "claude-3-haiku-20240307")]
    Claude3Haiku,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OpenAiModel {
    #[serde(rename = "gpt-4o")]
    Gpt4o,
    #[serde(rename = "gpt-4o-mini")]
    Gpt4oMini,
    #[serde(rename = "gpt-4-turbo")]
    Gpt4Turbo,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub ai_enabled: Option<bool>,
    pub ai_provider_type: Option<AiProviderType>,
    pub anthropic_api_key: Option<String>,
    pub anthropic_base_url: Option<String>,
    pub anthropic_model: Option<AnthropicModelSchema>,
    pub fpx_worker_proxy: Option<FpxWorkerProxy>,
    pub openai_api_key: Option<String>,
    pub openai_base_url: Option<String>,
    pub openai_model: Option<OpenAiModel>,
    pub proxy_base_url: Option<String>,
    pub proxy_requests_enabled: Option<bool>,
    pub webhonc_connection_id: Option<String>,
}

impl Settings {
    pub fn into_map(self) -> Result<serde_json::Map<String, Value>, DbError> {
        match serde_json::to_value(self).map_err(|_| DbError::FailedSerialize)? {
            Value::Object(map) => Ok(map),
            _ => unreachable!(
                "settings is a object so it will always serialize into a Value::Object as well"
            ),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FpxWorkerProxy {
    pub enabled: Option<bool>,
    pub base_url: Option<String>,
}
