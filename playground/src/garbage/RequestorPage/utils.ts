import type { ProxiedRequestResponse } from "./queries";

export function sortProxiedRequestResponsesDescending(
  a: ProxiedRequestResponse,
  b: ProxiedRequestResponse,
) {
  try {
    const aLatestTimestamp = a.app_requests?.updatedAt;
    const bLatestTimestamp = b.app_requests?.updatedAt;

    // Handle potential null/undefined values
    if (!aLatestTimestamp) {
      return 1;
    }
    if (!bLatestTimestamp) {
      return -1;
    }

    const aDate = new Date(normalizeTimestamp(aLatestTimestamp));
    const bDate = new Date(normalizeTimestamp(bLatestTimestamp));

    return bDate.getTime() - aDate.getTime();
  } catch (e) {
    console.error("Error sorting ProxiedRequestResponses", e);
    return 0;
  }
}

/**
 * Converts various timestamp formats to ISO 8601
 * Handles both SQLite (YYYY-MM-DD HH:MM:SS.SSS) and ISO 8601 formats
 * Returns original timestamp if format is unknown
 */
const normalizeTimestamp = (timestamp: string): string => {
  // Regular expression to check for ISO 8601 format
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

  // Regular expression to check for SQLite format
  const sqliteRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

  // If it's already ISO 8601, return as is
  if (iso8601Regex.test(timestamp)) {
    return timestamp;
  }

  // If it matches SQLite format, convert it
  if (sqliteRegex.test(timestamp)) {
    return `${timestamp.replace(" ", "T")}Z`;
  }

  // Return original timestamp if format is unknown
  console.warn(
    "[normalizeTimestamp] Warning: Unrecognized timestamp format",
    timestamp,
  );
  return timestamp;
};
