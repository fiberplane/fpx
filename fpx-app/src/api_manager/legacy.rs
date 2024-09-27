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
        // Get a lock for the duration of this function
        let mut api_pid = self.api_pid.lock().expect("lock is poisoned");

        // If there is a API pid already there, then first send the SIGTERM
        // signal to that process group.
        if let Some(api_pid) = api_pid.take() {
            // shutdown any existing api server
            Self::send_sigterm_signal(api_pid);
        }

        // Create some environment variables overrides based on the fpx.toml
        let mut envs: Vec<(&str, String)> = vec![];
        if let Some(listen_port) = fpx_config.listen_port {
            envs.push(("FPX_PORT", listen_port.to_string()));
        }

        // Start the process using pnpm. The process_group=0 will ensure that
        // the process group ID is the same as the root process ID.
        let mut child_process = process::Command::new("pnpm")
            .arg("dev:api")
            .process_group(0) //
            .envs(envs)
            .spawn()
            .expect("should be able to execute"); // TODO

        // Once the process is running, get the pid and store it in the mutex,
        // so that we can send signals to it later.
        let pid = child_process.id();
        *api_pid = Some(Pid::from_raw(pid as i32));

        // Spawn a task to wait for the child process to exit, and potentially
        // log an error
        spawn(async move {
            let result = child_process.wait();
            if let Err(err) = result {
                error!(?err, api_pid=?pid, "child process exited with error");
            } else {
                trace!(api_pid=?pid, "API server exited successfully");
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

        Self::send_sigterm_signal(api_pid)
    }

    /// Send the SIGTERM signal to the specified process group.
    ///
    /// This uses a Process ID type instead of a specific process group ID as
    /// that does not exist.
    fn send_sigterm_signal(api_pid: Pid) {
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
}
