import { Requestornator } from "./queries";

export function sortRequestornatorsDescending(
  a: Requestornator,
  b: Requestornator,
) {
  const aLatestTimestamp = a.app_requests?.updatedAt;
  const bLatestTimestamp = b.app_requests?.updatedAt;
  if (aLatestTimestamp > bLatestTimestamp) {
    return -1;
  }
  if (aLatestTimestamp < bLatestTimestamp) {
    return 1;
  }
  return 0;
}
