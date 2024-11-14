import { RoutesMonitor } from "./RoutesMonitor";
import type { Logger } from "./types";

export function createRoutesMonitor(projectRoot: string, logger?: Logger) {
  return new RoutesMonitor(projectRoot, logger);
}
