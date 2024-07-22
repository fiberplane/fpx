import { MizuOrphanLog, MizuSpan, isMizuOrphanLog } from "@/queries";
import { minimapId } from "../minimapId";

/**
 * Helper to correlate entries in the timeline with elements on the page
 *
 * Note that the timeline only correlates from its _first_ log.
 * E.g., an "Incoming Request" will link to the Card containing request details,
 * but not the response details (for now, until the UI is updated to show req/res details together)
 */
export function timelineId(logOrSpan: MizuOrphanLog | MizuSpan) {
  const log = isMizuOrphanLog(logOrSpan) ? logOrSpan : logOrSpan.logs[0];
  return minimapId(log);
}
