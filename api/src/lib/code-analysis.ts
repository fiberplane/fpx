import { createRoutesMonitor } from "@fiberplane/source-analysis";
import { USER_PROJECT_ROOT_DIR } from "../constants.js";
import logger from "../logger/index.js";
import { setupCodeAnalysis } from "../routes/inference/inference.js";

const monitor = createRoutesMonitor(
  USER_PROJECT_ROOT_DIR,
  logger.withTag("code-analysis"),
);

export async function enableCodeAnalysis() {
  logger.debug("Enabling code analysis");
  try {
    setupCodeAnalysis(monitor);
  } catch (error) {
    logger.error("Error starting TSServer:", error);
  }
}

export async function disableCodeAnalysis() {
  logger.debug("Disabling code analysis");
  monitor.teardown();
}
