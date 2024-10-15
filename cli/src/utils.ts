import { spawn } from "node:child_process";
import { cancel, log } from "@clack/prompts";
import { CANCEL_MESSAGE } from "./const";

export function getPackageManager() {
  return process.env.npm_config_user_agent?.split("/").at(0);
}

export async function runShell(cwd: string, commands: string[]): Promise<void> {
  const commandStr = commands.join(" ");

  return new Promise((resolve, reject) => {
    const child = spawn(commandStr, [], { cwd, shell: true, timeout: 60000 });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    // Swallow stdout and stderr
    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});
  });
}

export function handleError(error: Error) {
  log.error(`create-honc-app exited with an error: ${error.message}`);
  process.exit(1);
}

export function handleCancel() {
  cancel(CANCEL_MESSAGE);
  process.exit(0);
}
