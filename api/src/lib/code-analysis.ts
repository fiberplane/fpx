import { createRoutesMonitor } from "@fiberplane/source-analysis";
import { USER_PROJECT_ROOT_DIR } from "../constants.js";
import type { MessageConnection } from "vscode-jsonrpc";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import logger from "../logger.js";
import { setupCodeAnalysis } from "../routes/inference/inference.js";
import { getTSServer } from "./expand-function/tsserver/server.js";

const monitor = createRoutesMonitor(USER_PROJECT_ROOT_DIR);

// check settings if ai is enabled, and proactively start the typescript language server
// const inferenceConfig = await getInferenceConfig(db);
// const aiEnabled = inferenceConfig ? hasValidAiConfig(inferenceConfig) : false;

let tsServer: {
  connection: MessageConnection;
  tsServer: ChildProcessWithoutNullStreams;
} | null = null;

export async function enableCodeAnalysis() {
  logger.debug("Enabling code analysis");
  try {
    setupCodeAnalysis(monitor);

    // The old flow
    logger.debug(
      "Code analysis enabled. Starting typescript language server",
    );
    tsServer = await getTSServer(USER_PROJECT_ROOT_DIR);;
  } catch (error) {
    logger.error("Error starting TSServer:", error);
  }
}

export async function disableCodeAnalysis() {
  logger.debug("Disabling code analysis");
  if (tsServer) {
    tsServer.connection.dispose();
    tsServer.tsServer.kill();
  }

  monitor.teardown();
}
