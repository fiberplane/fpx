import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { basename, dirname } from "node:path";
import { cancel, log } from "@clack/prompts";
import { CANCEL_MESSAGE } from "./const";
import { CodeGenError } from "./types";

export function getPackageManager() {
  return process.env.npm_config_user_agent?.split("/").at(0);
}

export function getProjectName(path: string) {
  try {
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return basename(path);
    }
    // If it's a file, return the parent directory name
    return basename(dirname(path));
  } catch {
    // If the path doesn't exist, just return the last part of the path
    return basename(path);
  }
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

export function handleError(error: Error | CodeGenError) {
  if (error instanceof CodeGenError) {
    log.warn(
      `Could not scaffold project according to your description\n(error: ${error.message})`,
    );
    log.info("Continuing...");
  } else {
    log.error(`exiting with an error: ${error.message}`);
    process.exit(1);
  }
}

export function handleCancel() {
  cancel(CANCEL_MESSAGE);
  process.exit(0);
}

export function safeReadFile(path: string) {
  try {
    return readFileSync(path, "utf-8");
  } catch (_error) {
    return null;
  }
}
