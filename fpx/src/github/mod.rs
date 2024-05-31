use crate::events::EventsState;
use crate::types::{IssueMessage, ServerMessage};
use anyhow::{Context, Result};
use cargo_toml::{Manifest, Value};
use notify_rust::Notification;
use std::fs;
use tracing::{info, trace};

pub struct GitHubCrawler {
    events: EventsState<ServerMessage>,
    path: String,
    github_token: String,
}

impl GitHubCrawler {
    pub fn new(
        events: EventsState<ServerMessage>,
        path: impl Into<String>,
        github_token: impl Into<String>,
    ) -> Self {
        GitHubCrawler {
            events,
            path: path.into(),
            github_token: github_token.into(),
        }
    }

    pub async fn run(&mut self) -> Result<()> {
        let interesting_files = Self::find_interesting_files(&self.path)?;

        for file in interesting_files {
            // Process according to type, which is only Cargo.toml for now.
            info!(file=?file, "Processing file");
            self.handle_cargo_toml(&file).await?;
        }

        Ok(())
    }

    fn find_interesting_files(root_path: &str) -> Result<Vec<String>> {
        trace!(directory=?root_path, "Crawling directory for interesting files");
        let mut results = vec![];

        for entry in fs::read_dir(&root_path)
            .with_context(|| format!("unable to crawl directory: {}", root_path))?
        {
            let entry = entry?; // Just bubble up errors for now
            let path = entry.path();
            let basename = path.file_name().unwrap().to_string_lossy();
            let metadata = entry.metadata()?; // This does not deal with symlinks, shrug

            if metadata.is_file() {
                if GOOD_FILE_NAMES.contains(&basename.as_ref()) {
                    trace!(file=?basename, "Found an interesting file");
                    results.push(path.to_string_lossy().to_string());
                }
            }

            if metadata.is_dir() {
                if IGNORED_DIRECTORIES.contains(&basename.as_ref()) {
                    trace!(directory=?basename, "Ignoring directory");
                    continue;
                }

                let mut inner_results = Self::find_interesting_files(path.to_str().unwrap())?;
                results.append(&mut inner_results);
            }
        }

        Ok(results)
    }

    async fn handle_cargo_toml(&self, file: &str) -> Result<()> {
        let metadata: Manifest<Value> = Manifest::from_path_with_metadata(&file)?;

        let crates = metadata
            .dependencies
            .iter()
            .filter_map(
                |(name, dep)| {
                    if dep.is_crates_io() {
                        Some(name)
                    } else {
                        None
                    }
                },
            )
            .take(10); // Just limit to 10 for now

        let client = reqwest::Client::builder().user_agent("fpx/0.1.0").build()?;
        let github_client = octocrab::Octocrab::builder()
            .personal_token(self.github_token.clone())
            .build()?;

        for crate_name in crates {
            trace!(?crate_name, "Fetching crate details");
            let crate_details = fetch_crate_details(&client, &crate_name).await?;
            if let Some(repository) = crate_details.crate_.repository {
                trace!(?crate_name, ?repository, "Create has repository field");

                let Some((repo_owner, repo_name)) = extract_github_details(&repository) else {
                    trace!(?crate_name, "Skipping; Not GitHub or unable to parse");
                    continue;
                };

                trace!(?crate_name, ?repository, "Fetching issues for repository");

                let issues = github_client
                    .issues(&repo_owner, &repo_name)
                    .list()
                    .send()
                    .await
                    .with_context(|| {
                        format!("unable to fetch issues for {}/{}", repo_owner, repo_name)
                    })?;
                for issue in issues {
                    trace!(?crate_name, ?repository, issue_number = ?issue.number, "Broadcasting for issue");

                    let message = IssueMessage::new(
                        &repo_owner,
                        &repo_name,
                        issue.number,
                        &issue.title,
                        issue.body_text.unwrap_or("no body".to_owned()),
                        issue.user.login,
                    );
                    self.events.broadcast(message.into());
                    Notification::new()
                        .summary(&issue.title)
                        .body(&format!("{repo_owner}/{repo_name}#{}", issue.number))
                        .icon("firefox")
                        .show()
                        .unwrap();
                }
            }
        }

        Ok(())
    }
}

const IGNORED_DIRECTORIES: [&str; 3] = ["target", ".git", "node_modules"];
const GOOD_FILE_NAMES: [&str; 1] = ["Cargo.toml"];

fn extract_github_details(repository: &str) -> Option<(String, String)> {
    let repository = repository.strip_prefix("https://github.com/")?;

    let (owner, repo) = repository.split_once('/')?;

    let repo = {
        match repo.split_once(".") {
            Some((repo, _)) => repo,
            None => repo,
        }
    };

    Some((owner.to_lowercase(), repo.to_lowercase()))
}

#[derive(serde::Deserialize)]
struct GetCrateDetails {
    #[serde(rename = "crate")]
    crate_: CrateDetails,
}

#[derive(serde::Deserialize)]
struct CrateDetails {
    repository: Option<String>,
}

async fn fetch_crate_details(
    client: &reqwest::Client,
    crate_name: &str,
) -> Result<GetCrateDetails> {
    let url = format!("https://crates.io/api/v1/crates/{crate_name}");
    let response = client.get(&url).send().await?;
    let details = response.json().await?;

    Ok(details)
}
