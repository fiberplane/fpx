use crate::{
    models::{AppState, OpenProjectError, Project},
    STORE_PATH,
};
use serde_json::Value;
use std::{fs::File, io::Read, sync::Mutex};
use tauri::{AppHandle, Runtime, State, Window, WindowBuilder, WindowEvent, WindowUrl};
use tauri_plugin_store::{with_store, StoreCollection};

const RECENT_PROJECTS_STORE_KEY: &str = "recent_projects";

#[tauri::command]
pub fn list_recent_projects<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Vec<String> {
    if let Ok(recent_projects) = with_store(app, stores, STORE_PATH, |store| {
        if let Some(Value::Array(arr)) = store.get(RECENT_PROJECTS_STORE_KEY) {
            let vec_of_strings: Vec<String> = arr
                .iter()
                .filter_map(|item| item.as_str().map(|s| s.to_string()))
                .collect();

            return Ok(vec_of_strings);
        }

        Ok(vec![])
    }) {
        return recent_projects;
    }

    vec![]
}

#[tauri::command]
pub fn open_project<R: Runtime>(
    path: &str,
    window: Window,
    state: State<'_, Mutex<AppState>>,
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Result<Project, OpenProjectError> {
    let config_path = format!("{}/fpx.toml", path);

    let mut file = File::open(config_path.clone())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    let project = toml::from_str::<Project>(&contents)?;
    let mut state = state.lock().expect("failed to get lock on state");
    state.project = Some(project.clone());

    let generated_url = format!("http://localhost:{}", &project.listen_port);

    let project_window = WindowBuilder::new(
        &app,
        "studio",
        WindowUrl::External(generated_url.parse().unwrap()),
    )
    .title("fpx")
    .build()
    .expect("failed to build project window");

    window.hide().unwrap();

    project_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            window.show().unwrap();
        }
    });

    with_store(app, stores, STORE_PATH, |store| {
        let recents = match store.get(RECENT_PROJECTS_STORE_KEY) {
            Some(Value::Array(arr)) => {
                let vec_of_strings: Vec<String> = arr
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect();

                vec_of_strings
            }
            _ => vec![],
        };

        store
            .insert(RECENT_PROJECTS_STORE_KEY.into(), recents.into())
            .unwrap();

        store.save()
    })
    .unwrap();

    Ok(project)
}
