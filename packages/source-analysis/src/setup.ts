import { RoutesMonitor } from "./RoutesMonitor";

export function createRoutesMonitor(projectRoot: string) {
  return new RoutesMonitor(projectRoot);
}
