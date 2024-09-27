use fpx::config::FpxConfig;
use nix::sys::signal::{killpg, Signal};
use nix::unistd::Pid;
use std::os::unix::process::CommandExt;
use std::process;
use std::sync::Mutex;
use tauri::async_runtime::spawn;
use tracing::{error, trace, warn};

#[derive(Debug, Default)]
pub struct ApiManager {
    api_pid: Mutex<Option<Pid>>,
}

impl ApiManager {
    /// Start a API server. If a API pid is already set, then that will first be
    /// shutdown.
    pub fn start_api(&self, fpx_config: FpxConfig) {
        // Make sure there is not API running atm
        self.stop_api();

        let mut envs: Vec<(&str, String)> = vec![];
        if let Some(listen_port) = fpx_config.listen_port {
            envs.push(("FPX_PORT", listen_port.to_string()));
        }

        // Start the process
        let mut child_process = process::Command::new("pnpm")
            .arg("dev:api")
            .process_group(0)
            .envs(envs)
            .spawn()
            .expect("should be able to execute"); // TODO

        // Set the API pid, indicating that the API server is up
        let pid = child_process.id();
        self.set_api_pid(Pid::from_raw(pid as i32));

        // Spawn a task to wait for the child process to exit, and
        // potentially log an error
        spawn(async move {
            let result = child_process.wait();
            if let Err(err) = result {
                error!(?err, "child process exited with error");
            }
        });
    }

    /// Sends the SIGTERM signal to the API process group. If no API pid was set
    /// then this function will do nothing.
    pub fn stop_api(&self) {
        let Some(api_pid) = self.api_pid.lock().expect("lock is poisoned").take() else {
            trace!("No API running");
            return;
        };

        trace!(?api_pid, "sending SIGTERM signal to API process group");

        let result = killpg(api_pid, Signal::SIGTERM);
        if let Err(errno) = result {
            warn!(
                ?errno,
                ?api_pid,
                "failed to send SIGNTERM signal to API process group"
            );
        }
    }

    /// Set the API pid. By setting this it is implied that the API server is up
    /// and running.
    fn set_api_pid(&self, api_pid: Pid) {
        *self.api_pid.lock().expect("lock is poisoned") = Some(api_pid);
    }
}
