import { RoutesMonitor } from "./RoutesMonitor";
import { type Logger, logger } from "./logger";

export function createRoutesMonitor(
  projectRoot: string,
  overrideLogger?: Logger,
): RoutesMonitor {
  if (overrideLogger) {
    logger.logger = overrideLogger;
  }

  return new RoutesMonitor(projectRoot);
}
