import {
  type RoutesMonitor,
  type RoutesResult,
  createRoutesMonitor,
} from "@fiberplane/source-analysis";
import { USER_PROJECT_ROOT_DIR } from "../constants.js";
import logger from "../logger/index.js";

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
  monitor.stop();
}

// Getter function for RoutesResult, this is overwritten in setupCodeAnalysis
let _resultGetter = async (): Promise<RoutesResult> => {
  return Promise.reject(new Error("Routes not yet parsed"));
};

// Public export that uses latest value of `_resultGetter` function to get the RoutesResult
export const getResult = async (): Promise<RoutesResult> => {
  return _resultGetter();
};

export function setupCodeAnalysis(monitor: RoutesMonitor) {
  let pending: Promise<void> | null = null;

  // Actual implementation of the RouteResult getter function
  _resultGetter = async () => {
    // The result uses a promise/race pattern to wait a certain amount of time for the analysis to complete
    // or use the last known result if it's available

    // Wait for the pending promise to resolve (or timeout)
    await Promise.race([pending, new Promise((r) => setTimeout(r, 100))]);

    // If there's no result and there's a pending promise, wait for it to resolve
    if (!monitor.lastSuccessfulResult && pending) {
      await pending;
    }

    // If there's a result? return it
    if (monitor.lastSuccessfulResult) {
      return monitor.lastSuccessfulResult;
    }

    // Otherwise wait for the next analysis to complete
    if (pending) {
      await pending;
    }

    // If there's a result? return it
    if (monitor.lastSuccessfulResult) {
      return monitor.lastSuccessfulResult;
    }

    throw new Error("Failed to get routes");
  };

  // Add a listener to start the analysis
  monitor.addListener("analysisStarted", () => {
    // If there's a pending promise, create a new promise that resolves when the analysis is complete
    const current = new Promise<void>((resolve) => {
      const completedHandler = () => {
        // Check if this promise is still the current one
        if (pending === current) {
          null;
        }

        monitor.removeListener("analysisCompleted", completedHandler);
        resolve();
      };

      monitor.addListener("analysisCompleted", completedHandler);
    });
    // Set the current promise as the pending promise
    pending = current;
  });

  monitor.start();
}
