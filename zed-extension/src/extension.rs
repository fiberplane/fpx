use fpx_lib::api::models::Span as SpanPayload;
use serde::{Deserialize, Serialize};
use zed_extension_api::{
    self as zed, http_client, SlashCommand, SlashCommandArgumentCompletion, SlashCommandOutput,
    SlashCommandOutputSection, Worktree,
};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Trace {
    trace_id: String,
    spans: Vec<Span>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Span {
    span_id: String,
    trace_id: String,
    parsed_payload: SpanPayload,
}

fn get_traces() -> Result<Vec<Trace>, String> {
    let url = format!("http://localhost:8788/v1/traces");

    let request = http_client::HttpRequest {
        method: http_client::HttpMethod::Get,
        url,
        body: None,
        headers: vec![("Content-Type".to_string(), "application/json".to_string())],
        redirect_policy: http_client::RedirectPolicy::NoFollow,
    };

    let response = http_client::fetch(&request)?;

    serde_json::from_slice(&response.body).map_err(|e| format!("Failed to parse JSON: {}", e))
}

fn get_spans(trace_id: &str) -> Result<Vec<Span>, String> {
    let url = format!("http://localhost:8788/v1/traces/{}/spans", trace_id);

    let request = http_client::HttpRequest {
        method: http_client::HttpMethod::Get,
        url,
        body: None,
        headers: vec![("Content-Type".to_string(), "application/json".to_string())],
        redirect_policy: http_client::RedirectPolicy::NoFollow,
    };

    let response = http_client::fetch(&request)?;

    serde_json::from_slice(&response.body).map_err(|e| format!("Failed to parse JSON: {}", e))
}

struct SlashCommandsExampleExtension;

impl zed::Extension for SlashCommandsExampleExtension {
    fn new() -> Self {
        SlashCommandsExampleExtension
    }

    fn complete_slash_command_argument(
        &self,
        command: SlashCommand,
        _args: Vec<String>,
    ) -> Result<Vec<zed_extension_api::SlashCommandArgumentCompletion>, String> {
        let traces = get_traces()?;

        match command.name.as_str() {
            "trace" => Ok(traces
                .iter()
                .flat_map(|trace| {
                    trace.spans.iter().map(|span| {
                        let name = &span.parsed_payload.name;
                        let method = span
                            .parsed_payload
                            .attributes
                            .0
                            .get("http.request.method")
                            .and_then(|v| v.as_ref())
                            .and_then(|v| v.as_str())
                            .unwrap_or("UNKNOWN");
                        let path = span
                            .parsed_payload
                            .attributes
                            .0
                            .get("fpx.http.request.pathname")
                            .and_then(|v| v.as_ref())
                            .and_then(|v| v.as_str())
                            .unwrap_or("/");
                        let status_code = span
                            .parsed_payload
                            .attributes
                            .0
                            .get("http.response.status_code")
                            .and_then(|v| v.as_ref())
                            .and_then(|v| v.as_str())
                            .unwrap_or("???");

                        let label = format!("{}: {} {} ({})", name, method, path, status_code);

                        SlashCommandArgumentCompletion {
                            new_text: trace.trace_id.clone(),
                            label,
                            run_command: true,
                        }
                    })
                })
                .collect::<Vec<_>>()),
            command => Err(format!("unknown slash command: \"{command}\"")),
        }
    }

    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        _worktree: Option<&Worktree>,
    ) -> Result<SlashCommandOutput, String> {
        match command.name.as_str() {
            "trace" => {
                let trace_id = args.first().ok_or("no trace id provided")?;
                let spans = get_spans(trace_id)?;
                let trace = Trace {
                    trace_id: trace_id.to_string(),
                    spans,
                };
                let formatted_json = serde_json::to_string_pretty(&trace)
                    .map_err(|e| format!("Failed to format JSON: {}", e))?;
                let spans_text = format!("```json\n{}\n```", formatted_json);
                Ok(SlashCommandOutput {
                    sections: vec![SlashCommandOutputSection {
                        range: (0..spans_text.len()).into(),
                        label: format!("Trace: {}", trace_id),
                    }],
                    text: spans_text,
                })
            }
            command => Err(format!("unknown slash command: \"{command}\"")),
        }
    }
}

zed::register_extension!(SlashCommandsExampleExtension);
