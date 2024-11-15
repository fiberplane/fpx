import { logger, type Logger } from "./logger";
import { RoutesMonitor } from "./RoutesMonitor";

export function createRoutesMonitor(projectRoot: string, overrideLogger?: Logger): RoutesMonitor {
  if (overrideLogger) {
    logger.logger = overrideLogger;
  }

  return new RoutesMonitor(projectRoot);
}
